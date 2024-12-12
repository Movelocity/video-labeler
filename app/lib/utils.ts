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
  if (typeof time === 'number') {
    return time.toString().slice(0, 7)
  } else {
    return time.slice(0, 7)
  }
}

