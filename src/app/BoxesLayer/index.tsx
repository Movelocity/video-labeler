import { useEffect, useState, useRef, useCallback, memo } from 'react';


const randomColor = () => {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

export type AnchorBox = {
  sx: number
  sy: number
  w: number
  h: number
  label: string
  color: string
}  // 数字全部采用小数 [0,1]

const draw = (canvas: HTMLCanvasElement, boxes: AnchorBox[], activeIndex: number) => {
  if(!canvas) return
  const ctx = canvas.getContext('2d')
  if(!ctx) return
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)

  boxes.forEach((box, idx) => {
    ctx.lineWidth = idx === activeIndex? 3: 2
    ctx.strokeStyle = box.color
    ctx.strokeRect(box.sx * w, box.sy * h, box.w * w, box.h * h)

    const textHeight = 16;
    let textX, textY;

    // 在左上角绘制
    ctx.font = `${textHeight}px Arial`
    const textWidth = ctx.measureText(box.label).width
    textX = box.sx * w
    textY = box.sy * h
    ctx.fillStyle = box.color
    ctx.fillRect(textX-1, textY - textHeight, textWidth+8, textHeight)

    ctx.fillStyle = 'white';
    ctx.fillText(box.label, textX+4, textY-2);
  })
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

type BoxesLayerProps = {
  // boxes: any[];
  width: number;
  height: number;
  className?: string;
  labeltext?: string;
}
const BoxesLayer: React.FC<BoxesLayerProps> = ({width, height, className, labeltext}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [anchorBoxes, setAnchorBoxes] = useState<AnchorBox[]>([]);
  const boxesRef = useRef<AnchorBox[]>([]);
  const refresh = () => {
    draw(canvasRef.current!, boxesRef.current, tgBoxIdx.current)
  }
  // const updateBoxState = useCallback(() => {
  //   // setAnchorBoxes(boxesRef.current)
  //   refresh()
  // }, [])
  const tgBoxIdx= useRef(-1);

  const keyDownHandler = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'n':
        tgBoxIdx.current = (tgBoxIdx.current - 1 + boxesRef.current.length) % boxesRef.current.length;
        break;
      case 'm':
        tgBoxIdx.current = (tgBoxIdx.current + 1) % boxesRef.current.length;
        break;
      case '1':
        boxesRef.current.push({sx: 0.3, sy: 0.3, w:0.2, h:0.3, label:'test', color: randomColor()})
        tgBoxIdx.current = boxesRef.current.length -1
        break;
      default:
        break;
    }

    if(tgBoxIdx.current<0) return // 以下的按键匹配动作需要有对应的框
    const target = boxesRef.current[tgBoxIdx.current]
    const step = 0.01;
    switch (e.key) {
      case 's':
        target.sy += step; // Move down
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'a':
        target.sx -= step; // Move left
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'w':
        target.sy -= step; // Move up
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'd':
        target.sx += step; // Move right
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'j':
        target.sx = Math.min(1, target.sx + step/2);
        target.w = Math.max(0, target.w - step); // Decrease width
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'l':
        target.sx = Math.max(0, target.sx - step/2);
        target.w = Math.min(1, target.w + step); // Increase width
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'k':
        target.sy = Math.min(1, target.sy + step/2);
        target.h = Math.max(0, target.h - step); // Decrease height
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'i':
        target.sy = Math.max(0, target.sy - step/2);
        target.h =  Math.min(1, target.h + step); // Increase height
        boxesRef.current[tgBoxIdx.current] = target
        break;
      case 'Escape':
        boxesRef.current.splice(tgBoxIdx.current, 1)
        tgBoxIdx.current = -1
        break;
      default:
        break; // Return previous state if no keys match
    }

    refresh()
  }, [])

  useEffect(() => {
    console.log('window update')
    // if(boxesRef.current.length === 0) {
    //   boxesRef.current.push({sx: 0.3, sy: 0.3, w:0.2, h:0.3, label:labeltext??'test', color: randomColor()})
    //   tgBoxIdx.current = 0
    // }
    // refresh()
    setTimeout(()=> {
      if(canvasRef.current) refresh() //draw(canvasRef.current, boxesRef.current, tgBoxIdx.current)
    }, 500)  // 增加延时，等画布先加载
  }, [width]);

  const drawCircle = (x:number, y:number) => {
    const canvas = canvasRef.current;
    if (!canvas) return
    const context = canvas.getContext('2d');
    if (!context) return

    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2, true);
    context.fillStyle = 'cyan';
    context.fill();
  };

  const getRelPoint = (point: Point):Point => {
    if (!canvasRef.current) return point
    return {
      x: point.x / canvasRef.current.width, 
      y: point.y / canvasRef.current.height
    }
  }

  const [cursor, setCursor] = useState('default')
  const pointOffet = useRef<Point>({x: 0, y: 0})
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint({x, y})
  
    const cornerCollision = pointCollidesBoxCorner(point, boxesRef.current)
    if (cornerCollision > -1) {
      tgBoxIdx.current = cornerCollision
      refresh()
      isResizing.current = true
      // console.log('cornerCollision', cornerCollision)
      return
    }

    const collision = pointCollidesBox(point, boxesRef.current)
    if (collision > -1) {
      tgBoxIdx.current = collision
      refresh()
      const box = boxesRef.current[tgBoxIdx.current]
      pointOffet.current = {
        x: point.x - box.sx, 
        y: point.y - box.sy
      }
      // setIsDragging(true)
      isDragging.current = true
      // setCursor('move')
    } else {
      boxesRef.current.push({sx: point.x, sy: point.y, w:0.01, h:0.02, label:labeltext?labeltext:'empty', color: randomColor()})
      tgBoxIdx.current = boxesRef.current.length -1
      // setIsResizing(true)
      isResizing.current = true
      refresh()
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
      box.w = Math.max(point.x - box.sx, 0)  // 0.02 以内删掉
      box.h = Math.max(point.y - box.sy, 0)  // 0.04 以内删掉
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
      if(box.w < 0.02 || box.h < 0.04){
        boxesRef.current.splice(tgBoxIdx.current, 1)
        tgBoxIdx.current = -1
      }
      refresh()
    }
  }, []);

  useEffect(()=> {
    // window.addEventListener('keydown', keyDownHandler)
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('mousemove', mouseMoveBox);
    return () => {
      // window.removeEventListener('keydown', keyDownHandler)
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('mousemove', mouseMoveBox);
    }
  }, [])

  return (
    <canvas 
      className={className+" select-none"}
      style={{cursor: cursor}}
      ref={canvasRef} width={width} height={height} 
      onMouseDown={handleMouseDown} 
    />
  )
}

export default memo(BoxesLayer)