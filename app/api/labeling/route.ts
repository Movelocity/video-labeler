import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { LabelDataV2, LabelObject, LabelDataV1, isLegacyFormat } from '@/lib/types';
import { randomColor, safeTimeKey } from '@/lib/utils';
import { TIME_DIFF_THRESHOLD } from '@/lib/constants';
import { autoIncrementId } from '@/lib/utils';
export const runtime = "nodejs";


  
/** 转换标签数据, 输入旧数据结构，返回新版本数据结构，新版兼容旧版 */
const transformLabels = (data: LabelDataV1): LabelDataV2 => {
  const labelGroups = new Map<string, LabelObject>();

  // 遍历所有时间点的标签
  Object.entries(data.labels).forEach(([time, boxes]) => {
    boxes.forEach((box) => {
      // 移除 "_开始" 和 "_结束" 后缀
      const baseLabel = box.label.replace(/_(开始|结束)$/, '');
      
      if (!labelGroups.has(baseLabel)) {
        labelGroups.set(baseLabel, {
          id: autoIncrementId(data),
          label: baseLabel,
          color: randomColor(),
          timeline: {}
        });
      }

      const labelObject = labelGroups.get(baseLabel)!;
      labelObject.timeline[safeTimeKey(time)] = box;
    });
  });

  // 转换为数组格式
  const objects = Array.from(labelGroups.values());

  // 返回新版本数据结构
  return {
    metadata: data.metadata,
    labels: data.labels, // 保留旧数据以兼容
    objects,
    version: 2
  };
};

/**读取标签数据，遇到旧版标签文件则自动迁移数据格式。如果没有对应文件则返回默认的 LabelDataV2 数据*/
const readAndMigrateLabelData = (filePath: string): LabelDataV2 => {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (isLegacyFormat(data)) {
      // 转换并保存新格式
      const migratedData = transformLabels(data);
      fs.writeFileSync(filePath, JSON.stringify(migratedData, null, 2));
      return migratedData;
    }

    data.objects.forEach((obj: LabelObject) => {  // 确保键名不会变成 0.0123901238194187, 而是总共只有7个字符 0.01239
      obj.timeline = Object.fromEntries(
        Object.entries(obj.timeline).map(([time, box]) => [safeTimeKey(time), {...box, label: obj.label}])
      );
    })
    data.metadata.nextId = data.metadata.nextId??data.objects.length + 1;
    
    return data as LabelDataV2;
  }
  
  // 创建新的空数据结构
  return {
    metadata: {},
    objects: [],
    version: 2
  };
};

/**获取标签文件路径的辅助函数，
 * 如果未指定labelFile，则在 videoPath 同路径的 .cache/{videoName}.json */
const getLabelFilePath = (videoPath: string, labelFile: string | null): string => {
  const { VIDEO_ROOT, LABELS_ROOT } = getConfig();
  
  if (labelFile) {
    return path.join(LABELS_ROOT, labelFile);
  } else {
    const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(videoPath), ".cache");
    return path.join(cacheDirectory, `${path.basename(videoPath)}.json`);
  }
};

/**确保缓存目录存在的辅助函数*/
const ensureCacheDirectory = (videoPath: string): void => {
  const { VIDEO_ROOT } = getConfig();
  const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(videoPath), ".cache");
  if (!fs.existsSync(cacheDirectory)) {
    fs.mkdirSync(cacheDirectory, { recursive: true });
  }
};

async function handleV2(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') ?? "";

  switch (action) {
    case "read":
      return handleReadV2(searchParams);
    case "write":
      return handleWriteV2(req, searchParams);
    case "delete":
      return handleDeleteV2(searchParams);
    default:
      return NextResponse.json(
        { msg: "Only support actions: 'read', 'write', 'delete'" }, 
        { status: 404 }
      );
  }
}

/**读取标签数据*/
function handleReadV2(searchParams: URLSearchParams) {
  const video_path = searchParams.get('video_path') ?? "";
  const filePath = getLabelFilePath(video_path, searchParams.get('label_path'));

  try {
    const data = readAndMigrateLabelData(filePath);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { msg: `Error reading file: ${filePath}`, error }, 
      { status: 500 }
    );
  }
}

/** 写入标签数据, 采用合并的方式写入，允许只提交一些 objects，不用发送全部 objects */
async function handleWriteV2(req: NextRequest, searchParams: URLSearchParams) {
  const object_updates = await req.json();
  const video_path = searchParams.get('video_path') ?? "";
  const labelFilePath = getLabelFilePath(video_path, searchParams.get('label_path'));
  // console.log("写入标签数据: ", object_updates)
  try {
    ensureCacheDirectory(video_path);
    const data = readAndMigrateLabelData(labelFilePath);
    
    // 更新或添加对象
    object_updates.forEach((update: LabelObject) => {
      const existingIndex = data.objects.findIndex(obj => obj.id === update.id);
      if (existingIndex !== -1) {
        // 合并时间线数据
        data.objects[existingIndex].timeline = {
          ...data.objects[existingIndex].timeline,
          ...update.timeline
        };
        data.objects[existingIndex].label = update.label;
      } else {
        data.objects.push(update);
      }
    });
    data.metadata.nextId = data.objects.length + 1;
    
    fs.writeFileSync(labelFilePath, JSON.stringify(data, null, 2));
    return NextResponse.json(
      { message: 'Labels saved successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { msg: 'Error saving labels', error }, 
      { status: 500 }
    );
  }
}

/**删除标签数据*/
async function handleDeleteV2(searchParams: URLSearchParams) {
  const video_path = searchParams.get('video_path') ?? "";
  const obj_id = searchParams.get('obj_id') ?? "";
  const timePoint = searchParams.get('time') ?? "";
  
  const filePath = getLabelFilePath(video_path, searchParams.get('label_path'));

  try {
    const data = readAndMigrateLabelData(filePath);
    const timeToDelete = parseFloat(timePoint);

    // 查找对应的对象
    const targetObject = data.objects.find(obj => obj.id === obj_id);
    if (targetObject) {
      // 删除时间点附近的标签
      Object.keys(targetObject.timeline).forEach(t => {
        const diff = Math.abs(parseFloat(t) - timeToDelete);
        if (diff < TIME_DIFF_THRESHOLD) {
          delete targetObject.timeline[t];
        }
      });

      // 如果对象没有任何时间点了，则删除整个对象
      if (Object.keys(targetObject.timeline).length === 0) {
        data.objects = data.objects.filter(obj => obj.id !== obj_id);
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({
      message: 'Labels deleted successfully'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Error deleting labels', error }, 
      { status: 500 }
    );
  }
}

// v2 API endpoints
export const GET = handleV2;
export const POST = handleV2;
export const DELETE = handleV2;

