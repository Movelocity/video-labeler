import { AnchorBox } from '@/lib/types'
import { randomColor } from '@/lib/utils'

// 在画布上绘制所有框
export const draw = (canvas: HTMLCanvasElement, boxes: AnchorBox[], activeIndex: number) => {
  if(!canvas) return
  const ctx = canvas.getContext('2d')
  if(!ctx) return
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  ctx.clearRect(0, 0, w, h)
  
  // 从后向前绘制，确保 active box 在最上层
  for(let idx=boxes.length-1; idx>=0; idx--){
    const box = boxes[idx]
    ctx.lineWidth = idx === activeIndex? 3: 2  // active box 的线宽为 3，其他框的线宽为 2
    ctx.strokeStyle = box.color??randomColor()
    ctx.strokeRect(box.sx * w, box.sy * h, box.w * w, box.h * h)

    // 绘制标签
    const textHeight = 16;
    ctx.font = `${textHeight}px Arial`
    const textWidth = ctx.measureText(box.label).width
    const textX = box.sx * w
    const textY = box.sy * h
    
    ctx.fillStyle = box.color??randomColor();
    ctx.fillRect(textX-1, textY - textHeight, textWidth+8, textHeight)

    ctx.fillStyle = 'white';
    ctx.fillText(box.label, textX+4, textY-2);
  }
} 