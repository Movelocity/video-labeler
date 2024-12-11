'use client'
import { Suspense, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import { VidPlayer, VidPlayerHandle } from '@/components/videoPlayer/VidPlayer';
import { ObjectList } from '@/components/labeling/ObjectList';
function Video() {
  const searchParams = useSearchParams()
  const filepath:string = searchParams.get('filepath') as string
  const label_file:string = searchParams.get('label_file') as string
  const videoRef = useRef<VidPlayerHandle>(null);

  return (
    <div className="w-full h-full flex flex-row px-8 pt-16">
      <VidPlayer
        video_file={filepath} 
        label_file={label_file} 
        ref={videoRef}
      />
      <ObjectList
        label_file={label_file} 
        to_progress={(progress)=>{
          videoRef.current?.seekTo(progress);
        }} 
      />
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense>
      <Video/>
    </Suspense>
  )
}