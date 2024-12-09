import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';

export const runtime = "nodejs";

const TIME_DIFF_THRESHOLD = 0.005;

interface Box {
  sx: number;
  sy: number;
  w: number;
  h: number;
  label: string;
}

interface Timeline {
  [time: string]: Box;
}

interface LabelObject {
  label: string;
  timeline: Timeline;
}

interface LabelDataV1 {
  metadata: Record<string, any>;
  labels: Record<string, Box[]>;
}

interface LabelDataV2 {
  metadata: Record<string, any>;
  labels?: Record<string, Box[]>; // Optional for backward compatibility
  objects: LabelObject[];
  version: 2;
}

type LabelData = LabelDataV1 | LabelDataV2;

// 检测是否为旧版标签文件
const isLegacyFormat = (data: any): data is LabelDataV1 => {
  return !('version' in data) || !('objects' in data);
};

// 转换标签数据的函数
const transformLabels = (data: LabelDataV1): LabelDataV2 => {
  const labelGroups = new Map<string, LabelObject>();

  // 遍历所有时间点的标签
  Object.entries(data.labels).forEach(([time, boxes]) => {
    boxes.forEach((box) => {
      // 移除 "_开始" 和 "_结束" 后缀
      const baseLabel = box.label.replace(/_(开始|结束)$/, '');
      
      if (!labelGroups.has(baseLabel)) {
        labelGroups.set(baseLabel, {
          label: baseLabel,
          timeline: {}
        });
      }

      const labelObject = labelGroups.get(baseLabel)!;
      labelObject.timeline[time] = box;
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

// 读取并自动迁移标签数据
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
    
    return data as LabelDataV2;
  }
  
  // 创建新的空数据结构
  return {
    metadata: {},
    objects: [],
    version: 2
  };
};

// 获取标签文件路径的辅助函数
const getLabelFilePath = (videoPath: string, labelFile: string | null): string => {
  const { VIDEO_ROOT, LABELS_ROOT } = getConfig();
  
  if (labelFile) {
    return path.join(LABELS_ROOT, labelFile);
  }
  
  const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(videoPath), ".cache");
  return path.join(cacheDirectory, `${path.basename(videoPath)}.json`);
};

// 确保缓存目录存在的辅助函数
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
      return handleDeleteV2(req, searchParams);
    default:
      return NextResponse.json(
        { msg: "Only support actions: 'read', 'write', 'delete'" }, 
        { status: 404 }
      );
  }
}

function handleReadV2(searchParams: URLSearchParams) {
  const videopath = searchParams.get('videopath') ?? "";
  const filePath = getLabelFilePath(videopath, searchParams.get('label_file'));

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

async function handleWriteV2(req: NextRequest, searchParams: URLSearchParams) {
  const { video_name, object_updates } = await req.json();
  const filePath = getLabelFilePath(video_name, searchParams.get('label_file'));

  try {
    ensureCacheDirectory(video_name);
    const data = readAndMigrateLabelData(filePath);
    
    // 更新或添加对象
    object_updates.forEach((update: LabelObject) => {
      const existingIndex = data.objects.findIndex(obj => obj.label === update.label);
      if (existingIndex !== -1) {
        // 合并时间线数据
        data.objects[existingIndex].timeline = {
          ...data.objects[existingIndex].timeline,
          ...update.timeline
        };
      } else {
        data.objects.push(update);
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

async function handleDeleteV2(req: NextRequest, searchParams: URLSearchParams) {
  const { video_name, label, time } = await req.json();
  const filePath = getLabelFilePath(video_name, searchParams.get('label_file'));

  try {
    const data = readAndMigrateLabelData(filePath);
    const timeToDelete = parseFloat(time);

    // 查找对应的对象
    const targetObject = data.objects.find(obj => obj.label === label);
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
        data.objects = data.objects.filter(obj => obj.label !== label);
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

