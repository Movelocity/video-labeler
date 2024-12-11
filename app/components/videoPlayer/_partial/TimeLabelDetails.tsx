import { AnchorBox, LabelDataV2, LabelObject } from '@/lib/types';
import { second2time } from '@/lib/utils';
import cn from 'classnames';

type TimeLabelDetailsProps = {
  labelData: LabelDataV2;
  duration: number;
  onMarkerClick: (time: number, boxes: AnchorBox[]) => void;
  activeTime?: number;
  selectedObject?: string;
  onObjectSelect: (label: string | undefined) => void;
};

export const TimeLabelDetails = ({ 
  labelData, 
  duration, 
  onMarkerClick,
  activeTime,
  selectedObject,
  onObjectSelect
}: TimeLabelDetailsProps) => {
  return (
    <div className="my-4 p-4 bg-slate-800/80 rounded-lg shadow-lg border border-slate-700 space-y-4">
      <div className="text-slate-300 text-sm mb-3 flex justify-between items-center">
        <span>标签对象列表</span>
        {selectedObject && (
          <button
            onClick={() => onObjectSelect(undefined)}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300"
          >
            显示全部
          </button>
        )}
      </div>
      <div className="space-y-4">
        {labelData.objects.map((obj) => {
          const timePoints = Object.keys(obj.timeline).map(t => parseFloat(t)).sort();
          const isSelected = selectedObject === obj.label;
          
          return (
            <div 
              key={obj.label}
              className={cn(
                'space-y-2 rounded-lg p-3 transition-all duration-200',
                isSelected ? 'bg-emerald-700/30 ring-1 ring-emerald-600' : 'bg-slate-700/30 hover:bg-slate-700/50'
              )}
            >
              {/* 对象标题和时间点数量 */}
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => onObjectSelect(isSelected ? undefined : obj.label)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onObjectSelect(isSelected ? undefined : obj.label)}
              >
                <span className="text-emerald-400 font-medium">{obj.label}</span>
                <span className="text-sm text-slate-400">{timePoints.length} 个时间点</span>
              </div>

              {/* 时间点列表 */}
              <div className="space-y-1">
                {timePoints.map((time) => {
                  const box = obj.timeline[time.toString()];
                  const isTimeActive = activeTime === time;
                  const timeString = second2time(duration * time);
                  
                  return (
                    <div 
                      key={time}
                      className={cn(
                        'group relative flex items-center rounded-md p-2 transition-all duration-200',
                        isTimeActive ? 'bg-emerald-900/30' : 'hover:bg-slate-600/30'
                      )}
                      onClick={() => onMarkerClick(time, [box])}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onMarkerClick(time, [box])}
                      aria-label={`Jump to ${timeString}`}
                    >
                      <div className="w-1 h-full absolute left-0 rounded-l-md bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 text-white">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-300">{timeString}</span>
                          {box.label && (
                            <span className="text-xs text-slate-400">
                              {box.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 