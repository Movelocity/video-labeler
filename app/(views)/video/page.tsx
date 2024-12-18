'use client'
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VidPlayer } from '@/components/videoPlayer/VidPlayer';
import { ObjectList } from '@/components/labeling/ObjectList';
import { LabelingContextProvider } from "@/components/labeling/context";

function Video() {
  const searchParams = useSearchParams()
  const video_path:string = searchParams.get('video_path') as string
  const label_path:string = searchParams.get('label_path') as string

  return (
    <LabelingContextProvider>
      <div className="w-full h-full flex flex-row px-8 pt-16">
        <VidPlayer
          video_path={video_path}
          label_path={label_path}
        />
        <ObjectList/>
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