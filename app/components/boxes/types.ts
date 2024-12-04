import { AnchorBox } from '@/common/types'

export type Point = {
  x: number
  y: number
}

export type forwardHandler = {
  getBoxes: () => AnchorBox[],
  setBoxes: (boxes: AnchorBox[]) => void
}

export type BoxesLayerProps = {
  width: number;
  height: number;
  className?: string;
  labeltext?: string;
} 