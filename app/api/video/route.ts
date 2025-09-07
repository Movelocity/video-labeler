import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const video_path = searchParams.get('video_path')
  // const label_path = searchParams.get('label_path')
  if(!video_path || typeof video_path != typeof "") {
    return NextResponse.json({msg: "请输入有效的 searchParam"}, {status: 404})
  }
  const { VIDEO_ROOT } = getConfig();
  const absFilePath = path.join(VIDEO_ROOT, video_path as string)

  if (!fs.existsSync(absFilePath) || !fs.lstatSync(absFilePath).isFile()) {
      return NextResponse.json({ msg: "文件未找到" }, { status: 404 });
  }

  const stat = fs.statSync(absFilePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');
  const contentType = "video/"+path.extname(video_path);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;

    const fileStream = fs.createReadStream(absFilePath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
    };

    return new NextResponse((fileStream as any), { status: 206, headers: (headers as any) });
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };

    const fileStream = fs.createReadStream(absFilePath);
    return new NextResponse((fileStream as any), { headers: (headers as any) });
  }
}

