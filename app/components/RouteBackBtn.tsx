import { FC } from "react"
import { useRouter } from 'next/navigation';
import cn from "classnames"

interface RouteBackBtnProps {
  className?: string
  text?: string
}
export const RouteBackBtn: FC<RouteBackBtnProps> = ({ className, text }) => {
  const router = useRouter();
  return (
    <div 
      className={cn('text-sm text-slate-300 min-w-[80px] cursor-pointer hover:text-slate-400 transition-colors', className)}
      onClick={() => router.back()}
    >
      {text || 'Back'}
    </div>
  );

}