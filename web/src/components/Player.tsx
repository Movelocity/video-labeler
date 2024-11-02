'use client'
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import ReactPlayer from 'react-player'
import BoxesLayer, { type BoxesLayerHandle } from './BoxesLayer';
import DynamicInputs from './DynamicInputs';
import { AnchorBox } from '@/common/types';

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
    url
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

export const Player = memo((props: {video_name: string}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoPlayer = useVideoPlayer("http://localhost:8888/file/"+props.video_name);
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
  }, [])

  const updateProgress = useCallback((clientX:number)=> {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const fraction = Math.min(Math.max(x / width, 0), 1);
    updateProgressView(fraction);
  }, [])

  useEffect(() => {
    setActiveProgress(videoPlayer.progress);  // 0 ~ 1
  }, [videoPlayer.progress]);
  // 上面的隔 1s 才触发一次，下面的尝试用 setInterval 每 0.1s 触发一次。但依赖的 videoPlayer.progress 还是 1s 才更新一次
  // const pgrIntervalRef = useRef<NodeJS.Timeout|null>(null);
  // useEffect(() => {
  //   if(!videoPlayer.playing) return
  //   if(pgrIntervalRef.current) clearInterval(pgrIntervalRef.current);
  //   pgrIntervalRef.current = setInterval(() => {
  //     setActiveProgress(videoPlayer.progress);
  //     console.log(videoPlayer.progress)
  //   }, 100);
  //   console.log(pgrIntervalRef.current)
  //   return () => {
  //     clearInterval(pgrIntervalRef.current as NodeJS.Timeout);
  //   };
  // }, [videoPlayer.progress, videoPlayer.playing]);

  /**鼠标事件跟踪*/
  // const mouseSeekProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  //   console.log('mouse down')
  //   updateProgressView(e.clientX);
  // }, []);

  const [hasWindow, setHasWindow] = useState(false);
  const hasInit = useRef(false);
  useEffect(() => {
    // 前端初始化完毕后会执行 N 次。为了确保只执行 1 次，用 hasInit ref 来标记
    if (typeof window !== "undefined" && !hasInit.current) {
      console.log('init')
      setHasWindow(true);
      
      fetch('http://localhost:8888/read_label/'+props.video_name, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        if(!data.labels) return;
        // console.log(data)
        // convert {labels: {time1: v1, time2: v2, ...}} --> [{time: time1, boxes: v1}, {time: time2, boxes: v2}]
        const reconstructedData = Object.keys(data.labels).map(time => {
          return {
            time: parseFloat(time),
            boxes: (data.labels[time] as any[]).map(({sx, sy, w, h, label}) => ({sx, sy, w, h, label}))
          }
        })
        // console.log(reconstructedData)
        setLabelData(reconstructedData)
      })
      hasInit.current = true;
    }
  }, []);

  const saveCurrentLabeling = useCallback(() => {
    console.log('save current labeling')
    const boxes = boxesLayerRef.current?.getBoxes() || [];
    if(boxes.length === 0) return;
    
    const data = {
      video_name: props.video_name,
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
    fetch('http://localhost:8888/save_label', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }, [activeProgress, boxesLayerRef.current?.getBoxes()])
  
  const deleteCurrentLabeling = useCallback(() => {
    console.log('delete current labeling')
    setLabelData(labelData.filter(item => Math.abs(item.time - activeProgress)>time_diff_threshold))
    fetch('http://localhost:8888/delete_label/'+props.video_name+"/"+activeProgress, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }, [activeProgress, labelData])

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
          <div className='text-slate-300 text-xs w-full flex flex-row justify-between'>
            <span>00:00</span>
            <span>{second2time(videoPlayer.duration*0.25)}</span>
            <span>{second2time(videoPlayer.duration*0.75)}</span>
            <span>{second2time(videoPlayer.duration)}</span>
          </div>
          {/** 时间标记 */}
          <div className='relative h-6 w-full'>
            {labelData.map(({time, boxes}) => (
              <div 
                key={time} 
                className='text-slate-300 text-xs absolute bg-green-600 hover:bg-green-500 h-6 w-2 cursor-pointer'
                onClick={()=>{
                  boxesLayerRef.current?.setBoxes(boxes as AnchorBox[])
                  updateProgressView(time)
                }}
                style={{left: px(time* videoSize.width)}}
              >
              </div>
            ))}
          </div>
          {/** 时间轴控制 */}
          <div
            className='cursor-pointer relative h-4 w-full'
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {updateProgress(e.clientX)}}
          >
            <div className='absolute bg-slate-600 h-4 w-full' ref={progressBarRef}></div>
            <div
              className='absolute bg-slate-400 w-2 h-4 select-none' 
              style={{left: px(activeProgress* videoSize.width)}}
            ></div>
          </div>
        </div>
            
        {/** 按钮组 */}
        <div className='flex flex-row p-3 mx-auto'>
          {/** 播放控制按钮 */}
          <button 
            className='cursor-pointer bg-green-600 hover:bg-green-500 rounded-md px-2'
            onClick={videoPlayer.togglePlay}
          >
            {videoPlayer.playing ? 'Pause' : 'Play'}
          </button>
          {/** 保存按钮 */}
          <button 
            className='cursor-pointer bg-zinc-600 hover:bg-zinc-500 rounded-md px-2 ml-2'
            onClick={saveCurrentLabeling}
          >
            保存当前帧标记
          </button>
          <button
            className='cursor-pointer bg-zinc-600 hover:bg-zinc-500 rounded-md px-2 ml-2'
            onClick={deleteCurrentLabeling}
          >
            删除当前帧标记
          </button>
        </div>
      </div>
      <div className='flex flex-col h-full pr-12 '>
        {/** 提示文本 */}
        <DynamicInputs onSelectText={setLabelText}/>
      </div>
    </div>
  );
})