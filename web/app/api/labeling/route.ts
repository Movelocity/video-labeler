import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VIDEO_ROOT } from '../config';

const TIME_DIFF_THRESHOLD = 0.005;

export async function handle(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action') ?? "";
  console.log("标注动作: ", searchParams)
  switch (action) {
    case "read":
      return handleRead(searchParams);

    case "write":
      return handleWrite(req);

    case "delete":
      return handleDelete(searchParams);

    default:
      return NextResponse.json({ msg: "Only support actions: 'read', 'write', 'delete'" }, { status: 404 });
  }
}

function handleRead(searchParams:URLSearchParams) {
  const videopath = searchParams.get('videopath') ?? "";
  const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(videopath), ".cache");
  const labelFile = path.join(cacheDirectory, `${path.basename(videopath)}.json`);
  // console.log("获取标注: "+labelFile)
  if (fs.existsSync(labelFile)) {
    const fileContent = fs.readFileSync(labelFile, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data, { status: 200 });
  } else {
    return NextResponse.json({ msg: 'File not found: ' + labelFile }, { status: 404 });
  }
}

interface Data {
  metadata: Record<string, any>;
  labels: Record<string, any>; // Adjust the type of `any` to the specific type of `boxes` if known
}

async function handleWrite(req: NextRequest) {
  const { video_name, boxes, time } = await req.json();
  const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(video_name), ".cache");
  const filePath = path.join(cacheDirectory, `${path.basename(video_name)}.json`);
  // console.log("新增标注: ", filePath)
  // Ensure the cache directory exists
  if (!fs.existsSync(cacheDirectory)) {
    fs.mkdirSync(cacheDirectory, { recursive: true });
  }
  let data:Data = { metadata: {}, labels: {} };

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContent);
  }

  data.labels[time] = boxes;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return NextResponse.json({ message: 'Labels saved successfully' }, { status: 200 });
}

function handleDelete(searchParams: URLSearchParams) {
  const video_name = searchParams.get('videopath') ?? "";
  const time = searchParams.get('time') ?? "";
  const cacheDirectory = path.join(VIDEO_ROOT, path.dirname(video_name), ".cache");
  const filePath = path.join(cacheDirectory, `${path.basename(video_name)}.json`);
  // console.log("删除标注: "+filePath, time)
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const timeToDelete = parseFloat(time);

    const timesToDelete = Object.keys(data.labels).filter(labelTime => {
      const diff = Math.abs(parseFloat(labelTime) - timeToDelete);
      return diff < TIME_DIFF_THRESHOLD;
    });
    // console.log("timeToDelete", timeToDelete)
    timesToDelete.forEach(t => {
      delete data.labels[t];
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      message: 'Labels deleted successfully',
      deletedCount: timesToDelete.length
    }, { status: 200 });
  } else {
    return NextResponse.json({ message: 'Video data not found' }, { status: 404 });
  }
}

export const GET = handle
export const POST = handle
export const DELETE = handle