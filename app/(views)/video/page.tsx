'use client'
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VidPlayer } from '@/components/videoPlayer/VidPlayer';
import { ObjectList } from '@/components/labeling/ObjectList';
import { LabelingContextProvider } from "@/components/labeling/context";



export default function VideoPage() {
  const searchParams = useSearchParams()
  const video_path:string = searchParams.get('video_path') as string
  const label_path:string = searchParams.get('label_path') as string

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LabelingContextProvider>
        <div className="w-screen h-screen flex">
          <VidPlayer
            video_path={video_path}
            label_path={label_path}
          />
          <ObjectList/>
        </div>
      </LabelingContextProvider>
    </Suspense>
  )
}