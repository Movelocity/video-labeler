'use client'
// import { useParams } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Player } from './Player'
import { MainContextProvider } from '@/common/context'

export default function VideoPage() {
  const searchParams = useSearchParams()
  const filepath = searchParams.get('filepath')

  return (
    <div className="w-full">
      <MainContextProvider>
        <Player filepath={filepath as string}/>
      </MainContextProvider>
    </div>
  );
}