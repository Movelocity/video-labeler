'use client'
import { Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { VidPlayer, VidPlayerHandle } from '@/components/videoPlayer/VidPlayer';
import { ObjectList } from '@/components/labeling/ObjectList';
import { LabelingContextProvider } from "@/components/labeling/context";

function Video() {
  const searchParams = useSearchParams()
  const video_path:string = searchParams.get('video_path') as string
  const label_path:string = searchParams.get('label_path') as string

  const videoRef = useRef<VidPlayerHandle>(null);

  return (
    <LabelingContextProvider>
      <div className="w-full h-full flex flex-row px-8 pt-16">
        <VidPlayer
          video_path={video_path}
          label_path={label_path}
          ref={videoRef}
        />
        <ObjectList
          to_progress={(progress)=>{
            videoRef.current?.seekTo(progress);
          }} 
        />
      </div>
    </LabelingContextProvider>
  );
}

export default function VideoPage() {
  return (
    <Suspense>
      <Video/>
    </Suspense>
  )
}