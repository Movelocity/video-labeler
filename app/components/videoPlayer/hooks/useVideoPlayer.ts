import { useState, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';

export const useVideoPlayer = (url: string) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [videoShapeRatio, setVideoShapeRatio] = useState(16/9);
  const playerRef = useRef<ReactPlayer>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleProgress = useCallback((state: { played: number }) => {
    setProgress(state.played);
  }, []);

  const handleReady = useCallback((player: ReactPlayer) => {
    setDuration(player.getDuration());
    const videoElement = player.getInternalPlayer() as HTMLVideoElement;
    setVideoSize({ width: videoElement.videoWidth, height: videoElement.videoHeight });
    console.log("videoSize: ", { width: videoElement.videoWidth, height: videoElement.videoHeight })
    setVideoShapeRatio(videoElement.videoWidth / videoElement.videoHeight);
    console.log("videoShapeRatio: ", videoShapeRatio)
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
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
      player.currentTime += 1/30;
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
    videoSize,
    handleProgress,
    handleReady,
    handleEnded,
    togglePlay,
    seekTo,
    url,
    playbackRate,
    setPlaybackRate,
    stepForward,
    stepBackward,
  };
}; 