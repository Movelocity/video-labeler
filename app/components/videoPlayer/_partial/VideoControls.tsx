import { FaPlay, FaPause } from 'react-icons/fa';
import { second2time } from '@/lib/utils';
import { RouteBackBtn } from "@/components/RouteBackBtn"
import cn from "classnames"
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
  const addKeyFrame = useStore(state => state.addKeyFrame)
  const saveKeyFrame = useStore(state => state.saveKeyFrame)
  const deleteKeyFrame = useStore(state => state.removeKeyFrame)
  const setVideoProgress = useStore(state => state.setVideoProgress)
  const activeObjId = useStore(state => state.activeObjId)

  const handleSaveKeyFrame = async () => {
    const { activeObjId, renderedBoxes, videoProgress, tempBox } = labelingStore.getState()
    const activeObjData = getActiveObjectData(labelingStore.getState())

    if(!activeObjId || !activeObjData) return
    const targetBox = renderedBoxes.find(box => box.objId === activeObjId)
    if(targetBox) {
      await saveKeyFrame(activeObjId, videoProgress, {...targetBox, objId: undefined, color: undefined})
      setVideoProgress(videoProgress+0.0000001)
    } else if(tempBox) {
      addKeyFrame(activeObjId, videoProgress)
      await saveKeyFrame(activeObjId, videoProgress, {...tempBox, objId: undefined, color: undefined})
      setVideoProgress(videoProgress+0.0000001)
    }
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

      <div className={cn("flex flex-row justify-end h-full py-1 ", !activeObjId&&"invisible")}>

        <button
          title="更新关键帧"
          className="mx-2 px-4 rounded-md bg-green-700 hover:bg-green-800"
          onClick={()=> {
            handleSaveKeyFrame()
          }}
        >
          标注关键帧
        </button>
        <button
          title="删除当前对应的关键帧"
          className="mx-2 px-4 rounded-md bg-rose-700 hover:bg-rose-800"
          onClick={()=> {
            handleDeleteKeyFrame()
          }}
        >
          删除关键帧
        </button>
      </div>

      <div className='text-sm text-slate-300 min-w-[80px]'>
        {second2time(currentTime)} / {second2time(duration)}
      </div>


    </div>
  );
}; 