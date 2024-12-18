'use client'
import { createContext, useRef } from 'react'
import { createLabelingStore } from './store'

type LabelingStore = ReturnType<typeof createLabelingStore>

type LabelingContextProviderProps = {
  children: React.ReactNode
}

export const LabelingContext = createContext<LabelingStore | null>(null)
export const LabelingContextProvider = ({ children }: LabelingContextProviderProps) => {
  const storeRef = useRef<LabelingStore>()

  if (!storeRef.current)
    storeRef.current = createLabelingStore()

  return (
    <LabelingContext.Provider value={storeRef.current}>
      {children}
    </LabelingContext.Provider>
  )
}
