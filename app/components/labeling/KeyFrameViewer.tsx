import { TimelineEntry } from '@/lib/types';
import cn from 'classnames';
interface KeyFrameViewerProps {
  timeline: TimelineEntry;
  color: string;
  className?: string;
  jump_to_frame?: (frame: number) => void;
}

  export const KeyFrameViewer = ({ timeline, color, className, jump_to_frame }: KeyFrameViewerProps) => {
  const handleKeyFrameClick = (frame: string) => {
    jump_to_frame && jump_to_frame(parseFloat(frame));
    console.log('Selected frame:', frame, 'Data:', timeline[frame]);
  };

  return (
    <div className={cn("bg-slate-800/50 p-4 rounded-lg", className)}>
      <h3 className="text-slate-200 mb-3 text-sm font-medium">关键帧列表</h3>
      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-scroll">
        {Object.entries(timeline).map(([frame, data]) => (
          <button
            key={frame}
            onClick={() => handleKeyFrameClick(frame)}
            className="px-3 py-1.5 rounded text-sm hover:bg-slate-700 transition-colors"
            style={{ backgroundColor: `${color}20`, color }}
          >
            帧 {frame}
          </button>
        ))}
      </div>
    </div>
  );
};
