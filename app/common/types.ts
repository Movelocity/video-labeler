
/** 数字全部采用小数 [0,1] */
export type AnchorBox = {
  sx: number
  sy: number
  w: number
  h: number
  label: string
  color?: string
}

export type FileInfo = {
  name: string
  label_file: string
  labels: string[]
  size: number | null
  modified_time: string | null
  type: string
}