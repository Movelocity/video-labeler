'use client'
import { createContext, useRef } from 'react'
import { createMainStore } from './store'

type MainStore = ReturnType<typeof createMainStore>
export const MainContext = createContext<MainStore | null>(null)

type MainContextProviderProps = {
  children: React.ReactNode
}

export const MainContextProvider = ({ children }: MainContextProviderProps) => {
  const storeRef = useRef<MainStore>()

  if (!storeRef.current)
    storeRef.current = createMainStore()

  return (
    <MainContext.Provider value={storeRef.current}>
      {children}
    </MainContext.Provider>
  )
}
