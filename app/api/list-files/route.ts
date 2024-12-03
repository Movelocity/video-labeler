import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
export const runtime = "nodejs";
import { supportedExtensions } from '@/common/videos';
import { type FileInfo } from '@/common/types'

// 获取配置
// const { VIDEO_ROOT, LABELS_ROOT } = getConfig();

// 构造 video_path -> label_path 的映射
function createVideoLabelMap(videoRoot: string, labelsRoot: string) {
  if(!labelsRoot) return {}

  const videoPaths: string[] = [];
  const labelPaths: string[] = [];

  // 扫描 VIDEO_ROOT 下的所有 mp4 文件
  const scanDirectory = (root: string, ext: string, collector: string[]) => {
    const items = fs.readdirSync(root);
    items.forEach(item => {
      const fullPath = path.join(root, item);
      if (fs.lstatSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, ext, collector);
      } else if (fullPath.endsWith(ext)) {
        collector.push(path.relative(ext.endsWith('json')?labelsRoot:videoRoot, fullPath));
      }
    });
  };

  scanDirectory(videoRoot, '.mp4', videoPaths);
  scanDirectory(videoRoot, '.MP4', videoPaths);
  scanDirectory(videoRoot, '.mkv', videoPaths);
  // console.log("scanDirectory:", videoRoot, '.mp4', videoPaths)
  scanDirectory(labelsRoot, '.json', labelPaths);
  // console.log("scanDirectory:", labelsRoot, '.json', labelPaths)

  // 创建映射
  const videoLabelMap: Record<string, string> = {};
  videoPaths.forEach(videoPath => {
    // 标签文件名 = 视频文件名+.json
    const baseName = path.basename(videoPath);
    const labelFile = labelPaths.find(labelPath => path.basename(labelPath, '.json') === baseName);
    videoLabelMap[videoPath] = labelFile || '';
  });
  // console.log("videoLabelMap:", videoLabelMap)
  return videoLabelMap;
}

// 提取标签文件中的标签列表
function extractLabelsFromFile(labelFilePath: string): string[] {
  // console.log("check labelfile:", labelFilePath)
  if (!fs.existsSync(labelFilePath)) return [];

  const fileContent = fs.readFileSync(labelFilePath, 'utf8');
  try {
    const jsonData = JSON.parse(fileContent);
    const labelSet = new Set<string>();

    for (const key in jsonData.labels) {
      const labelEntries = jsonData.labels[key];
      // console.log("labelEntries", labelEntries)
      labelEntries.forEach((entry: any) => {
        if (entry.label) {
          labelSet.add(entry.label);
        }
      });
    }

    return Array.from(labelSet);
  } catch (error) {
    console.error(`Error parsing JSON file ${labelFilePath}:`, error);
    return [];
  }
}


const isVideoFile = (filePath: string) => {
  if (!supportedExtensions.includes(path.extname(filePath))) return false;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const directory = searchParams.get('directory') ?? "";
  console.log("list-files", directory)
  // 获取最新配置
  const { VIDEO_ROOT, LABELS_ROOT } = getConfig();
  const absDir = path.join(VIDEO_ROOT, directory);

  if (!fs.existsSync(absDir) || !fs.lstatSync(absDir).isDirectory()) {
    return NextResponse.json([{name: "当前路径无文件", size: 0, modified_time: "", type: "file"}]);
  }

  // 获取视频到标签的映射
  const videoLabelMap = createVideoLabelMap(VIDEO_ROOT, LABELS_ROOT);

  const items = fs.readdirSync(absDir);
  const fileDetails: FileInfo[] = items.map(item => {
    const itemFullPath = path.join(absDir, item);
    const isFile = fs.lstatSync(itemFullPath).isFile();
    const relativePath = path.relative(VIDEO_ROOT, itemFullPath);
    const labelFileRelativePath = isFile && isVideoFile(itemFullPath) ? videoLabelMap[relativePath] || '' : '';
    const labelFileFullPath = labelFileRelativePath ? path.join(LABELS_ROOT, labelFileRelativePath) : '';

    // 提取标签列表
    // console.log("labelFileRelativePath: ", labelFileRelativePath)
    const labels = labelFileRelativePath ? extractLabelsFromFile(labelFileFullPath) : [];

    return {
      name: item,
      label_file: labelFileRelativePath,
      labels,
      size: isFile ? fs.statSync(itemFullPath).size : null,
      modified_time: isFile ? fs.statSync(itemFullPath).mtime.toISOString() : null,
      type: isFile ? 'file' : 'dir'
    };
  });

  return NextResponse.json(fileDetails);
}