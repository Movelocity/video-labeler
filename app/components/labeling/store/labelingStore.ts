/** !!! Attention: Objects are now identified by their unique IDs !!! */

import { create } from 'zustand';
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { labelingService } from '@/service/labeling';
import { safeTimeKey } from '@/lib/utils';

interface LabelingState {
  labelData: LabelDataV2 | undefined;
  selectedIds: string[];  // 选中的对象的 id 列表
  activeObjId: string | null;  // 当前选中的对象的 id
  videoProgress: number;  // 当前时间
  
  // Actions
  setLabelData: (data: LabelDataV2) => void;
  toggleObjectSelection: (objId: string) => void;
  setactiveObjId: (objId: string | null) => void;
  setVideoProgress: (time: number) => void;
  loadLabelData: (label_file: string) => Promise<void>;
  
  // Computed
  getCurrentBoxes: () => AnchorBox[];
  getactiveObjIdData: () => LabelObject | undefined;
}

/** 标签数据全局存储 */
export const useLabelingStore = create<LabelingState>((set, get) => ({
  labelData: undefined,
  selectedIds: [],
  activeObjId: null,
  videoProgress: 0,

  // Actions
  /** 设置标签数据 */
  setLabelData: (data) => set({ labelData: data }),
  
  /** 切换对象选择状态 */
  toggleObjectSelection: (objId: string) => set((state) => {
    const object = state.labelData?.objects.find(obj => obj.id === objId);
    if (!object) return state;
    
    const selectedIds = state.selectedIds.includes(objId)
      ? state.selectedIds.filter(id => id !== objId)
      : [...state.selectedIds, objId];
    
    if (state.activeObjId === objId && !selectedIds.includes(objId)) {
      return { selectedIds, activeObjId: null };
    }
    if (!state.activeObjId && selectedIds.includes(objId)) {
      return { selectedIds, activeObjId: objId };
    }
    return { selectedIds };
  }),
  
  /** 设置当前对象 */
  setactiveObjId: (objId) => set({ activeObjId: objId }),
  
  /** 设置当前时间 */
  setVideoProgress: (time) => set({ videoProgress: time }),
  
  /** 加载标签数据 */
  loadLabelData: async (label_file) => {
    try {
      const data = await labelingService.readLabelsV2('', label_file);
      if (data) set({ labelData: data });
    } catch (error) {
      console.error('Error reading labels:', error);
    }
  },

  /** 获取当前对象数据 */
  getactiveObjIdData: () => {
    const { labelData, activeObjId } = get();
    if (!labelData || !activeObjId) return undefined;
    return labelData.objects.find(obj => obj.id === activeObjId);
  },

  /** 获取当前对象框 */
  getCurrentBoxes: () => {
    const state = get();
    const { labelData, selectedIds, videoProgress } = state;
    if (!labelData) return [];
    if (selectedIds.length === 0) return [];

    const boxes: AnchorBox[] = [];
    
    // 遍历选中的对象
    selectedIds.forEach(id => {
      const object = labelData.objects.find(obj => obj.id === id);
      if (!object) return;
      // console.log('id', id, object.timeline)
  
      // 获取对象的所有关键帧时间点
      const timePoints = Object.keys(object.timeline)
        .map(t => parseFloat(t))
        .sort((a, b) => a - b);

      // 找到当前时间 videoProgress 所在的关键帧区间
      let startIdx = -1;
      for (let i = 0; i < timePoints.length - 1; i++) {
        if (videoProgress >= timePoints[i] && videoProgress <= timePoints[i + 1]) {
          startIdx = i;
          break;
        }
      }

      // 如果找到了区间，进行插值计算
      if (startIdx !== -1) {
        const t1 = timePoints[startIdx];
        const t2 = timePoints[startIdx + 1];
        const box1 = object.timeline[safeTimeKey(t1)];
        const box2 = object.timeline[safeTimeKey(t2)];
        // console.log('t1', t1, 'box1', box1)
        // console.log('t2', t2, 'box2', box2)

        // 线性插值计算当前位置
        const ratio = (videoProgress - t1) / (t2 - t1);
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
        const exactTimePoint = timePoints.find(t => Math.abs(t - videoProgress) < 0.001);
        if (exactTimePoint !== undefined) {
          boxes.push(object.timeline[safeTimeKey(exactTimePoint)]);
        }
      }
    });

    return boxes;
  },
})); 