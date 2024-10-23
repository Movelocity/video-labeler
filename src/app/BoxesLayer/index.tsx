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
    ctx.lineWidth = idx === activeIndex? 4: 2
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
    ctx.fillRect(textX-1, textY - textHeight, textWidth+4, textHeight)

    ctx.fillStyle = 'white';
    ctx.fillText(box.label, textX, textY-2);
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

type BoxesLayerProps = {
  // boxes: any[];
  width: number;
  height: number;
  className?: string;
}
const BoxesLayer: React.FC<BoxesLayerProps> = ({width, height, className}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [anchorBoxes, setAnchorBoxes] = useState<AnchorBox[]>([]);
  const boxesRef = useRef<AnchorBox[]>([]);
  const updateBoxState = useCallback(() => {
    setAnchorBoxes(boxesRef.current)
    draw(canvasRef.current!, boxesRef.current, tgBoxIdx.current)
  }, [])
  const tgBoxIdx= useRef(-1);

  const keyDownHandler = useCallback((e: KeyboardEvent) => {
    if(tgBoxIdx.current<0) return
    // console.log(e.key)

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
      case 'n':
        // console.log('tgBoxIdx: ', tgBoxIdx.current, 'prev.len: ', boxesRef.current.length)
        tgBoxIdx.current = (tgBoxIdx.current - 1 + boxesRef.current.length) % boxesRef.current.length;
        // console.log('tgBoxId: ', tgBoxIdx.current)
        break;
      case 'm':
        // console.log('tgBoxIdx: ', tgBoxIdx.current, 'prev.len: ', boxesRef.current.length)
        tgBoxIdx.current = (tgBoxIdx.current + 1) % boxesRef.current.length;
        // console.log('tgBoxId: ', tgBoxIdx.current)
        break;
      case '1':
        boxesRef.current.push({sx: 0.3, sy: 0.3, w:0.2, h:0.3, label:'test', color: randomColor()})
        tgBoxIdx.current = boxesRef.current.length -1
        break;
      default:
        break; // Return previous state if no keys match
    }

    updateBoxState()
  }, [])

  useEffect(() => {
    console.log('effect, suprise')
    if(boxesRef.current.length === 0) {
      boxesRef.current.push({sx: 0.3, sy: 0.3, w:0.2, h:0.3, label:'test', color: randomColor()})
      tgBoxIdx.current = 0
    }
    updateBoxState()
    setTimeout(()=> {
      if(canvasRef.current) draw(canvasRef.current, boxesRef.current, tgBoxIdx.current)}, 
    500)  // 增加延时，等画布先加载
  }, [width]);

  useEffect(()=> {
    window.addEventListener('keydown', keyDownHandler)
    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  }, [])


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

  const pointOffet = useRef<Point>({x: 0, y: 0})
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint({x, y})
    const collision = pointCollidesBox(point, boxesRef.current)
    
    if (collision > -1) {
      tgBoxIdx.current = collision
      draw(canvasRef.current!, boxesRef.current, tgBoxIdx.current)

      // drawCircle(x, y);
      const box = boxesRef.current[tgBoxIdx.current]
      pointOffet.current = {
        x: point.x - box.sx, 
        y: point.y - box.sy
      }
      setIsDragging(true)
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging || !e.currentTarget) return
    if (!canvasRef.current) return
    if (tgBoxIdx.current === -1) return
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = getRelPoint({x, y})
    const box = boxesRef.current[tgBoxIdx.current]
    box.sx = point.x - pointOffet.current.x
    box.sy = point.y - pointOffet.current.y
    boxesRef.current[tgBoxIdx.current] = box
    draw(canvasRef.current!, boxesRef.current, tgBoxIdx.current)
  }, [isDragging]);
  const handleMouseUp = useCallback(() => {
    console.log('mouse up')
    setIsDragging(false);
    tgBoxIdx.current = -1
  }, []);
  const handleMouseLeave = useCallback(() => {
    console.log('mouse leave')
    setIsDragging(false);
    tgBoxIdx.current = -1
  }, []);
  useEffect(() => {
    if (isDragging) {
      console.log('bind listeners')
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      console.log('clear listeners')
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <canvas className={className+" select-none"} ref={canvasRef} width={width} height={height} onMouseDown={handleMouseDown}/>
  )
}

export default memo(BoxesLayer)