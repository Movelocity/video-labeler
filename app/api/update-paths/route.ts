import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { updateConfig } from '../config';
export const runtime = "nodejs"

interface UpdatePathsBody {
  videoRoot?: string;
  labelsRoot?: string;
}

// 更新路径处理函数
const validatePath = (pathStr: string) => {
  try {
    // 处理 Windows 路径，保留空格
    const normalizedPath = pathStr
      .replace(/\\/g, '/') // 统一使用正斜杠
      .replace(/"/g, '') // 移除可能存在的引号
      .trim(); // 移除首尾空格

    if (!fs.existsSync(normalizedPath)) {
      return false;
    }
    const stats = fs.statSync(normalizedPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: UpdatePathsBody = await req.json();
    let { videoRoot, labelsRoot } = body;

    // 处理输入路径
    if (videoRoot) {
      videoRoot = videoRoot.trim();
    }
    if (labelsRoot) {
      labelsRoot = labelsRoot.trim();
    }

    if (!videoRoot && !labelsRoot) {
      return NextResponse.json(
        { error: "至少需要提供一个路径" },
        { status: 400 }
      );
    }

    // 验证路径
    if (videoRoot && !validatePath(videoRoot)) {
      return NextResponse.json(
        { error: "视频路径无效或不可访问" },
        { status: 400 }
      );
    }

    if (labelsRoot && !validatePath(labelsRoot)) {
      return NextResponse.json(
        { error: "标签路径无效或不可访问" },
        { status: 400 }
      );
    }

    // 读取现有的 .env.local 文件内容
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      envContent = fs.existsSync(envPath) 
        ? fs.readFileSync(envPath, 'utf-8') 
        : '';
    } catch (error) {
      console.error('读取 .env.local 失败:', error);
    }

    // 解析现有环境变量，保留引号处理
    const envVars = new Map();
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key) {
        envVars.set(key.trim(), values.join('=').trim());
      }
    });

    // 更新环境变量
    if (videoRoot) {
      const formattedPath = videoRoot.includes(' ') ? `"${videoRoot}"` : videoRoot;
      envVars.set('VIDEO_ROOT', formattedPath);
      process.env.VIDEO_ROOT = videoRoot;
    }
    if (labelsRoot) {
      const formattedPath = labelsRoot.includes(' ') ? `"${labelsRoot}"` : labelsRoot;
      envVars.set('LABELS_ROOT', formattedPath);
      process.env.LABELS_ROOT = labelsRoot;
    }

    // 更新运行时配置
    updateConfig({
      VIDEO_ROOT: videoRoot,
      LABELS_ROOT: labelsRoot
    });

    // 构建新的环境变量内容
    const newEnvContent = Array.from(envVars.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // 写入文件
    fs.writeFileSync(envPath, newEnvContent);

    return NextResponse.json({
      success: true,
      config: {
        videoRoot: videoRoot || process.env.VIDEO_ROOT,
        labelsRoot: labelsRoot || process.env.LABELS_ROOT
      }
    });

  } catch (error) {
    console.error('更新配置失败:', error);
    return NextResponse.json(
      { error: "更新配置失败" },
      { status: 500 }
    );
  }
}
