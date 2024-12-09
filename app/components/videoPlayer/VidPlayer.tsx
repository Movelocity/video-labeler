'use client'
import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import ReactPlayer from 'react-player'
import { useWindowDimensions } from '@/components/videoPlayer/hooks/useWindowDimensions';
import { useVideoPlayer } from '@/components/videoPlayer/hooks/useVideoPlayer';
import { useKeyboardShortcuts } from '@/components/videoPlayer/hooks/useKeyboardShortcuts';
import { VideoControls } from '@/components/videoPlayer/_partial/VideoControls';
import { videoService } from '@/service/video';
import { useLabelingStore } from '@/components/labeling/store/labelingStore';
import VideoProgress from '@/components/videoPlayer/_partial/VideoProgress';
import { CanvasLayer } from '@/components/BoxesLayer/CanvasLayer';

const px = (n: number) => `${n}px`

interface PlayerProps {
  video_file: string;
  label_file: string;
}

export interface VidPlayerHandle {
  seekTo: (fraction: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export const VidPlayer = forwardRef<VidPlayerHandle, PlayerProps>(({video_file, label_file}, ref) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoPlayer = useVideoPlayer(videoService.getVideoUrl(video_file, label_file));
  const { setVideoProgress } = useLabelingStore()

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
    setActiveProgress(videoPlayer.progress);
  }, [videoPlayer.progress]);

  const [hasWindow, setHasWindow] = useState(false);  // 防止在服务端触发渲染
  const hasInit = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInit.current) {
      console.log('init')
      setHasWindow(true);
      
      hasInit.current = true;
    }
  }, [video_file]);

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    togglePlay: videoPlayer.togglePlay,
    stepForward: videoPlayer.stepForward,
    stepBackward: videoPlayer.stepBackward,
    saveCurrentLabeling: ()=>{},
    deleteCurrentLabeling: ()=>{}
  });

  useEffect(() => {
    if(!videoPlayer.playing) return;
    const interval = setInterval(() => {
      const player = videoPlayer.playerRef.current?.getInternalPlayer() as HTMLVideoElement;
      if (player) {
        setActiveProgress(player.currentTime / player.duration);
      }
    }, 30); // 刷新间隔

    return () => clearInterval(interval);
  }, [videoPlayer.playing]);

  // 暴露方法给外部
  useImperativeHandle(ref, () => ({
    seekTo: (fraction: number) => {
      updateProgressView(fraction);
    },
    getCurrentTime: () => {
      const player = videoPlayer.playerRef.current?.getInternalPlayer() as HTMLVideoElement;
      return player ? player.currentTime : 0;
    },
    getDuration: () => {
      return videoPlayer.duration;
    }
  }));

  return (
    <div className='flex flex-row'>
      <div className='mx-auto flex flex-col h-full' style={{width: px(videoSize.width)}}>
        <div className='relative bg-gray-500 select-none' style={{height: px(videoSize.height)}}>
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
              onEnded={videoPlayer.handleEnded}
            />
          }
          <CanvasLayer
            width={videoSize.width}
            height={videoSize.height}
          />
        </div>

        <VideoProgress
          duration={videoPlayer.duration}
          activeProgress={activeProgress}
          width={videoSize.width}
          onProgressChange={(progress) => {
            videoPlayer.seekTo(progress);
            setActiveProgress(progress);
            if(videoPlayer.playing) {
              videoPlayer.togglePlay();
            }
            setVideoProgress(progress)
          }}
        />
        <VideoControls 
          playing={videoPlayer.playing}
          duration={videoPlayer.duration}
          currentTime={videoPlayer.duration * activeProgress}
          onTogglePlay={videoPlayer.togglePlay}
        />
      </div>
    </div>
  );
})

VidPlayer.displayName = 'VidPlayer';