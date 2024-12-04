import { AnchorBox } from '@/common/types';
import { second2time } from '../utils';
import { LabelData } from '@/common/types';

type TimelineMarkersProps = {
  labelData: LabelData[];
  duration: number;
  onMarkerClick: (time: number, boxes: AnchorBox[]) => void;
};

export const TimelineMarkers = ({ labelData, duration, onMarkerClick }: TimelineMarkersProps) => {
  return (
    <div className='relative h-8 w-full group'>
      {labelData.map(({time, boxes}) => (
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
          />
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