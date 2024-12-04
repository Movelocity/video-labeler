'use client'
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import ReactPlayer from 'react-player'
import BoxesLayer, { type BoxesLayerHandle } from '@/components/BoxesLayer';
import DynamicInputs from '@/components/DynamicInputs';
import { AnchorBox } from '@/common/types';
import { FaPlay, FaPause, FaSave, FaTrash } from 'react-icons/fa';

const time_diff_threshold = 0.005
const px = (n: number) => `${n}px`
const second2time = (s: number) => {
  const m = Math.floor(s / 60);
  const s2 = Math.floor(s % 60);
  return `${m}:${s2.toString().padStart(2, '0')}`
}

// Custom hook for window dimensions
const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState({ width: 720, height: 720 });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
};

// Custom hook for video player
const useVideoPlayer = (url: string) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoShapeRatio, setVideoShapeRatio] = useState(16/9);
  const playerRef = useRef<ReactPlayer>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleProgress = useCallback((state: { played: number }) => {
    setProgress(state.played);
  }, []);

  const handleReady = useCallback((player: ReactPlayer) => {
    setDuration(player.getDuration());
    const videoElement = player.getInternalPlayer() as HTMLVideoElement;
    setVideoShapeRatio(videoElement.videoWidth / videoElement.videoHeight);
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  const seekTo = useCallback((fraction: number) => {
    playerRef.current?.seekTo(fraction, 'fraction');
  }, []);

  const stepForward = useCallback(() => {
    const player = playerRef.current?.getInternalPlayer() as HTMLVideoElement;
    if (player) {
      player.currentTime += 1/30; // Assuming 30fps
    }
  }, []);

  const stepBackward = useCallback(() => {
    const player = playerRef.current?.getInternalPlayer() as HTMLVideoElement;
    if (player) {
      player.currentTime -= 1/30;
    }
  }, []);

  return {
    playerRef,
    playing,
    progress,
    duration,
    videoShapeRatio,
    handleProgress,
    handleReady,
    togglePlay,
    seekTo,
    url,
    playbackRate,
    setPlaybackRate,
    stepForward,
    stepBackward,
  };
};

type Shape = {
  w: number
  h: number
}

type LabelData = {
  boxes: Array<Shape>
  time: number
}

// Add this helper function near the top
const formatTooltipTime = (duration: number, fraction: number) => {
  const currentTime = duration * fraction;
  return second2time(currentTime);
}

// Add keyboard shortcuts handler
const useKeyboardShortcuts = (controls: {
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  saveCurrentLabeling: () => void;
  deleteCurrentLabeling: () => void;
}) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ': 
          e.preventDefault();
          controls.togglePlay();
          break;
        case 'arrowright':
          if (e.shiftKey) controls.stepForward();
          break;
        case 'arrowleft':
          if (e.shiftKey) controls.stepBackward();
          break;
        case 's':
          if (e.ctrlKey) {
            e.preventDefault();
            controls.saveCurrentLabeling();
          }
          break;
        case 'delete':
          controls.deleteCurrentLabeling();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [controls]);
};

const Player = (props: {filepath: string, label_file: string}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // const videoPlayer = useVideoPlayer("http://localhost:8888/file/"+props.video_name);
  const videoPlayer = useVideoPlayer("/api/video?filepath="+props.filepath+"&label_file="+props.label_file);
  const [labelText, setLabelText] = useState('');
  const boxesLayerRef = useRef<BoxesLayerHandle>(null);
  /** 
   * 后端可以用 {time1: [], time2: [], ...} 存储，
   * 前端用 useState 应该用不了动态 key。所以采用列表存储这些数据 [{time: time1, boxes: []}, {time: time2, boxes: []}] 
  */
  const [labelData, setLabelData] = useState<LabelData[]>([])

  // 计算视频组件的尺寸
  const calculateVideoSize = useCallback(() => {
    const maxWidth = windowWidth * 0.7; // 视频最大宽度为窗口宽度的70%
    const maxHeight = windowHeight * 0.7; // 视频最大高度为窗口高度的70%
    
    let videoWidth = maxWidth;
    let videoHeight = videoWidth / videoPlayer.videoShapeRatio;

    if (videoHeight > maxHeight) {
      videoHeight = maxHeight;
      videoWidth = videoHeight * videoPlayer.videoShapeRatio;
    }

    return { width: videoWidth, height: videoHeight };
  }, [windowWidth, windowHeight, videoPlayer.videoShapeRatio]);
  const videoSize = calculateVideoSize();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeProgress, setActiveProgress] = useState(0);
  
  const updateProgressView = useCallback((fraction:number)=> {
    videoPlayer.seekTo(fraction);
    setActiveProgress(fraction);
  }, [videoPlayer])

  const updateProgress = useCallback((clientX:number)=> {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const fraction = Math.min(Math.max(x / width, 0), 1);
    updateProgressView(fraction);
  }, [updateProgressView])

  useEffect(() => {
    setActiveProgress(videoPlayer.progress);  // 0 ~ 1
  }, [videoPlayer.progress]);


  const [hasWindow, setHasWindow] = useState(false);
  const hasInit = useRef(false);
  useEffect(() => {
    // 前端初始化完毕后会执行 N 次。为了确保只执行 1 次，用 hasInit ref 来标记
    if (typeof window !== "undefined" && !hasInit.current) {
      console.log('init')
      setHasWindow(true);
      
      fetch('/api/labeling?action=read&videopath='+props.filepath+"&label_file="+props.label_file, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        if(!data.labels) return;

        const reconstructedData = Object.keys(data.labels).map(time => {
          return {
            time: parseFloat(time),
            boxes: (data.labels[time] as any[]).map(({sx, sy, w, h, label}) => ({sx, sy, w, h, label}))
          }
        })

        setLabelData(reconstructedData)
      }).catch(error => {
        console.error('read_label:', error);
      });
      hasInit.current = true;
    }
  }, [props.filepath, props.label_file]);

  const saveCurrentLabeling = useCallback(() => {
    console.log('save current labeling')
    const boxes = boxesLayerRef.current?.getBoxes() || [];
    if(boxes.length === 0) return;
    
    const data = {
      video_name: props.filepath,
      boxes: boxes.map(({ sx, sy, w, h, label }) => ({ sx, sy, w, h, label })),  // 只保留这几个属性
      time: activeProgress
    }
    setLabelData(prev => {
      // [...prev, {time: data.time, boxes: data.boxes}]
      // time: 0 ~ 1, 合并时间差 < 0.001 的
      // 先尝试找到一个时间差符合条件的key
      const targetKey = prev.find(item => Math.abs(item.time - data.time)<time_diff_threshold)?.time
      if(targetKey) { // 如果找到了，则更新boxes
        return prev.map(item => item.time === targetKey ? {...item, boxes: data.boxes} : item)
      } else {// 如果没有找到，则添加新的记录
        return [...prev, data]
      }
    })
    fetch("/api/labeling?action=write&videopath="+props.filepath+"&label_file="+props.label_file, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }, [activeProgress, boxesLayerRef.current?.getBoxes(), props.filepath, props.label_file])
  
  const deleteCurrentLabeling = useCallback(() => {
    console.log('delete current labeling')
    
    setLabelData(labelData.filter(item => Math.abs(item.time - activeProgress)>time_diff_threshold))
    fetch("/api/labeling?action=delete&videopath="+props.filepath+"&time="+activeProgress+"&label_file="+props.label_file, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    boxesLayerRef.current?.setBoxes([])
  }, [activeProgress, labelData, props.filepath, props.label_file])

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    togglePlay: videoPlayer.togglePlay,
    stepForward: videoPlayer.stepForward,
    stepBackward: videoPlayer.stepBackward,
    saveCurrentLabeling,
    deleteCurrentLabeling,
  });

  return (
    <div className='flex flex-row pt-4'>
      <div className='mx-auto flex flex-col h-full' style={{width: px(videoSize.width)}}>
        <div className='relative bg-gray-500 select-none' style={{height: px(videoSize.height)}}>
          { hasWindow && // 避免在服务端渲染时触发错误。视频播放器仅支持客户端渲染。
            <ReactPlayer
              ref={videoPlayer.playerRef}
              className='absolute top-0 left-0'
              url={videoPlayer.url}
              width='100%'
              height='100%'
              playing={videoPlayer.playing}
              loop={false}
              controls={false}
              onProgress={videoPlayer.handleProgress}
              onReady={videoPlayer.handleReady}
            />
          }
          {/** 视频遮罩层，用来绘制目标框 */}
          <BoxesLayer 
            className='absolute top-0 left-0' 
            width={videoSize.width} 
            height={videoSize.height} 
            labeltext={labelText}
            ref={boxesLayerRef}
          />
        </div>

        <div className='' style={{width: px(videoSize.width)}}>
          {/* Timeline timestamps */}
          <div className='text-slate-300 text-xs w-full flex flex-row justify-between mb-1'>
            <span>00:00</span>
            <span>{second2time(videoPlayer.duration*0.25)}</span>
            <span>{second2time(videoPlayer.duration*0.75)}</span>
            <span>{second2time(videoPlayer.duration)}</span>
          </div>

          {/* Time markers container */}
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
                  onClick={() => {
                    boxesLayerRef.current?.setBoxes(boxes as AnchorBox[])
                    updateProgressView(time)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Jump to ${formatTooltipTime(videoPlayer.duration, time)}`}
                  onKeyDown={(e) => e.key === 'Enter' && updateProgressView(time)}
                />
                {/* Tooltip */}
                <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 
                              opacity-0 group-hover/marker:opacity-100 transition-opacity
                              bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap'>
                  {formatTooltipTime(videoPlayer.duration, time)}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline control */}
          <div
            className='relative h-4 w-full rounded-full overflow-hidden'
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {updateProgress(e.clientX)}}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(activeProgress * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') updateProgressView(Math.min(1, activeProgress + 0.01));
              if (e.key === 'ArrowLeft') updateProgressView(Math.max(0, activeProgress - 0.01));
            }}
          >
            {/* Progress bar background */}
            <div className='absolute inset-0 bg-slate-700' ref={progressBarRef} />
            {/* Progress bar filled */}
            <div 
              className='absolute inset-y-0 left-0 bg-slate-400 transition-all duration-100'
              style={{width: `${activeProgress * 100}%`}}
            />
            {/* Progress handle */}
            <div
              className='absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full 
                         shadow-lg transition-transform duration-100 hover:scale-125'
              style={{left: `${activeProgress * 100}%`, transform: `translateX(-50%) translateY(-50%)`}}
            />
          </div>
        </div>
            
        {/** 按钮组 */}
        <div className='flex flex-row p-3 mx-auto items-center space-x-3'>
          <div className='flex items-center space-x-2'>
            {/* <button 
              className='p-2 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors'
              onClick={videoPlayer.stepBackward}
              title="Previous frame (Shift + ←)"
            >
              <FaStepBackward className="w-4 h-4" />
            </button> */}
            
            <button 
              className='p-3 rounded-full bg-green-600 hover:bg-green-500 transition-colors'
              onClick={videoPlayer.togglePlay}
              title="Play/Pause (Space)"
            >
              {videoPlayer.playing ? 
                <FaPause className="w-5 h-5" /> : 
                <FaPlay className="w-5 h-5" />
              }
            </button>

            {/* <button 
              className='p-2 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors'
              onClick={videoPlayer.stepForward}
              title="Next frame (Shift + →)"
            >
              <FaStepForward className="w-4 h-4" />
            </button> */}
          </div>

          <div className='text-sm text-slate-300 min-w-[80px]'>
            {second2time(videoPlayer.duration * activeProgress)} / {second2time(videoPlayer.duration)}
          </div>

          {/* <div className='flex items-center space-x-2'>
            <select
              className='bg-zinc-700 rounded px-2 py-1 text-sm'
              value={videoPlayer.playbackRate}
              onChange={(e) => videoPlayer.setPlaybackRate(Number(e.target.value))}
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                <option key={rate} value={rate}>{rate}x</option>
              ))}
            </select>
            <MdSpeed className="w-4 h-4 text-slate-400" />
          </div> */}

          <div className='flex items-center space-x-2'>
            <button 
              className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
              onClick={saveCurrentLabeling}
              title="Save current frame (Ctrl + S)"
            >
              <FaSave className="w-4 h-4" />
              <span>Save Frame</span>
            </button>

            <button
              className='flex items-center space-x-1 px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded-md transition-colors'
              onClick={deleteCurrentLabeling}
              title="Delete current frame (Delete)"
            >
              <FaTrash className="w-4 h-4" />
              <span>Delete Frame</span>
            </button>
          </div>
        </div>
      </div>
      <div className='flex flex-col h-full pr-12 '>
        {/** 提示文本 */}
        <DynamicInputs onSelectText={setLabelText}/>
      </div>
    </div>
  );
}
Player.displayName = "Player"
export default memo(Player)