import { getConfig } from '../config'
import { NextResponse } from 'next/server'

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    videoRoot: config.VIDEO_ROOT,
    labelsRoot: config.LABELS_ROOT,
  })
} 