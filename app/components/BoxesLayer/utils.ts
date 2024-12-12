import { AnchorBox, Point } from '@/lib/types'

/**检测点是否在框内，用于鼠标点击判断 */ 
export const pointCollidesBox = (point: Point, boxes: AnchorBox[]): number => {
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (
      point.x >= box.sx && point.x <= box.sx + box.w &&
      point.y >= box.sy && point.y <= box.sy + box.h
    )  return i;
  }
  return -1;
}

/**检测点是否在框的右下角*/ 
export const pointCollidesBoxCorner = (point: Point, boxes: AnchorBox[]): number => {
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



