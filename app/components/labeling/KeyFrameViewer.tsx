import { TimelineEntry } from '@/lib/types';

interface KeyFrameViewerProps {
  timeline: TimelineEntry;
  color: string;
}

export const KeyFrameViewer = ({ timeline, color }: KeyFrameViewerProps) => {
  const handleKeyFrameClick = (frame: number) => {
    console.log('Selected frame:', frame, 'Data:', timeline[frame]);
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg">
      <h3 className="text-slate-200 mb-3 text-sm font-medium">关键帧列表</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(timeline).map(([frame, data]) => (
          <button
            key={frame}
            onClick={() => handleKeyFrameClick(parseInt(frame))}
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
