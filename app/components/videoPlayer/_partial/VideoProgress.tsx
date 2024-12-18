import { useRef } from 'react';
import { second2time, closeToKeyFrame } from '@/lib/utils';
import { TbKeyframeFilled } from "react-icons/tb";
import { useLabelingStore, useStore, getActiveObjectData } from '@/components/labeling/store';

interface VideoProgressProps {
  duration: number;
  // activeProgress: number;
  width: number;
  onProgressChange: (progress: number) => void;
}

const VideoProgress = ({
  duration,
  // activeProgress,
  width,
  onProgressChange
}: VideoProgressProps) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  // const { getActiveObjectData } = useLabeling();
  const labelingStore = useLabelingStore();

  // const activeObjData = getActiveObjectData();
  const activeObjData = getActiveObjectData(labelingStore.getState())
  const activeObjId = useStore(state => state.activeObjId)
  const videoProgress = useStore(state => state.videoProgress)

  const handleUpdateProgress = (clientX: number) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    // progress in (0, 1)
    const progress = Math.max(0, Math.min(1, x / rect.width));

    // 根据 TIME_DIFF_THRESHOLD 尝试吸附到一个附近的 keyframe, frame key value in (0, 1)
    if (activeObjData && activeObjData.timeline) {
      const keyframe = closeToKeyFrame(activeObjData.timeline, progress);
      if(keyframe !== ""){
        onProgressChange(parseFloat(keyframe));
        return
      }
    }
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
        className='relative h-8 w-full rounded-sm overflow-hidden outline-none'
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {handleUpdateProgress(e.clientX)}}
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(videoProgress * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onProgressChange(Math.min(1, videoProgress + 0.001));
          if (e.key === 'ArrowLeft') onProgressChange(Math.max(0, videoProgress - 0.001));
        }}
      >
        <div className='absolute inset-0 bg-slate-900' ref={progressBarRef} />
        <div
          className="absolute w-0.5 h-full bg-emerald-400"
          style={{ left: `${videoProgress*100}%` }}
        ></div>
        
        {/* KeyFrame Markers */}
        {activeObjData && Object.keys(activeObjData.timeline).map((frame) => (
          <span
            key={frame}
            className="absolute flex items-center justify-center w-8 h-8 -ml-4 cursor-pointer top-1"
            style={{ 
              left: `${parseFloat(frame) * 100}%`,
              color: activeObjData.color
            }}
            aria-label={`关键帧 ${frame}`}
          >
            <TbKeyframeFilled className="text-sm brightness-95 hover:filter-none" />
          </span>
        ))}
      </div>
      { activeObjData && (
        <div className="text-sm">
          {activeObjData.label} id: {activeObjId}
        </div>
      )}
    </div>
  );
};

export default VideoProgress;