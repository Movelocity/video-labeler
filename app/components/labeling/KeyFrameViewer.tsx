import cn from 'classnames';
import { randomColor } from '@/lib/utils';
// import { useLabeling } from './hooks/useLabeling';
import { useLabelingStore, useStore, getActiveObjectData } from '@/components/labeling/store';
import { TbKeyframe, TbKeyframeFilled } from "react-icons/tb";

interface KeyFrameListProps {
  timeline: Record<string, any>;
  color?: string;
  onKeyFrameClick: (frame: string) => void;
}

const KeyFrameList = ({ timeline, color, onKeyFrameClick }: KeyFrameListProps) => {
  const videoProgress = useStore(state => state.videoProgress)
  return (
    <div className="h-12 bg-slate-900 relative">
      {/** progress hint */}
      <div
        className="absolute w-0.5 h-full bg-emerald-500"
        style={{ left: `${videoProgress*100}%` }}
      ></div>
      {Object.entries(timeline).sort().map(([frame, data]) => (
          <span
            key={frame}
            onClick={() => onKeyFrameClick(frame)}
            className="absolute flex items-center justify-center w-8 h-8 -ml-4 mt-4 cursor-pointer"
            style={{ 
              left: `${parseFloat(frame) * 100}%`,
              backgroundColor: `${color}20`, 
              color: color || randomColor() 
            }}
            aria-label={`关键帧 ${frame}`}
          >
            <TbKeyframeFilled className="text-xl brightness-50 hover:filter-none" />
          </span>
        )
      )}
    </div>
  );
};

interface KeyFrameViewerProps {
  className?: string;
  jump_to_frame?: (frame: number) => void;
}

export const KeyFrameViewer = ({ className, jump_to_frame }: KeyFrameViewerProps) => {
  // const activeObjIdData = useLabelingStore(state => state.getactiveObjData());
  const labelingStore = useLabelingStore()
  const addKeyFrame = useStore(state => state.saveKeyFrame)
  const deleteKeyFrame = useStore(state => state.removeKeyFrame)

  const activeObjId = useStore(state => state.activeObjId)
  const renderedBoxes = useStore(state => state.renderedBoxes)
  // const { getActiveObjectData, renderedBoxes, addKeyFrame, deleteKeyFrame, activeObjId, videoProgress } = useLabeling()

  const activeObjData = getActiveObjectData(labelingStore.getState())
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
    if(!jump_to_frame) return;
    jump_to_frame(parseFloat(frame));
    // console.log('Selected frame:', frame, 'Data:', activeObjIdData.timeline[frame]);
  };

  const handleAddKeyFrame = () => {
    const { activeObjId, renderedBoxes, videoProgress } = labelingStore.getState()
    if(!activeObjId) return
    const targetBox = renderedBoxes.find(box => box.objId === activeObjId)
    if(!targetBox) {
      addKeyFrame(activeObjId, videoProgress, {sx: 0.4, sy: 0.4, w:0.2, h:0.14, label:activeObjData.label})
      handleKeyFrameClick(videoProgress.toString());
    } else{
      addKeyFrame(activeObjId, videoProgress, {...targetBox, objId: undefined, color: undefined})
    }
  }

  const handleDeleteKeyFrame = () => {
    const { activeObjId, videoProgress } = labelingStore.getState()
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
      {/* <KeyFrameList // 使用新组件
        timeline={activeObjData.timeline}
        color={activeObjData.color}
        onKeyFrameClick={handleKeyFrameClick}
      /> */}
      <div className="flex flex-row justify-end py-1 mt-2">
        <button
          title="在当前播放进度添加|更新关键帧"
          className="mx-2 px-1 rounded-md bg-green-700 hover:bg-green-800"
          onClick={()=> {
            handleAddKeyFrame()
          }}
        >
          Add&Save
        </button>
        <button
          title="删除当前对应的关键帧"
          className="mx-2 px-1 rounded-md bg-rose-700 hover:bg-rose-800"
          onClick={()=> {
            handleDeleteKeyFrame()
          }}
        >
          Delete
        </button>
      </div>
      
      {/* <div className='px-2 m-1 p-1 rounded-sm bg-slate-900 overflow-y-scroll'>
        <pre>
          {JSON.stringify(renderedBoxes.find(box => box.objId === activeObjId), null, 2)}
        </pre>
      </div> */}
    </div>
  );
};
