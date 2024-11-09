import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VIDEO_ROOT } from '../config';
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const directory = searchParams.get('directory')??""
  
  const absDir = path.join(VIDEO_ROOT, directory)

  if (!fs.existsSync(absDir) || !fs.lstatSync(absDir).isDirectory()) {
    return NextResponse.json([{name: "当前路径无文件", size: 0, modified_time: "", type: "file"}])
  }

  const items = fs.readdirSync(absDir);
  const fileDetails = items.map(item => {
    const itemFullPath = path.join(absDir, item);
    const isFile = fs.lstatSync(itemFullPath).isFile();
    return {
      name: item,
      size: isFile ? fs.statSync(itemFullPath).size : null,
      modified_time: isFile ? fs.statSync(itemFullPath).mtime.toISOString() : null,
      type: isFile ? 'file' : 'dir'
    };
  });

  return NextResponse.json(fileDetails)
}