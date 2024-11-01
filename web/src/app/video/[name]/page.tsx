'use client'
import { useParams } from 'next/navigation'
import {Player} from '@/components/Player'
import { MainContextProvider } from '@/common/context'
export default function Home() {
  const { name } = useParams()
  return (
    <div className="w-full">
      
      <MainContextProvider>
        <Player video_name={name as string}/>
      </MainContextProvider>
    </div>
  );
}