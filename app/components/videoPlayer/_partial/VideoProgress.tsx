import { useRef } from 'react';
import { second2time } from '@/lib/utils';

interface VideoProgressProps {
  duration: number;
  activeProgress: number;
  width: number;
  onProgressChange: (progress: number) => void;
}

const VideoProgress = ({
  duration,
  activeProgress,
  width,
  onProgressChange
}: VideoProgressProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const updateProgress = (clientX: number) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    onProgressChange(progress);
  };

  return (
    <div className='w-full cursor-pointer' style={{width: `${width}px`}}>
      <div className='text-slate-300 text-xs w-full flex flex-row justify-between mb-1'>
        <span>00:00</span>
        <span>{second2time(duration * 0.25)}</span>
        <span>{second2time(duration * 0.75)}</span>
        <span>{second2time(duration)}</span>
      </div>

      <div
        className='relative h-4 w-full rounded-sm overflow-hidden'
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {updateProgress(e.clientX)}}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(activeProgress * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onProgressChange(Math.min(1, activeProgress + 0.01));
          if (e.key === 'ArrowLeft') onProgressChange(Math.max(0, activeProgress - 0.01));
        }}
      >
        <div className='absolute inset-0 bg-slate-700' ref={progressBarRef} />
        <div 
          className='absolute inset-y-0 left-0 bg-slate-400 transition-all duration-100'
          style={{width: `${activeProgress * 100}%`}}
        />
      </div>
    </div>
  );
};

export default VideoProgress; 