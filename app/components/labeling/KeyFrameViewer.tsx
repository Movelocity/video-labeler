// import { TimelineEntry } from '@/lib/types';
// import { useLabelingStore } from './store/labelingStore';
import cn from 'classnames';
import { randomColor } from '@/lib/utils';
import { useLabeling } from './hooks/useLabeling';
import { TbKeyframe, TbKeyframeFilled } from "react-icons/tb";

interface KeyFrameViewerProps {
  className?: string;
  jump_to_frame?: (frame: number) => void;
}

export const KeyFrameViewer = ({ className, jump_to_frame }: KeyFrameViewerProps) => {
  // const activeObjIdData = useLabelingStore(state => state.getactiveObjData());
  const { getActiveObjectData, renderedBoxes, addKeyFrame, deleteKeyFrame, activeObjId, videoProgress } = useLabeling()
  const activeObjData = getActiveObjectData()
  if (!activeObjData) {
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
    // console.log('Selected frame:', frame, 'Data:', activeObjIdData.timeline[frame]);
  };

  const handleAddKeyFrame = () => {
    if(!activeObjId) return
    const targetBox = renderedBoxes.find(box => box.objId === activeObjId)
    if(!targetBox) return
    addKeyFrame(activeObjId, videoProgress, {...targetBox, objId: undefined, color: undefined})
  }

  const handleDeleteKeyFrame = () => {
    if(!activeObjId) return
    deleteKeyFrame(activeObjId, videoProgress)
  }

  return (
    <div className={cn("bg-slate-800/50 p-4 rounded-lg", className)}>
      <span className="flex flex-row items-center gap-2 shadow-md pb-2">
        <span className="text-slate-400 text-sm">
          关键帧列表
        </span>
        <span className="text-slate-200 text-sm">
          {activeObjData.label}
        </span>
      </span>
      <div className="h-8 bg-slate-900 relative">
        {Object.entries(activeObjData.timeline).sort().map(([frame, data]) => {
          const position = parseFloat(frame) * 100;
          return (
            <button
              key={frame}
              onClick={() => handleKeyFrameClick(frame)}
              className="absolute flex items-center justify-center w-8 h-8 -ml-4 cursor-pointer hover:scale-110 transition-transform"
              style={{ 
                left: `${position}%`,
                backgroundColor: `${activeObjData.color}20`, 
                color: activeObjData.color || randomColor() 
              }}
              aria-label={`关键帧 ${frame}`}
            >
              <TbKeyframeFilled className="text-xl" />
            </button>
          );
        })}
      </div>
      <button
        className="mx-1 hover:text-blue-300"
        onClick={()=> {
          handleAddKeyFrame()
        }}
      >
        add
      </button>
      <button
        className="mx-1 hover:text-blue-300"
        onClick={()=> {
          handleAddKeyFrame()
        }}
      >
        del
      </button>
      <div className='px-2 m-1 p-1 rounded-sm bg-slate-900 overflow-y-scroll'>
        <pre>
          {JSON.stringify(renderedBoxes, null, 2)}
        </pre>
      </div>
    </div>
  );
};
