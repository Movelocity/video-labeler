import { AnchorBox, LabelDataV2 } from '@/lib/types';
import { second2time } from '@/lib/utils';

type TimelineMarkersProps = {
  labelData: LabelDataV2;
  duration: number;
  onMarkerClick: (time: number, boxes: AnchorBox[]) => void;
  selectedObject?: string;
};

export const TimelineMarkers = ({ 
  labelData, 
  duration, 
  onMarkerClick,
  selectedObject 
}: TimelineMarkersProps) => {
  // 将所有时间点和对应的框数据整合到一个Map中
  const timelineMap = new Map<string, AnchorBox[]>();
  
  labelData.objects
    .filter(obj => !selectedObject || obj.label === selectedObject)
    .forEach(obj => {
      Object.entries(obj.timeline).forEach(([time, box]) => {
        if (!timelineMap.has(time)) {
          timelineMap.set(time, []);
        }
        timelineMap.get(time)!.push(box);
      });
    });

  // 转换为排序后的数组
  const sortedTimelines = Array.from(timelineMap.entries())
    .map(([time, boxes]) => ({
      time: parseFloat(time),
      boxes
    }))
    .sort((a, b) => a.time - b.time);

  return (
    <div className='relative h-8 w-full group'>
      {sortedTimelines.map(({time, boxes}) => (
        <div 
          key={time}
          className='absolute -translate-x-1/2 group/marker'
          style={{left: `${time * 100}%`}}
        >
          <div 
            className='w-1 h-6 bg-green-600 hover:bg-green-500 cursor-pointer 
                       transition-all duration-200 group-hover/marker:h-8'
            onClick={() => onMarkerClick(time, boxes)}
            role="button"
            tabIndex={0}
            aria-label={`Jump to ${second2time(duration * time)}`}
            onKeyDown={(e) => e.key === 'Enter' && onMarkerClick(time, boxes)}
          >
            <div className='absolute top-full left-1/2 -translate-x-1/2 mt-1 
                          opacity-0 group-hover/marker:opacity-100 transition-opacity
                          flex flex-col gap-1'>
              {boxes.map((box, index) => (
                <div
                  key={index}
                  className='bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap'
                >
                  {box.label || selectedObject || 'default'}
                </div>
              ))}
            </div>
          </div>
          <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 
                        opacity-0 group-hover/marker:opacity-100 transition-opacity
                        bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap'>
            {second2time(duration * time)}
          </div>
        </div>
      ))}
    </div>
  );
}; 