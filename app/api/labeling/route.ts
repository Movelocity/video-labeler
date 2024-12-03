import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';

export const runtime = "nodejs";

const TIME_DIFF_THRESHOLD = 0.005;

interface LabelData {
  metadata: Record<string, any>;
  labels: Record<string, any>;
}

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

// 读取或创建标签数据的辅助函数
const getOrCreateLabelData = (filePath: string): LabelData => {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return { metadata: {}, labels: {} };
};

async function handle(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') ?? "";

  switch (action) {
    case "read":
      return handleRead(searchParams);
    case "write":
      return handleWrite(req, searchParams);
    case "delete":
      return handleDelete(searchParams);
    default:
      return NextResponse.json(
        { msg: "Only support actions: 'read', 'write', 'delete'" }, 
        { status: 404 }
      );
  }
}

function handleRead(searchParams: URLSearchParams) {
  const videopath = searchParams.get('videopath') ?? "";
  const filePath = getLabelFilePath(videopath, searchParams.get('label_file'));

  try {
    const data = getOrCreateLabelData(filePath);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { msg: `Error reading file: ${filePath}`, error }, 
      { status: 500 }
    );
  }
}

async function handleWrite(req: NextRequest, searchParams: URLSearchParams) {
  const { video_name, boxes, time } = await req.json();
  const filePath = getLabelFilePath(video_name, searchParams.get('label_file'));

  try {
    ensureCacheDirectory(video_name);
    const data = getOrCreateLabelData(filePath);
    data.labels[time] = boxes;
    
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

function handleDelete(searchParams: URLSearchParams) {
  const videopath = searchParams.get('videopath') ?? "";
  const time = searchParams.get('time') ?? "";
  const filePath = getLabelFilePath(videopath, searchParams.get('label_file'));

  try {
    const data = getOrCreateLabelData(filePath);
    const timeToDelete = parseFloat(time);

    const timesToDelete = Object.keys(data.labels).filter(labelTime => {
      const diff = Math.abs(parseFloat(labelTime) - timeToDelete);
      return diff < TIME_DIFF_THRESHOLD;
    });

    timesToDelete.forEach(t => {
      delete data.labels[t];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      message: 'Labels deleted successfully',
      deletedCount: timesToDelete.length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { msg: 'Error deleting labels', error }, 
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;

