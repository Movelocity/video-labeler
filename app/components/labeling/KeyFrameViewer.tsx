import { TimelineEntry } from '@/lib/types';
import { useLabelingStore } from './store/labelingStore';
import cn from 'classnames';
import { randomColor } from '@/lib/utils';

interface KeyFrameViewerProps {
  className?: string;
  jump_to_frame?: (frame: number) => void;
}

export const KeyFrameViewer = ({ className, jump_to_frame }: KeyFrameViewerProps) => {
  const activeObjectData = useLabelingStore(state => state.getActiveObjectData());

  if (!activeObjectData) {
    return (
      <div className={cn("bg-slate-800/50 p-4 rounded-lg", className)}>
        <div className="text-slate-400 text-center">
          请选择一个对象查看关键帧
        </div>
      </div>
    );
  }

  const handleKeyFrameClick = (frame: string) => {
    jump_to_frame && jump_to_frame(parseFloat(frame));
    // console.log('Selected frame:', frame, 'Data:', activeObjectData.timeline[frame]);
  };

  return (
    <div className={cn("bg-slate-800/50 p-4 rounded-lg", className)}>
      <span className="flex flex-row items-center gap-2 shadow-md pb-2">
        <span className="text-slate-400 text-sm">
          关键帧列表
        </span>
        <span className="text-slate-200 text-sm">
          {activeObjectData.label}
        </span>
      </span>
      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-scroll pt-2">
        {Object.entries(activeObjectData.timeline).map(([frame, data]) => (
          <button
            key={frame}
            onClick={() => handleKeyFrameClick(frame)}
            className="px-3 py-1.5 rounded text-sm hover:bg-slate-700 transition-colors"
            style={{ backgroundColor: `${activeObjectData.color || randomColor()}20`, color: activeObjectData.color || randomColor() }}
          >
            帧 {frame}
          </button>
        ))}
      </div>
    </div>
  );
};
