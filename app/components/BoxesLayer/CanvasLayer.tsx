import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnchorBox, Point } from '@/lib/types'
import { pointCollidesBox, pointCollidesBoxCorner } from './utils'
import { draw } from './draw'

import { useLabelingStore } from '@/components/labeling/store/labelingStore';

export type CanvasLayerProps = {
  width: number;
  height: number;
  className?: string;
} 

/** 获取画布上点的相对坐标, value ~ [0, 1] */
const getRelPoint = (canvasElem: HTMLCanvasElement | null, point: Point):Point => {
  if (!canvasElem) return point
  return {
    x: point.x / canvasElem.width, 
    y: point.y / canvasElem.height
  }
}

export const CanvasLayer = ({
  width,
  height,
  className,
}: CanvasLayerProps) => {
  const tgBoxIdx = useRef(-1);  // 当前选中的框索引
  const [cursor, setCursor] = useState('default')  // 鼠标样式
  const canvasRef = useRef<HTMLCanvasElement>(null);  // 画布 ref
  const boxesRef = useRef<AnchorBox[]>([]);        // 框列表
  

  const { getCurrentBoxes } = useLabelingStore()
  const videoProgress = useLabelingStore(state => state.videoProgress)

  useEffect(()=> {
    const boxes = getCurrentBoxes()
    console.log('getCurrentBoxes:', boxes)
    boxesRef.current = boxes
    refresh()
  }, [videoProgress])

  /** 刷新画布 */
  const refresh = () => {
    if(!canvasRef.current) return;
    console.log("canvas size in refresh:", canvasRef.current.width, canvasRef.current.height)
    draw(canvasRef.current, boxesRef.current, tgBoxIdx.current)
  }

  /** 加载后刷新一次画布 */
  useEffect(() => {
    setTimeout(()=> {
      if(canvasRef.current) {
        console.log("setting canvas size:", width, height)
        canvasRef.current.width = width
        canvasRef.current.height = height
        refresh()
      }
    }, 500)  // 增加延时，等画布先加载
  }, [width, height]);

  return (
    <canvas 
      className={className+" select-none outline-none"}
      style={{
        cursor: cursor,
        // backgroundColor: 'rgba(0,0,0,0.1)',  // 使用半透明背景
        position: 'absolute',  // 使用绝对定位
        top: 0,
        left: 0,
        zIndex: 10  // 确保在视频播放器之上
      }}
      ref={canvasRef} 
      width={width} 
      height={height} 
      tabIndex={1}
    />
  )
}