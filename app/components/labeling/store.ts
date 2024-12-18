import { useContext } from 'react'
import { useStore as useZustandStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { LabelingContext } from './context'
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types'
import { labelingService } from '@/service/labeling'
import { TIME_DIFF_THRESHOLD } from '@/lib/constants'
import { safeTimeKey } from '@/lib/utils'

// Core state types
type StoreStateValues = {
  video_path: string
  label_path: string
  labelData: LabelDataV2 | undefined
  selectedIds: string[]
  activeObjId: string | null
  videoProgress: number
  renderedBoxes: AnchorBox[]
  searchReq: string
  searchRes: string
  gSearchParams: Record<string, string>
  queryCardsStr: string
}

// Store actions type
type StoreActions = {
  // Basic setters
  setVideoPath: (path: string) => void
  setLabelPath: (path: string) => void
  setLabelData: (data: LabelDataV2) => void
  setVideoProgress: (progress: number) => void
  setRenderedBoxes: (boxes: AnchorBox[]) => void
  setSearchReq: (searchReq: string) => void
  setSearchRes: (searchRes: string) => void
  storeSearchReq: (text: string) => void
  storeSearchRes: (text: string) => void
  setGlobalSearchParams: (params: Record<string, string>) => void
  storeGlobalSearchParams: (params: Record<string, string>) => void
  storeQueryCardsStr: (queryCardsStr: string) => void

  // Selection operations
  toggleObjectSelection: (objId: string) => void
  setActiveObjId: (objId: string | null) => void

  // Core data operations
  loadLabelData: (label_path: string) => Promise<void>
  addObject: (obj: LabelObject) => Promise<void>
  updateObject: (obj: LabelObject) => Promise<void>
  removeObject: (objId: string) => Promise<void>
  saveKeyFrame: (objId: string, time: number, box: AnchorBox) => Promise<void>
  removeKeyFrame: (objId: string, time: number) => Promise<void>
  moveKeyFrame: (objId: string, fromTime: number, toTime: number) => Promise<void>
}

type RuntimeState = {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
}

type LabelingState = StoreStateValues & StoreActions & RuntimeState

const loadFromLocalStorage = (): Partial<StoreStateValues> => {
  if (typeof window === 'undefined') return {}
  try {
    const savedState = localStorage.getItem('labelingState')
    return savedState ? JSON.parse(savedState) : {}
  } catch (error) {
    console.error('Error loading state from localStorage:', error)
    return {}
  }
}

export const createLabelingStore = () => {
  return createStore<LabelingState>((set, get) => {
    const initialState: StoreStateValues & StoreActions = {
      // Initial values
      ...loadFromLocalStorage(),
      video_path: '',
      label_path: '',
      labelData: undefined,
      selectedIds: [],
      activeObjId: null,
      renderedBoxes: [],
      videoProgress: 0,
      searchReq: '',
      searchRes: '',
      gSearchParams: {},
      queryCardsStr: '',

      // Basic setters
      setVideoPath: (path) => set({ video_path: path }),
      setLabelPath: (path) => set({ label_path: path }),
      setLabelData: (data) => set({ labelData: data }),
      setVideoProgress: (progress) => set({ videoProgress: progress }),
      setRenderedBoxes: (boxes) => set({ renderedBoxes: boxes }),
      setSearchReq: searchReq => set(() => ({ searchReq })),
      setSearchRes: searchRes => set(() => ({ searchRes })),
      storeSearchReq: (searchReq: string) => {
        set((state) => {
          const newState = { ...state, searchReq }
          return newState
        })
      },
      storeSearchRes: (searchRes: string) => {
        set((state) => {
          const newState = { ...state, searchRes }
          return newState
        })
      },
      setGlobalSearchParams: (params: Record<string, string>) => set(() => ({ gSearchParams: params })),
      storeGlobalSearchParams: (params) => {
        set((state) => {
          const newState = { ...state, gSearchParams: params }
          return newState
        })
      },
      storeQueryCardsStr: (queryCardsStr) => {
        set((state) => {
          const newState = { ...state, queryCardsStr }
          return newState
        })
      },

      // Selection operations
      toggleObjectSelection: (objId) => {
        const { selectedIds, activeObjId } = get()
        const newSelectedIds = selectedIds.includes(objId)
          ? selectedIds.filter(id => id !== objId)
          : [...selectedIds, objId]

        set({
          selectedIds: newSelectedIds,
          activeObjId: activeObjId === objId && !newSelectedIds.includes(objId)
            ? null
            : (!activeObjId && newSelectedIds.includes(objId) ? objId : activeObjId)
        })
      },
      setActiveObjId: (objId) => set({ activeObjId: objId }),

      // Core data operations
      loadLabelData: async (new_label_path) => {
        const { video_path, label_path } = get()
        try {
          console.log('Reading labels from:\n', new_label_path, "\nlabel_path:\n", label_path)
          const data = await labelingService.readLabelsV2(video_path, new_label_path)
          if (data) set({ labelData: data })
        } catch (error) {
          console.error('Error reading labels:', error)
        }
      },

      addObject: async (obj: LabelObject) => {
        const { labelData, video_path, label_path } = get()
        if (!labelData) return

        const newLabelData = {
          ...labelData,
          objects: [...labelData.objects, obj]
        }

        set({ labelData: newLabelData })

        try {
          await labelingService.saveLabelingV2(video_path, [obj], label_path)
        } catch (error) {
          console.error('Error saving object:', error)
          set({ labelData })
        }
      },

      updateObject: async (tgObj: LabelObject) => {
        const { labelData, video_path, label_path } = get()
        if (!labelData) return

        const objectToUpdate = labelData.objects.find(obj => obj.id === tgObj.id)
        if (!objectToUpdate) return

        const updatedObject = {
          ...objectToUpdate,
          ...tgObj
        }
        try {
          await labelingService.saveLabelingV2(video_path, [updatedObject], label_path)
        } catch (error) {
          console.error('Error updating object:', error)
          set({ labelData })
        }
      },

      removeObject: async (objId: string) => {
        const { labelData, video_path, label_path } = get()
        if (!labelData) return

        const objectToDelete = labelData.objects.find(obj => obj.id === objId)
        if (!objectToDelete) return

        const newLabelData = {
          ...labelData,
          objects: labelData.objects.filter(obj => obj.id !== objId)
        }

        set({ labelData: newLabelData })

        try {
          const timePoints = Object.keys(objectToDelete.timeline).map(t => parseFloat(t))
          for (const time of timePoints) {
            await labelingService.deleteLabelingV2(video_path, objId, time, label_path)
          }
        } catch (error) {
          console.error('Error deleting object:', error)
          set({ labelData })
        }
      },

      saveKeyFrame: async (objId: string, time: number, box: AnchorBox) => {
        const { labelData, video_path, label_path } = get()
        if (!labelData) return

        const objectToUpdate = labelData.objects.find(obj => obj.id === objId)
        if (!objectToUpdate) return

        const updatedObject = {
          ...objectToUpdate,
          timeline: {
            ...objectToUpdate.timeline,
            [safeTimeKey(time)]: box
          }
        }

        const newLabelData = {
          ...labelData,
          objects: labelData.objects.map(obj => obj.id === objId ? updatedObject : obj)
        }

        set({ labelData: newLabelData })

        try {
          await labelingService.saveLabelingV2(video_path, [updatedObject], label_path)
        } catch (error) {
          console.error('Error saving keyframe:', error)
          set({ labelData })
        }
      },

      removeKeyFrame: async (objId: string, time: number) => {
        const { labelData, video_path, label_path } = get()
        if (!labelData) return

        const objectToUpdate = labelData.objects.find(obj => obj.id === objId)
        if (!objectToUpdate) return

        const { [safeTimeKey(time)]: _, ...remainingTimeline } = objectToUpdate.timeline
        const updatedObject = {
          ...objectToUpdate,
          timeline: remainingTimeline
        }

        const newLabelData = {
          ...labelData,
          objects: labelData.objects.map(obj => obj.id === objId ? updatedObject : obj)
        }

        set({ labelData: newLabelData })

        try {
          await labelingService.deleteLabelingV2(video_path, objId, time, label_path)
        } catch (error) {
          console.error('Error deleting keyframe:', error)
          set({ labelData })
        }
      },

      moveKeyFrame: async (objId: string, fromTime: number, toTime: number) => {
        const { labelData, label_path } = get()
        if (!labelData) return
        const objectToUpdate = labelData.objects.find(obj => obj.id === objId)
        if (!objectToUpdate) return
        const box = objectToUpdate.timeline[safeTimeKey(fromTime)]
        if (!box) return
        delete objectToUpdate.timeline[safeTimeKey(fromTime)]
        objectToUpdate.timeline[safeTimeKey(toTime)] = box

        set({ labelData: { ...labelData, objects: [...labelData.objects] } })
        try {
          await labelingService.saveLabelingV2(objectToUpdate.id, [objectToUpdate], label_path)
        } catch (error) {
          console.error('Error moving keyframe:', error)
          set({ labelData })
        }
      },
    }

    const runtimeState: RuntimeState = {
      showModal: false,
      setShowModal: showModal => set(() => ({ showModal })),
    }

    return {
      ...initialState,
      ...runtimeState
    }
  })
}

/** 用于获取 state。 state 更新时会触发所在组件的更新 */
export function useStore<T>(selector: (state: LabelingState) => T): T {
  const store = useContext(LabelingContext)
  if (!store)
    throw new Error('Missing LabelingContext.Provider in the tree')
  return useZustandStore(store, selector)
}

/**
 * 用于获取 value。
 * value 不更新，什么时候初始化就是时候的值,
 * 可以便捷地得到 store 内的值而不用订阅更新，即"随用随取"，避免不必要的重渲染
*/
export const useLabelingStore = () => {
  return useContext(LabelingContext)!
}

// Helper functions for box calculations
export const getCurrentBoxes = (state: LabelingState): AnchorBox[] => {
  if (!state.labelData || state.selectedIds.length === 0) return []

  const boxes: AnchorBox[] = []
  
  state.selectedIds.forEach(id => {
    const object = state.labelData?.objects.find(obj => obj.id === id)
    if (!object) return

    const timePoints = Object.keys(object.timeline)
      .map(t => parseFloat(t))
      .sort((a, b) => a - b)

    // Find current time interval
    let startIdx = -1
    for (let i = 0; i < timePoints.length - 1; i++) {
      if (state.videoProgress >= timePoints[i] && state.videoProgress <= timePoints[i + 1]) {
        startIdx = i
        break
      }
    }

    if (startIdx !== -1) {
      // Interpolate between keyframes
      const t1 = timePoints[startIdx]
      const t2 = timePoints[startIdx + 1]
      const box1 = object.timeline[safeTimeKey(t1)]
      const box2 = object.timeline[safeTimeKey(t2)]

      const ratio = (state.videoProgress - t1) / (t2 - t1)
      const interpolatedBox: AnchorBox = {
        sx: box1.sx + (box2.sx - box1.sx) * ratio,
        sy: box1.sy + (box2.sy - box1.sy) * ratio,
        w: box1.w + (box2.w - box1.w) * ratio,
        h: box1.h + (box2.h - box1.h) * ratio,
        label: box1.label,
        color: object.color,
        objId: object.id
      }

      boxes.push(interpolatedBox)
    } else {
      // Check for exact time match
      const exactTimePoint = timePoints.find(t => 
        Math.abs(t - state.videoProgress) < TIME_DIFF_THRESHOLD
      )
      if (exactTimePoint !== undefined) {
        const box = object.timeline[safeTimeKey(exactTimePoint)]
        boxes.push({ ...box, color: object.color, objId: object.id })
      }
    }
  })

  return boxes
}

export const getActiveObjectData = (state: LabelingState): LabelObject | undefined => {
  if (!state.labelData || !state.activeObjId) return undefined
  return state.labelData.objects.find(obj => obj.id === state.activeObjId)
}
