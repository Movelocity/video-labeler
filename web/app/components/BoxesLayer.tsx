import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle, memo } from 'react';
import { AnchorBox } from '@/common/types'

const randomColor = () => {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

const draw = (canvas: HTMLCanvasElement, boxes: AnchorBox[], activeIndex: number) => {
  if(!canvas) return
  const ctx = canvas.getContext('2d')
  if(!ctx) return
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)
  for(let idx=boxes.length-1; idx>=0; idx--){  // 不用 forEach 并发绘制，确保第一个框最后绘制
    const box = boxes[idx]
    ctx.lineWidth = idx === activeIndex? 3: 2
    ctx.strokeStyle = box.color? box.color : randomColor()
    ctx.strokeRect(box.sx * w, box.sy * h, box.w * w, box.h * h)

    const textHeight = 16;
    let textX, textY;

    // 在左上角绘制
    ctx.font = `${textHeight}px Arial`
    const textWidth = ctx.measureText(box.label).width
    textX = box.sx * w
    textY = box.sy * h
    ctx.fillStyle = box.color? box.color : randomColor();
    ctx.fillRect(textX-1, textY - textHeight, textWidth+8, textHeight)

    ctx.fillStyle = 'white';
    ctx.fillText(box.label, textX+4, textY-2);
  }
}

type Point = {
  x: number
  y: number
}

const pointCollidesBox = (point: Point, boxes: AnchorBox[]): number => {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (
      point.x >= box.sx && point.x <= box.sx + box.w &&
      point.y >= box.sy && point.y <= box.sy + box.h
    )  return i;
  }
  return -1;
}

const pointCollidesBoxCorner = (point: Point, boxes: AnchorBox[]): number => {
  const deltaY = 0.01;
  const deltaX = 0.02;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (
      point.x >= box.sx + box.w - deltaX && point.x <= box.sx + box.w + deltaX &&
      point.y >= box.sy + box.h - deltaY && point.y <= box.sy + box.h + deltaY
    )  return i;
  }
  return -1;
}

export type BoxesLayerHandle = {
  getBoxes: () => AnchorBox[],
  setBoxes: (boxes: AnchorBox[]) => void
}

type BoxesLayerProps = {
  width: number;
  height: number;
  className?: string;
  labeltext?: string;
}
const BoxesLayer = forwardRef(({
  width,
  height,
  className,
  labeltext
}: BoxesLayerProps, ref) => {
  const tgBoxIdx= useRef(-1);
  const [cursor, setCursor] = useState('default')
  const pointOffet = useRef<Point>({x: 0, y: 0})
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxesRef = useRef<AnchorBox[]>([]);
  const boxStartRef = useRef<Point>({x: 0, y: 0})
  const focus = useRef<Boolean>(false)
  const refresh = () => {
    draw(canvasRef.current!, boxesRef.current, tgBoxIdx.current)
  }
  
  useImperativeHandle(ref, () => ({
    getBoxes: () => boxesRef.current,
    setBoxes: (newBoxes: AnchorBox[]) => {
      // 如果没有颜色，就随机给颜色
      boxesRef.current = newBoxes.map(
        box => {
          box.color = box.color??randomColor()
          return box
        }
      );
      refresh();
    }
  }));

  useEffect(() => {
    setTimeout(()=> {
      if(canvasRef.current) refresh()
    }, 500)  // 增加延时，等画布先加载
  }, [width]);

  const getRelPoint = (point: Point):Point => {
    if (!canvasRef.current) return point
    return {
      x: point.x / canvasRef.current.width, 
      y: point.y / canvasRef.current.height
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint({x, y})
    
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
    } else {
      // 鼠标无点按任何框，则新增
      boxesRef.current.push({sx: point.x, sy: point.y, w:0.01, h:0.02, label:labeltext?labeltext:'empty', color: randomColor()})
      tgBoxIdx.current = boxesRef.current.length -1
      isResizing.current = true
      boxStartRef.current = point
      // refresh()
    }
  };

  const mouseMoveBox = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if(!e.currentTarget) return
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint({x, y})
    const cornerCollision = pointCollidesBoxCorner(point, boxesRef.current)
    if (cornerCollision > -1) {
      setCursor('nw-resize')
    } else {
      setCursor('default')
    }
    if (tgBoxIdx.current === -1) return
    if(!isDragging && !isResizing) return
    
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
  }

  const handleMouseUp = useCallback(() => {
    console.log('mouse up')
    isDragging.current = false
    isResizing.current = false
    setCursor('default')

    if (tgBoxIdx.current !== -1) {  // 框的尺寸过小则移除
      const box = boxesRef.current[tgBoxIdx.current]
      if(!box) return;
      if(box.w < 0.02 && box.h < 0.04){
        boxesRef.current.splice(tgBoxIdx.current, 1)
        tgBoxIdx.current = -1
      }
      refresh()
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if(e.key === 'Escape' || e.key === 'q') {
      if (tgBoxIdx.current !== -1) {  // 框的尺寸过小则移除
        boxesRef.current.splice(tgBoxIdx.current, 1)
        tgBoxIdx.current = -1
        refresh()
      }
    }
  }, [focus.current])

  useEffect(()=> {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('mousemove', mouseMoveBox);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('mousemove', mouseMoveBox);
    }
  }, [])

  return (
    <canvas 
      className={className+" select-none outline-none"}
      style={{cursor: cursor}}
      ref={canvasRef} width={width} height={height} 
      onMouseDown={handleMouseDown} 
      onKeyDown={handleKeyDown}
      tabIndex={1}// 设置tabIndex, 使得canvas可以接受键盘事件
    />
  )
})

export default memo(BoxesLayer)