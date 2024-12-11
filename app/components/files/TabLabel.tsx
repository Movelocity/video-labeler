import cn from 'classnames'

interface TabLabelProps {
  text: string
}

/**
 * TabLabel 组件 - 根据文本内容显示不同颜色的标签
 * @param text - 标签文本
 * - 包含 "开始": 蓝色
 * - 包含 "结束": 红色
 * - 包含 "#": 绿色
 * - 其他: 灰色
 */
export const TabLabel: React.FC<TabLabelProps> = ({text}) => {
  if (!text) return null;

  const isStart = text.includes("开始");
  const isEnd = text.includes("结束"); 
  const isHash = text.includes("#");
  const color = isHash ? "text-emerald-500" : isStart ? "text-sky-500" : isEnd ? "text-rose-500" : "text-neutral-400";

  return (
    <div className={cn("h-6 rounded-md text-center text-xs font-medium border border-gray-500 p-1", color)}>
      {text}
    </div>
  );
} 