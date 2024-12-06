import { AnchorBox, LabelData } from '@/common/types';
import { second2time } from '../utils';
import cn from 'classnames';

type TimeLabelDetailsProps = {
  labelData: LabelData[];
  duration: number;
  onMarkerClick: (time: number, boxes: AnchorBox[]) => void;
  activeTime?: number;
};

export const TimeLabelDetails = ({ 
  labelData, 
  duration, 
  onMarkerClick,
  activeTime 
}: TimeLabelDetailsProps) => {
  return (
    <div className="my-4 p-4 bg-slate-800/80 rounded-lg shadow-lg border border-slate-700 space-y-2">
      <div className="text-slate-300 text-sm mb-3">
        时间标记点标签列表
      </div>
      <div className="space-y-2">
        {labelData.map(({time, boxes}) => {
          const isActive = activeTime === time;
          const timeString = second2time(duration * time);
          const boxCount = boxes.length;
          
          return (
            <div 
              key={time}
              className={cn(
                'group relative flex items-center rounded-md transition-all duration-200',
                isActive ? 'bg-emerald-700/30 ring-1 ring-emerald-600' : 'bg-slate-700/50 hover:bg-slate-700'
              )}
              onClick={() => onMarkerClick(time, boxes)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onMarkerClick(time, boxes)}
              aria-label={`Jump to ${timeString}, contains ${boxCount} labels`}
            >
              <div className="w-1 h-full absolute left-0 rounded-l-md bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1 px-3 py-2 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-medium">{timeString}</span>
                  <span className="text-sm text-slate-400">{boxCount} 个标签</span>
                </div>
                {boxes.length > 0 && (
                  <div className="mt-1 text-sm text-slate-300 space-x-2">
                    {boxes.map((box, index) => (
                      <span 
                        key={index}
                        className="inline-block px-2 py-0.5 bg-slate-700 rounded-full text-xs"
                      >
                        {box.label || 'default'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 