/** !!! Attention: Objects are now identified by their unique IDs !!! */

import { create } from 'zustand';
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { labelingService } from '@/service/labeling';

interface LabelingState {
  labelData: LabelDataV2 | undefined;
  selectedObjects: string[];
  activeObject: string | null;
  currentTime: number;
  
  // Actions
  setLabelData: (data: LabelDataV2) => void;
  toggleObjectSelection: (objId: string) => void;
  setActiveObject: (objId: string | null) => void;
  setCurrentTime: (time: number) => void;
  loadLabelData: (label_file: string) => Promise<void>;
  
  // Computed
  getCurrentBoxes: () => AnchorBox[];
  getActiveObjectData: () => LabelObject | undefined;
}

export const useLabelingStore = create<LabelingState>((set, get) => ({
  labelData: undefined,
  selectedObjects: [],
  activeObject: null,
  currentTime: 0,

  setLabelData: (data) => set({ labelData: data }),
  
  toggleObjectSelection: (objId: string) => set((state) => {
    const object = state.labelData?.objects.find(obj => obj.id === objId);
    if (!object) return state;
    
    const selectedObjects = state.selectedObjects.includes(objId)
      ? state.selectedObjects.filter(id => id !== objId)
      : [...state.selectedObjects, objId];
    
    if (state.activeObject === objId && !selectedObjects.includes(objId)) {
      return { selectedObjects, activeObject: null };
    }
    if (!state.activeObject && selectedObjects.includes(objId)) {
      return { selectedObjects, activeObject: objId };
    }
    return { selectedObjects };
  }),
  
  setActiveObject: (objId) => set({ activeObject: objId }),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  loadLabelData: async (label_file) => {
    try {
      const data = await labelingService.readLabelsV2('', label_file);
      if (data) set({ labelData: data });
    } catch (error) {
      console.error('Error reading labels:', error);
    }
  },

  getActiveObjectData: () => {
    const { labelData, activeObject } = get();
    if (!labelData || !activeObject) return undefined;
    return labelData.objects.find(obj => obj.id === activeObject);
  },

  getCurrentBoxes: () => {
    const state = get();
    const { labelData, selectedObjects, currentTime } = state;
    if (!labelData) return [];
    if (selectedObjects.length === 0) return [];

    const boxes: AnchorBox[] = [];
    
    selectedObjects.forEach(id => {
      const object = labelData.objects.find(obj => obj.id === id);
      if (!object) return;

      // 获取对象的所有关键帧时间点
      const timePoints = Object.keys(object.timeline)
        .map(t => parseFloat(t))
        .sort((a, b) => a - b);

      // 找到当前时间所在的关键帧区间
      let startIdx = -1;
      for (let i = 0; i < timePoints.length - 1; i++) {
        if (currentTime >= timePoints[i] && currentTime <= timePoints[i + 1]) {
          startIdx = i;
          break;
        }
      }

      // 如果找到了区间，进行插值计算
      if (startIdx !== -1) {
        const t1 = timePoints[startIdx];
        const t2 = timePoints[startIdx + 1];
        const box1 = object.timeline[t1.toString()];
        const box2 = object.timeline[t2.toString()];

        // 线性插值计算当前位置
        const ratio = (currentTime - t1) / (t2 - t1);
        const interpolatedBox: AnchorBox = {
          sx: box1.sx + (box2.sx - box1.sx) * ratio,
          sy: box1.sy + (box2.sy - box1.sy) * ratio,
          w: box1.w + (box2.w - box1.w) * ratio,
          h: box1.h + (box2.h - box1.h) * ratio,
          label: box1.label
        };

        boxes.push(interpolatedBox);
      }
      // 如果当前时间正好等于某个关键帧时间点
      else {
        const exactTimePoint = timePoints.find(t => Math.abs(t - currentTime) < 0.001);
        if (exactTimePoint !== undefined) {
          boxes.push(object.timeline[exactTimePoint.toString()]);
        }
      }
    });

    return boxes;
  },
})); 