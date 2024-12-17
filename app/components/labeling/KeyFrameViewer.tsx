import cn from 'classnames';
import { randomColor } from '@/lib/utils';
import { useLabeling } from './hooks/useLabeling';
import { TbKeyframe, TbKeyframeFilled } from "react-icons/tb";

interface KeyFrameListProps {
  timeline: Record<string, any>;
  color?: string;
  onKeyFrameClick: (frame: string) => void;
}

const KeyFrameList = ({ timeline, color, onKeyFrameClick }: KeyFrameListProps) => {
  return (
    <div className="h-8 bg-slate-900 relative">
      {Object.entries(timeline).sort().map(([frame, data]) => {
        const position = parseFloat(frame) * 100;
        return (
          <span
            key={frame}
            onClick={() => onKeyFrameClick(frame)}
            className="absolute flex items-center justify-center w-8 h-8 -ml-4 cursor-pointer"
            style={{ 
              left: `${position}%`,
              backgroundColor: `${color}20`, 
              color: color || randomColor() 
            }}
            aria-label={`关键帧 ${frame}`}
          >
            <TbKeyframeFilled className="text-xl brightness-50 hover:filter-none" />
          </span>
        );
      })}
    </div>
  );
};

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
    if(!targetBox) {
      addKeyFrame(activeObjId, videoProgress, {sx: 0.4, sy: 0.4, w:0.2, h:0.14, label:""})
      handleKeyFrameClick(videoProgress.toString());
    } else{
      addKeyFrame(activeObjId, videoProgress, {...targetBox, objId: undefined, color: undefined})
    }
  }

  const handleDeleteKeyFrame = () => {
    if(!activeObjId) return
    deleteKeyFrame(activeObjId, videoProgress)
  }

  return (
    <div className={cn("bg-slate-800/50 p-4 rounded-lg", className)}>
      <span className="flex flex-row items-center gap-2 shadow-md pb-2">
        <span className="text-slate-400 text-sm">
          关键帧编辑
        </span>
        <span className="text-slate-200 text-sm">
          {activeObjData.label} id: {activeObjId}
        </span>
        
      </span>
      {/* <div className="h-8 bg-slate-900 relative">
        {Object.entries(activeObjData.timeline).sort().map(([frame, data]) => {
          const position = parseFloat(frame) * 100;
          return (
            <span
              key={frame}
              onClick={() => handleKeyFrameClick(frame)}
              className="absolute flex items-center justify-center w-8 h-8 -ml-4 cursor-pointer"
              style={{ 
                left: `${position}%`,
                backgroundColor: `${activeObjData.color}20`, 
                color: activeObjData.color || randomColor() 
              }}
              aria-label={`关键帧 ${frame}`}
            >
              <TbKeyframeFilled className="text-xl hover:shadow-md shadow-white" />
            </span>
          );
        })}
      </div> */}
      <KeyFrameList // 使用新组件
        timeline={activeObjData.timeline}
        color={activeObjData.color}
        onKeyFrameClick={handleKeyFrameClick}
      />
      <div className="flex flex-row justify-end py-1 mt-2">
        <button
          title="在当前播放进度添加|更新关键帧"
          className="mx-2 px-1 rounded-md bg-green-700"
          onClick={()=> {
            handleAddKeyFrame()
          }}
        >
          Add
        </button>
        <button
          title="删除当前对应的关键帧"
          className="mx-2 px-1 rounded-md bg-rose-700 flex flex-row"
          onClick={()=> {
            handleDeleteKeyFrame()
          }}
        >
          Delete
        </button>
      </div>
      
      <div className='px-2 m-1 p-1 rounded-sm bg-slate-900 overflow-y-scroll'>
        <pre>
          {JSON.stringify(renderedBoxes.find(box => box.objId === activeObjId), null, 2)}
        </pre>
      </div>
    </div>
  );
};
