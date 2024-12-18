import { FaPlay, FaPause } from 'react-icons/fa';
import { second2time } from '@/lib/utils';
import { RouteBackBtn } from "@/components/RouteBackBtn"

import { useLabelingStore, useStore, getActiveObjectData } from '@/components/labeling/store';


type VideoControlsProps = {
  playing: boolean;
  duration: number;
  currentTime: number;
  onTogglePlay: () => void;
};

export const VideoControls = ({
  playing,
  duration,
  currentTime,
  onTogglePlay
}: VideoControlsProps) => {
  const labelingStore = useLabelingStore()
  const addKeyFrame = useStore(state => state.saveKeyFrame)
  const deleteKeyFrame = useStore(state => state.removeKeyFrame)
  const setVideoProgress = useStore(state => state.setVideoProgress)

  const handleAddKeyFrame = () => {
    const { activeObjId, renderedBoxes, videoProgress } = labelingStore.getState()
    const activeObjData = getActiveObjectData(labelingStore.getState())

    if(!activeObjId || !activeObjData) return
    const targetBox = renderedBoxes.find(box => box.objId === activeObjId)
    if(!targetBox) {
      addKeyFrame(activeObjId, videoProgress, {sx: 0.4, sy: 0.4, w:0.2, h:0.14, label:activeObjData.label})
      // handleKeyFrameClick(videoProgress.toString());  // refresh keyframe viewer
    } else{
      addKeyFrame(activeObjId, videoProgress, {...targetBox, objId: undefined, color: undefined})
    }
    setVideoProgress(videoProgress+0.0000001)
  }

  const handleDeleteKeyFrame = () => {
    const { activeObjId, videoProgress } = labelingStore.getState()
    if(!activeObjId) return
    deleteKeyFrame(activeObjId, videoProgress)
    setVideoProgress(videoProgress+0.0000001)
  }

  return (
    <div className='flex flex-row justify-between p-3 mx-auto items-center space-x-3 w-full'>
      <RouteBackBtn />
      <div className='flex items-center space-x-2'>
        <button 
          className='p-3 rounded-full bg-green-600 hover:bg-green-500 transition-colors'
          onClick={onTogglePlay}
          title="播放/暂停 (空格切换)"
        >
          {playing ? 
            <FaPause className="w-5 h-5" /> : 
            <FaPlay className="w-5 h-5" />
          }
        </button>
      </div>

      

      {/* <div className='flex items-center space-x-2'>
        <button 
          className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
          onClick={onSave}
          title="保存当前帧的标注 (Ctrl + S)"
        >
          <FaSave className="w-4 h-4" />
          <span>保存帧标注</span>
        </button>

        <button
          className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
          onClick={onDelete}
          title="删除当前帧的标注"
        >
          <FaTrash className="w-4 h-4" />
          <span>删除帧标注</span>
        </button>
      </div> */}
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

      <div className='text-sm text-slate-300 min-w-[80px]'>
        {second2time(currentTime)} / {second2time(duration)}
      </div>


    </div>
  );
}; 