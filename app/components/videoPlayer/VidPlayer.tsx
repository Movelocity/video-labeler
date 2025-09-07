'use client'
import { useEffect, useState, useRef, useCallback, FC } from 'react';
import ReactPlayer from 'react-player'
import { useWindowDimensions } from '@/components/videoPlayer/hooks/useWindowDimensions';
import { useVideoPlayer } from '@/components/videoPlayer/hooks/useVideoPlayer';
import { useKeyboardShortcuts } from '@/components/videoPlayer/hooks/useKeyboardShortcuts';
import { VideoControls } from '@/components/videoPlayer/_partial/VideoControls';
import { videoService } from '@/service/video';
import { useLabelingStore, useStore } from '@/components/labeling/store';
import VideoProgress from '@/components/videoPlayer/_partial/VideoProgress';
import { CanvasLayer } from '@/components/BoxesLayer/CanvasLayer';

// const px = (n: number) => `${n}px`

interface PlayerProps {
  video_path: string;
  label_path: string;
}

export const VidPlayer: FC<PlayerProps> = (({video_path, label_path}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoPlayer = useVideoPlayer(videoService.getVideoUrl(video_path, label_path));
  const labelingStore = useLabelingStore()
  const setVideoProgress = useStore(state => state.setVideoProgress)
  const videoProgress = useStore(state => state.videoProgress)
  const container1Ref = useRef<HTMLDivElement>(null)
  const container2Ref = useRef<HTMLDivElement>(null)
  // const { setVideoProgress, setLabelPath, setVideoPath } = useLabeling()

  useEffect(()=>{
    const { loadLabelData } = labelingStore.getState()
    loadLabelData(video_path, label_path)
  }, [video_path, label_path])

  // 计算视频组件的尺寸
  const calculateVideoSize = useCallback(() => {
    // const maxWidth = windowWidth * 0.7; // 视频最大宽度为窗口宽度的70%
    // const maxHeight = windowHeight * 0.7; // 视频最大高度为窗口高度的70%
    
    // let videoWidth = maxWidth;
    // let videoHeight = videoWidth / videoPlayer.videoShapeRatio;

    // if (videoHeight > maxHeight) {
    //   videoHeight = maxHeight;
    //   videoWidth = videoHeight * videoPlayer.videoShapeRatio;
    // }

    // return { width: videoWidth, height: videoHeight };
    return { 
      width: container1Ref.current?.clientWidth || 100, 
      height: container2Ref.current?.clientHeight || 100 
    };
  }, [windowHeight, windowWidth, videoPlayer.videoShapeRatio]);

  const videoSize = calculateVideoSize();

  const [hasWindow, setHasWindow] = useState(false);  // 防止在服务端触发渲染
  const hasInit = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInit.current) {
      console.log('init')
      setHasWindow(true);
      hasInit.current = true;
    }
  }, [video_path]);

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
        const progressInRatio = player.currentTime / player.duration;
        // setActiveProgress(progressInRatio);
        setVideoProgress(progressInRatio)
      }
    }, 30); // 刷新间隔 ms

    return () => clearInterval(interval);
  }, [videoPlayer.playing]);

  return (
    <div className='pt-16 h-full flex flex-1 flex-col' ref={container1Ref}>
      {/* <div className='mx-auto flex flex-col h-full' > */}
      <div ref={container2Ref} id='video-container' className='relative w-full flex-1 bg-gray-900 select-none'>
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
          containerHeight={videoSize.height}
          containerWidth={videoSize.width}
          videoWidth={videoPlayer.videoSize.width}
          videoHeight={videoPlayer.videoSize.height}
        />
      </div>

      <VideoProgress
        duration={videoPlayer.duration}
        // activeProgress={activeProgress}
        width={videoSize.width}
        onProgressChange={(progress) => {
          videoPlayer.seekTo(progress);
          // setActiveProgress(progress);
          if(videoPlayer.playing) {
            videoPlayer.togglePlay();
          }
          setVideoProgress(progress)
        }}
      />
      <VideoControls 
        playing={videoPlayer.playing}
        duration={videoPlayer.duration}
        currentTime={videoPlayer.duration * videoProgress}
        onTogglePlay={videoPlayer.togglePlay}
      />
      {/* </div> */}
    </div>
  );
})
