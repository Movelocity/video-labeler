/** sx, sy, w, h label . 数字全部采用小数 [0,1] */
export interface AnchorBox {
  sx: number
  sy: number
  w: number
  h: number
  label: string
  color?: string
}

export type FileInfo = {
  name: string            // 文件名
  label_path: string      // 标注文件路径
  labels: string[]        // 标签集合
  size?: number           // 文件大小
  modified_time?: string  // 文件修改时间
  type: 'file' | 'dir'    // 文件或文件夹
}

export type Shape = {
  w: number
  h: number
}

export type Point = {
  x: number
  y: number
} 

export interface LabelData {
  time: number;
  boxes: AnchorBox[];
}

// V2 标注数据类型
export interface TimelineEntry {
  [time: string]: AnchorBox;  // 一个时间点最多可对应一个box
}

export interface LabelObject {
  id: string;
  label: string;
  color: string;
  timeline: TimelineEntry;
}

export interface LabelDataV2 {
  metadata: Record<string, any>;
  labels?: Record<string, AnchorBox[]>;
  objects: LabelObject[];
  version: 2;
}