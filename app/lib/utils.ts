import { LabelDataV1, LabelDataV2 } from "./types";

/** 将秒数转换为时间格式*/
export const second2time = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/** 生成随机HSL颜色*/
export const randomColor = () => {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

/** 
 * 统一时间戳键值 (number 0~1 -> string '0.00000' ~ '1.00000')，防止浮点数转换精度问题
 * 1. 如果输入是 number，则转换为 string 并截取前 7 位
 * 2. 如果输入是 string，则直接截取前 7 位
 */
export const safeTimeKey = (time: number | string): string => {
  let timeStr: string;
  if (typeof time === 'number') {
    timeStr = time.toString();
  } else {
    timeStr = time;
  }
  return timeStr.padEnd(7, '0');
}

/**自动生成id*/
export const autoIncrementId = (data: LabelDataV2|LabelDataV1) => {
  return (data.metadata.nextId = (data.metadata.nextId || 0) + 1).toString();
}