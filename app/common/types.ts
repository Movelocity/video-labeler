/** 数字全部采用小数 [0,1] */
export interface AnchorBox {
  sx: number
  sy: number
  w: number
  h: number
  label: string
}

export type FileInfo = {
  name: string
  label_file: string
  labels: string[]
  size: number | null
  modified_time: string | null
  type: string
}

export type Shape = {
  w: number
  h: number
}

export interface LabelData {
  time: number;
  boxes: AnchorBox[];
}

// V2 标注数据类型
export interface TimelineEntry {
  [time: string]: AnchorBox;
}

export interface LabelObject {
  label: string;
  timeline: TimelineEntry;
}

export interface LabelDataV2 {
  metadata: Record<string, any>;
  labels?: Record<string, AnchorBox[]>;
  objects: LabelObject[];
  version: 2;
}