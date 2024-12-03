import { useContext } from 'react'
import {
  useStore as useZustandStore,
} from 'zustand'
import { createStore } from 'zustand/vanilla'
import { MainContext } from './context'
import { AnchorBox } from '@/common/types'

type StoreStateValues = {
  editLabels: string[]
}

type StoreState = StoreStateValues & {
  setEditLabels: (labels: string[]) => void
}

type RuntimeState = {
  boxes: AnchorBox[]
  currentVideoName: string
  currentVideoTime: number
  setBoxes: (boxes: AnchorBox[]) => void
  setCurrentVideoName: (name: string) => void
  setCurrentVideoTime: (time: number) => void
}

type MainState = StoreState & RuntimeState

const LOCAL_STORAGE_KEY = 'labelVideo'
const EDITLABELS = LOCAL_STORAGE_KEY+'_editLabels'
const loadFromLocalStorage: ()=>StoreStateValues = () => {
  if(typeof localStorage == 'undefined') return {editLabels: ['']}
  const s_gparam = localStorage.getItem(EDITLABELS)
  return {
    editLabels: s_gparam ? JSON.parse(s_gparam) : [],
  }
};

export const createMainStore = () => {
  return createStore<MainState>((set) => {
    const initialState: StoreState =  {
      ...loadFromLocalStorage(),
      setEditLabels: (labels: string[]) => {
        set(() => {
          return {
            editLabels: labels
          }
        })
        localStorage.setItem(EDITLABELS, JSON.stringify(labels.filter(v=>!!v)))  // 只保留非空值
      }
    }
    const runtimeState: RuntimeState = {
      boxes: [],
      currentVideoName: '',
      currentVideoTime: 0,
      setBoxes: (boxes: AnchorBox[]) => set({boxes}),
      setCurrentVideoName: (name: string) => set({currentVideoName: name}),
      setCurrentVideoTime: (time: number) => set({currentVideoTime: time})
    }

    return {
      ...initialState,
      ...runtimeState
    }
  })
}

/** 用于获取 state。 state 更新时会触发所在组件的更新 */
export function useStore<T>(selector: (state: MainState) => T): T {
  const store = useContext(MainContext)
  if (!store)
    throw new Error('Missing MainContext.Provider in the tree')
  return useZustandStore(store, selector)
}

/**
 * 用于获取 value。
 * value 不更新，什么时候初始化就是时候的值,
 * 可以便捷地得到 store 内的值而不用订阅更新，即“随用随取”，避免不必要的重渲染
*/
export const useMainStore = () => {
  return useContext(MainContext)!
}
