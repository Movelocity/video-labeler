'use client'
import ReactPlayer from 'react-player'
import {useEffect, useState, useRef} from 'react';

const px = (n: number) => `${n}px`
const second2time = (s: number) => {
  // 123.500 => 2:03
  const m = Math.floor(s / 60);
  const s2 = Math.floor(s % 60);
  return `${m}:${s2.toString().padStart(2, '0')}`
}
export default function MyVideo() {
  const [hasWindow, setHasWindow] = useState(false);
  const vidUrl = "http://localhost:8888/video/penguins.mp4"
  const playerRef = useRef<ReactPlayer>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setHasWindow(true);
  }, []);

  const [windowHeight, setWindowHeight] = useState(720)
  const [windowWidth, setWindowWidth] = useState(720)
  useEffect(() => {
    setWindowHeight(window.innerHeight)
    setWindowWidth(window.innerWidth)
    window.addEventListener("resize", () => {
      setWindowHeight(window.innerHeight)
      setWindowWidth(window.innerWidth)
    })
    console.log("window.innerHeight: ", window.innerHeight)
  }, [])

  const [playing, setPlaying] = useState(false);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoShapeRatio, setVideoShapeRatio] = useState(16/9)  // w/h
  const vidContainerStyle = {
    width: px(windowHeight*0.7*videoShapeRatio),
    height: px(windowHeight*0.7),
  }
  return (
    <div className='flex flex-col w-full h-full'>
      <div className='mx-auto mt-4 relative bg-gray-500' style={vidContainerStyle}>
        { hasWindow 
          && 
          <ReactPlayer
            ref={playerRef}
            className='absolute top-0 left-0'
            url={vidUrl}
            width='100%'
            height='100%'
            playing={playing}
            loop={false}
            light={false}
            controls={true}
            onSeek={(e) => {console.log("onseek", e)}}
            onProgress={(e) => {
              setProgress(e.played)
            }}
            onReady={(e)=> {
              console.log("onReady", e)
              setDuration(e.getDuration())
              setVideoShapeRatio(e.getInternalPlayer().videoWidth / e.getInternalPlayer().videoHeight)
            }}
          />
        }
      </div>
      <div className='mx-auto mt-0 relative h-8' style={{width: vidContainerStyle.width}}>
        <div className='text-slate-300 text-xs w-full h-2 flex flex-row justify-between'>
          <span>00:00</span>
          <span>{second2time(duration*0.25)}</span>
          <span>{second2time(duration*0.75)}</span>
          <span>{second2time(duration)}</span>
        </div>
        <div className='absolute bg-slate-600 mt-4 h-4 w-full'></div>
        <div className='absolute bg-slate-400 mt-4 w-2 h-4 cursor-e-resize' 
          style={{left: px(progress*parseInt(vidContainerStyle.width))}}>{/*control*/}</div>
      </div>

      <div className='flex flex-row p-3 mx-auto'>
        <button 
          className='cursor-pointer bg-green-600 hover:bg-green-500 rounded-md px-2'
          onClick={()=>{
            setPlaying(!playing)
          }}>
          Play
        </button>

        <button 
          className='cursor-pointer bg-zinc-600 hover:bg-zinc-500 rounded-md px-2'
          onClick={()=>{
            playerRef.current?.seekTo(0.5, 'fraction');
          }}>
          Seek Half
        </button>
      </div>
    </div>
  );
}