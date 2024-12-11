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