import { FaPlay, FaPause, FaSave, FaTrash } from 'react-icons/fa';
import { second2time } from '../utils';

type VideoControlsProps = {
  playing: boolean;
  duration: number;
  currentTime: number;
  onTogglePlay: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export const VideoControls = ({
  playing,
  duration,
  currentTime,
  onTogglePlay,
  onSave,
  onDelete
}: VideoControlsProps) => {
  return (
    <div className='flex flex-row p-3 mx-auto items-center space-x-3'>
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

      <div className='text-sm text-slate-300 min-w-[80px]'>
        {second2time(currentTime)} / {second2time(duration)}
      </div>

      <div className='flex items-center space-x-2'>
        <button 
          className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
          onClick={onSave}
          title="保存当前帧的标注 (Ctrl + S)"
        >
          <FaSave className="w-4 h-4" />
          <span>Save Frame</span>
        </button>

        <button
          className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
          onClick={onDelete}
          title="删除当前帧的标注"
        >
          <FaTrash className="w-4 h-4" />
          <span>Delete Frame</span>
        </button>
      </div>
    </div>
  );
}; 