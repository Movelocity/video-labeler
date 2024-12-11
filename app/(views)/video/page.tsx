'use client'
// import { useParams } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Player from '@/components/videoPlayer'
import { MainContextProvider } from '@/lib/context'
import { Suspense } from 'react'

function Video() {
  const searchParams = useSearchParams()
  const filepath:string = searchParams.get('filepath') as string
  const label_file:string = searchParams.get('label_file') as string

  return (
    <div className="w-full">
      <MainContextProvider>
        <Player filepath={filepath} label_file={label_file}/>
      </MainContextProvider>
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