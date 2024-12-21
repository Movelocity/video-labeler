import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnchorBox, Point } from '@/lib/types'
import { pointCollidesBox, pointCollidesBoxCorner } from './utils'
import { draw } from './draw'

// import { useLabelingStore } from '@/components/labeling/store/labelingStore';
// import { useLabeling } from '@/components/labeling/hooks/useLabeling';
import { useLabelingStore, useStore, getCurrentBoxes, getActiveObjectData } from '@/components/labeling/store';
import { randomColor } from '@/lib/utils';

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

  const labelingStore = useLabelingStore();
  const videoProgress = useStore(state => state.videoProgress);

  const tempBox = useRef<AnchorBox>();

  /** 刷新画布 */
  const refresh = () => {
    if(!canvasRef.current) return;
    const { setRenderedBoxes, setTempBox } = labelingStore.getState()
    // console.log("canvas size in refresh:", canvasRef.current.width, canvasRef.current.height)
    setRenderedBoxes(boxesRef.current);
    if(tempBox.current) {
      setTempBox(tempBox.current);
      draw(canvasRef.current, [...boxesRef.current, tempBox.current], tgBoxIdx.current)
    } else{
      draw(canvasRef.current, boxesRef.current, tgBoxIdx.current)
    }
    
  }

  /** 视频进度变化时重绘 */
  useEffect(()=> {
    const boxes = getCurrentBoxes(labelingStore.getState())
    // console.log('getCurrentBoxes:', boxes)
    boxesRef.current = boxes
    tempBox.current = undefined
    refresh()
  }, [videoProgress])

  /** 窗口大小变化时重绘 */
  useEffect(() => {
    setTimeout(()=> {
      if(canvasRef.current) {
        // console.log("setting canvas size:", width, height)
        canvasRef.current.width = width
        canvasRef.current.height = height
        refresh()
      }
    }, 500)
  }, [width, height]);

  /** 鼠标按下事件 */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint(canvasRef.current, {x, y})
    
    // 检查临时框的边角碰撞
    if (tempBox.current) {
      const tempBoxCornerCollision = pointCollidesBoxCorner(point, [tempBox.current])
      if (tempBoxCornerCollision === 0) {
        isResizing.current = true
        boxStartRef.current = {x: tempBox.current.sx, y: tempBox.current.sy}
        return
      }
    }

    // 鼠标点按边角
    const cornerCollision = pointCollidesBoxCorner(point, boxesRef.current)
    if (cornerCollision > -1) {
      tgBoxIdx.current = cornerCollision
      isResizing.current = true
      boxStartRef.current = {x: boxesRef.current[cornerCollision].sx, y: boxesRef.current[cornerCollision].sy}
      return
    }

    // 检查临时框的碰撞
    if (tempBox.current && pointCollidesBox(point, [tempBox.current]) === 0) {
      pointOffet.current = {
        x: point.x - tempBox.current.sx,
        y: point.y - tempBox.current.sy
      }
      isDragging.current = true
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
      return
    }

    // 鼠标没点到框，当前有选择物体，且没有渲染出对应的框
    const { activeObjId } = labelingStore.getState()
    if(activeObjId) {
      for(let i=0; i < boxesRef.current.length; i++) {
        if(boxesRef.current[i].objId === activeObjId) {
          return;  // 目标在当前帧已有框，则不编辑临时框
        }
      }
      const activeObjectData = getActiveObjectData(labelingStore.getState())
      const relPoint = getRelPoint(canvasRef.current, {x, y})
      tempBox.current = {
        sx: relPoint.x,
        sy: relPoint.y,
        w: 0.01,
        h: 0.01,
        color: activeObjectData?.color ?? randomColor(),
        label: activeObjectData?.label ?? "undefined"
      }
      boxStartRef.current = {x: relPoint.x, y: relPoint.y}
      tgBoxIdx.current = -1
      isResizing.current = true
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
    let tempBoxCollision = -1
    if(tempBox.current){
      tempBoxCollision = pointCollidesBoxCorner(point, [tempBox.current])
    }
    if (cornerCollision > -1 || tempBoxCollision > -1) {
      setCursor('nw-resize')
    } else {
      setCursor('default')
    }
    
    // 处理临时框的拖动和调整大小
    if (tempBox.current && isDragging.current) {
      tempBox.current.sx = point.x - pointOffet.current.x
      tempBox.current.sy = point.y - pointOffet.current.y
      setCursor('move')
      refresh()
      return
    }

    if (tempBox.current && isResizing.current) {
      if(point.x < boxStartRef.current.x) {
        const box_r = boxStartRef.current.x
        tempBox.current.w = box_r - point.x
        tempBox.current.sx = point.x
      } else {
        const dx = point.x - tempBox.current.sx
        tempBox.current.w = Math.abs(dx)
      }
      if(point.y < boxStartRef.current.y) {
        const box_b = boxStartRef.current.y
        tempBox.current.h = box_b - point.y
        tempBox.current.sy = point.y
      } else {
        tempBox.current.h = Math.abs(point.y - tempBox.current.sy)
      }
      refresh()
      return
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
    // 如果临时框尺寸过小，则移除
    if (tempBox.current && (tempBox.current.w < 0.02 || tempBox.current.h < 0.02)) {
      tempBox.current = undefined
    }
    
    isDragging.current = false
    isResizing.current = false
    setCursor('default')
    refresh()
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
      className={className+"select-none outline-none"}
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