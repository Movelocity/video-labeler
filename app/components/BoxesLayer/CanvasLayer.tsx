import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnchorBox, Point } from '@/lib/types'
import { pointCollidesBox, pointCollidesBoxCorner } from './utils'
import { draw } from './draw'

// import { useLabelingStore } from '@/components/labeling/store/labelingStore';
import { useLabeling } from '@/components/labeling/hooks/useLabeling';

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
  
  const pointOffet = useRef<Point>({x: 0, y: 0})  // 框偏移量
  const isDragging = useRef(false)  // 是否正在通过鼠标拖动框
  const isResizing = useRef(false)  // 是否正在通过鼠标调整框大小
  const boxStartRef = useRef<Point>({x: 0, y: 0})  // 框开始点

  const { getCurrentBoxes, videoProgress, setRenderedBoxes } = useLabeling()
  // const videoProgress = useLabelingStore(state => state.videoProgress)

  useEffect(()=> {
    const boxes = getCurrentBoxes()
    // console.log('getCurrentBoxes:', boxes)
    boxesRef.current = boxes
    refresh()
  }, [videoProgress])

  /** 刷新画布 */
  const refresh = () => {
    if(!canvasRef.current) return;
    // console.log("canvas size in refresh:", canvasRef.current.width, canvasRef.current.height)
    setRenderedBoxes(boxesRef.current);
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

  /** 鼠标按下事件 */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint(canvasRef.current, {x, y})
    
    // 鼠标点按边角
    const cornerCollision = pointCollidesBoxCorner(point, boxesRef.current)
    if (cornerCollision > -1) {
      tgBoxIdx.current = cornerCollision
      isResizing.current = true
      boxStartRef.current = {x: boxesRef.current[cornerCollision].sx, y: boxesRef.current[cornerCollision].sy}
      return
    }

    // 鼠标点按框内
    const collision = pointCollidesBox(point, boxesRef.current)
    if (collision > -1) {
      // move the collision box to the first element of array
      const box = boxesRef.current[collision]
      boxesRef.current.splice(collision, 1)
      boxesRef.current.unshift(box)

      tgBoxIdx.current = 0
      pointOffet.current = {
        x: point.x - box.sx, 
        y: point.y - box.sy
      }
      isDragging.current = true
      refresh()
    }
  };

  /** 鼠标移动事件 */
  const mouseMoveBox = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint(canvasRef.current, {x, y})
    
    const cornerCollision = pointCollidesBoxCorner(point, boxesRef.current)
    if (cornerCollision > -1) {
      setCursor('nw-resize')
    } else {
      setCursor('default')
    }
    
    if (tgBoxIdx.current === -1) return
    if(!isDragging.current && !isResizing.current) return
    
    const box = boxesRef.current[tgBoxIdx.current]
    if(isDragging.current){
      box.sx = point.x - pointOffet.current.x
      box.sy = point.y - pointOffet.current.y
      boxesRef.current[tgBoxIdx.current] = box
      setCursor('move')
    } else if (isResizing.current) {
      // 拖动改变框大小
      if(point.x < boxStartRef.current.x) {
        const box_r = boxStartRef.current.x
        box.w = box_r - point.x
        box.sx = point.x
      } else {
        const dx = point.x - box.sx
        box.w = Math.abs(dx)
      }
      if(point.y < boxStartRef.current.y) {
        const box_b = boxStartRef.current.y
        box.h = box_b - point.y
        box.sy = point.y
      } else { 
        box.h = Math.abs(point.y - box.sy)
      }
      boxesRef.current[tgBoxIdx.current] = box
    }
    refresh()
  }, [])

  /** 鼠标抬起事件 */
  const handleMouseUp = useCallback(() => {
    console.log('mouse up')
    isDragging.current = false
    isResizing.current = false
    setCursor('default')

    // if (tgBoxIdx.current !== -1) {  // 框的尺寸过小则移除
    //   const box = boxesRef.current[tgBoxIdx.current]
    //   if(!box) return;
    //   if(box.w < 0.02 && box.h < 0.04){
    //     boxesRef.current.splice(tgBoxIdx.current, 1)
    //     tgBoxIdx.current = -1
    //   }
    //   refresh()
    // }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if(e.key === 'Escape' || e.key === 'q') {
      if (tgBoxIdx.current !== -1) {  // 框的尺寸过小则移除
        boxesRef.current.splice(tgBoxIdx.current, 1)
        tgBoxIdx.current = -1
        refresh()
      }
    }
  }, [])

  useEffect(()=> {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('mousemove', mouseMoveBox as any);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('mousemove', mouseMoveBox as any);
    }
  }, [handleMouseUp, mouseMoveBox])

  return (
    <canvas 
      className={className+" select-none outline-none"}
      style={{
        cursor: cursor,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10
      }}
      ref={canvasRef} 
      width={width} 
      height={height} 
      tabIndex={1}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    />
  )
}