'use client'
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import ReactPlayer from 'react-player'
import BoxesLayer from './BoxesLayer';
import DynamicInputs from './DynamicInputs';

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

const demo_vid_url = "http://localhost:8888/video/penguins.mp4"

export const Player = memo(() => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoPlayer = useVideoPlayer(demo_vid_url);
  const [isDragging, setIsDragging] = useState(false);

  const videoShape: Shape = {
    w: windowHeight * 0.7 * videoPlayer.videoShapeRatio, 
    h: windowHeight * 0.7
  };

  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerApplySeek = useRef<NodeJS.Timeout | null>(null);
  const [activeProgress, setActiveProgress] = useState(0);
  const [isSeeking , setIsSeeking] = useState(false);
  const updateActivaProgress = useCallback((clientX:number)=> {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const fraction = Math.min(Math.max(x / width, 0), 1);
    setActiveProgress(fraction);
    setIsSeeking(true);
    if(timerApplySeek.current){
      clearTimeout(timerApplySeek.current);
      timerApplySeek.current = null;
    }
    timerApplySeek.current = setTimeout(() => {
      videoPlayer.seekTo(fraction);
      setTimeout(()=> {
        setIsSeeking(false);  // 增加延迟，在视频索引完成前保持光标在最新位置
      }, 500)
    }, 500);
  }, [])

  // 鼠标事件跟踪
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    console.log('mouse down')
    updateActivaProgress(e.clientX);
  }, []);

  const [hasWindow, setHasWindow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setHasWindow(true);
  }, []);

  const [labelText, setLabelText] = useState('');
  return (
    <div className='flex flex-row pt-4'>
      <div className='flex flex-col w-[80%] h-full'>
        <div className='mx-auto relative bg-gray-500' style={{width: px(videoShape.w), height: px(videoShape.h)}}>
          { hasWindow && 
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
          <BoxesLayer className='absolute top-0 left-0' width={videoShape.w} height={videoShape.h} labeltext={labelText}/>
          {/* <canvas ref={canvasRef} className="absolute top-0 left-0" width={videoShape.w} height={videoShape.h}></canvas> */}
        </div>
        <div 
          className='mx-auto mt-0 relative h-8 cursor-pointer' 
          style={{width: px(videoShape.w)}}
          onMouseDown={handleMouseDown}
        >
          <div className='text-slate-300 text-xs w-full h-2 flex flex-row justify-between'>
            <span>00:00</span>
            <span>{second2time(videoPlayer.duration*0.25)}</span>
            <span>{second2time(videoPlayer.duration*0.75)}</span>
            <span>{second2time(videoPlayer.duration)}</span>
          </div>
          <div className='absolute bg-slate-600 mt-4 h-4 w-full' ref={progressBarRef}></div>
          <div
            className='absolute bg-slate-400 mt-4 w-2 h-4 cursor-e-resize select-none' 
            style={{left: px((isDragging || isSeeking? activeProgress: videoPlayer.progress)* videoShape.w)}}
          ></div>
        </div>

        <div className='flex flex-row p-3 mx-auto'>
          <button 
            className='cursor-pointer bg-green-600 hover:bg-green-500 rounded-md px-2'
            onClick={videoPlayer.togglePlay}
          >
            {videoPlayer.playing ? 'Pause' : 'Play'}
          </button>

          <button 
            className='cursor-pointer bg-zinc-600 hover:bg-zinc-500 rounded-md px-2 ml-2'
            onClick={() => videoPlayer.seekTo(0.5)}
          >
            Seek Half
          </button>
        </div>
      </div>
      <div className='flex flex-col w-48'>
        <DynamicInputs onSelectText={setLabelText}/>
      </div>
    </div>
  );
})