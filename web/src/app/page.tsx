import {Player} from '@/app/Player'
import { MainContextProvider } from '@/common/context'
export default function Home() {
  return (
    <div className="h-full w-full">
      <MainContextProvider>
        <Player/>
      </MainContextProvider>
    </div>
  );
}
