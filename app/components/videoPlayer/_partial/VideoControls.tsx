import { FaPlay, FaPause, FaSave, FaTrash } from 'react-icons/fa';
import { second2time } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type VideoControlsProps = {
  playing: boolean;
  duration: number;
  currentTime: number;
  onTogglePlay: () => void;
  onSave?: () => void;
  onDelete?: () => void;
};

export const VideoControls = ({
  playing,
  duration,
  currentTime,
  onTogglePlay,
  onSave,
  onDelete
}: VideoControlsProps) => {
  const router = useRouter();
  return (
    <div className='flex flex-row justify-between p-3 mx-auto items-center space-x-3 w-full'>
      <div 
        className='text-sm text-slate-300 min-w-[80px] cursor-pointer hover:text-slate-400 transition-colors'
        onClick={() => router.back()}
      >
        返回上一页面
      </div>
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
    </div>
  );
}; 