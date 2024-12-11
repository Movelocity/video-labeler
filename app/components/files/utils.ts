/**
 * 将字节数转换为可读的文件大小字符串
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的文件大小字符串，如 "1.5 MB"
 */
export function formatBytes(bytes: number) {
  if(!bytes) return '';
  if (bytes < 0) return ''+bytes;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index++;
  }
  return `${bytes.toFixed(2)} ${units[index]}`;
}

/**
 * 计算标签的截断文本
 * @param labels - 标签数组
 * @param containerWidth - 容器宽度
 * @returns 处理后的标签数组
 */
export function calculateTruncatedLabels(labels: string[], containerWidth: number): string[] {
  if (!labels) return [];
  
  const avgCharWidth = 8 // 每个字符的近似宽度（像素）
  const labelPadding = 16 // 每个标签的内边距
  const availableWidth = containerWidth - (labels.length * labelPadding)
  const totalChars = Math.floor(availableWidth / avgCharWidth)
  const charsPerLabel = Math.floor(totalChars / labels.length)

  return labels.map(label => {
    if (label.length > charsPerLabel) {
      return label.slice(0, Math.max(charsPerLabel - 2)) + '...'
    }
    return label
  })
} 