/** !!! Attention: Objects are now identified by their unique IDs !!! */

import { create } from 'zustand';
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { labelingService } from '@/service/labeling';
import { safeTimeKey } from '@/lib/utils';
import { TIME_DIFF_THRESHOLD } from '@/lib/constants';

interface LabelingState {
  video_path: string;
  label_path: string;
  labelData: LabelDataV2 | undefined;
  selectedIds: string[];  // 选中的对象的 id 列表
  activeObjId: string | null;  // 当前选中的对象的 id
  videoProgress: number;  // 当前时间
  
  // Actions
  setLabelPath: (path: string) => void;
  setVideoPath: (path: string) => void;
  setLabelData: (data: LabelDataV2) => void;
  toggleObjectSelection: (objId: string) => void;
  setactiveObjId: (objId: string | null) => void;
  setVideoProgress: (time: number) => void;
  loadLabelData: (label_path: string) => Promise<void>;
  
  // Computed
  getCurrentBoxes: () => AnchorBox[];
  getactiveObjData: () => LabelObject | undefined;

  addObject: (obj: LabelObject) => Promise<void>,
  deleteObject: (objId: string) => Promise<void>,
  addKeyFrame: (objId: string, time: number, box: AnchorBox) => Promise<void>,
  deleteKeyFrame: (objId: string, time: number) => Promise<void>,
}

/** 标签数据全局存储 */
export const useLabelingStore = create<LabelingState>((set, get) => ({
  labelData: undefined,
  video_path: '',
  label_path: '',
  selectedIds: [],
  activeObjId: null,
  videoProgress: 0,

  // Actions
  /** 设置标签数据 */
  setVideoPath: (path) => set({ video_path: path }),
  setLabelPath: (path) => set({ label_path: path }),
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
  
  /** 设置当前时间 0~1 */
  setVideoProgress: (time) => set({ videoProgress: time }),
  
  /** 加载标签数据 */
  loadLabelData: async (label_path) => {
    const { video_path } = get();
    try {
      const data = await labelingService.readLabelsV2(video_path, label_path);
      if (data) set({ labelData: data });
    } catch (error) {
      console.error('Error reading labels:', error);
    }
  },

  /** 获取当前对象数据 */
  getactiveObjData: () => {
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
      const the_object = labelData.objects.find(obj => obj.id === id);
      if (!the_object) return;
      // console.log('id', id, object.timeline)
  
      // 获取对象的所有关键帧时间点
      const timePoints = Object.keys(the_object.timeline)
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
        const box1 = the_object.timeline[safeTimeKey(t1)];
        const box2 = the_object.timeline[safeTimeKey(t2)];
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
        interpolatedBox.color = the_object.color;

        boxes.push(interpolatedBox);
      }
      // 如果当前时间正好等于某个关键帧时间点
      else {
        const exactTimePoint = timePoints.find(t => Math.abs(t - videoProgress) < TIME_DIFF_THRESHOLD);
        if (exactTimePoint !== undefined) {
          boxes.push(the_object.timeline[safeTimeKey(exactTimePoint)]);
        }
      }
    });

    return boxes;
  },

  /** 添加新对象 */
  addObject: async (obj: LabelObject) => {
    const { labelData, video_path } = get();
    if (!labelData) return;

    const newLabelData = {
      ...labelData,
      objects: [...labelData.objects, obj]
    };

    // 更新本地状态
    set({ labelData: newLabelData });

    // 保存到服务器
    try {
      await labelingService.saveLabelingV2(video_path, [obj]);
    } catch (error) {
      console.error('Error saving new object:', error);
      // 如果保存失败，回滚状态
      set({ labelData });
    }
  },

  /** 删除对象 */
  deleteObject: async (objId: string) => {
    const { labelData, video_path, selectedIds, activeObjId } = get();
    if (!labelData) return;

    const objectToDelete = labelData.objects.find(obj => obj.id === objId);
    if (!objectToDelete) return;

    const newLabelData = {
      ...labelData,
      objects: labelData.objects.filter(obj => obj.id !== objId)
    };

    // 更新本地状态
    const newSelectedIds = selectedIds.filter(id => id !== objId);
    const newActiveObjId = activeObjId === objId ? null : activeObjId;
    
    set({ 
      labelData: newLabelData,
      selectedIds: newSelectedIds,
      activeObjId: newActiveObjId
    });

    // 保存到服务器
    try {
      // 遍历对象的所有时间点并删除
      const timePoints = Object.keys(objectToDelete.timeline).map(t => parseFloat(t));
      for (const time of timePoints) {
        await labelingService.deleteLabelingV2(video_path, objId, time);
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      // 如果删除失败，回滚状态
      set({ 
        labelData,
        selectedIds,
        activeObjId
      });
    }
  },

  /** 添加关键帧 */
  addKeyFrame: async (objId: string, time: number, box: AnchorBox) => {
    const { labelData, video_path } = get();
    if (!labelData) return;

    const objectToUpdate = labelData.objects.find(obj => obj.id === objId);
    if (!objectToUpdate) return;

    const updatedObject = {
      ...objectToUpdate,
      timeline: {
        ...objectToUpdate.timeline,
        [safeTimeKey(time)]: box
      }
    };

    const newLabelData = {
      ...labelData,
      objects: labelData.objects.map(obj => 
        obj.id === objId ? updatedObject : obj
      )
    };

    // 更新本地状态
    set({ labelData: newLabelData });

    // 保存到服务器
    try {
      await labelingService.saveLabelingV2(video_path, [updatedObject]);
    } catch (error) {
      console.error('Error adding keyframe:', error);
      // 如果保存失败，回滚状态
      set({ labelData });
    }
  },

  /** 删除关键帧 */
  deleteKeyFrame: async (objId: string, time: number) => {
    const { labelData, video_path } = get();
    if (!labelData) return;

    const objectToUpdate = labelData.objects.find(obj => obj.id === objId);
    if (!objectToUpdate) return;

    // 创建新的 timeline，排除要删除的时间点
    const { [safeTimeKey(time)]: _, ...remainingTimeline } = objectToUpdate.timeline;

    const updatedObject = {
      ...objectToUpdate,
      timeline: remainingTimeline
    };

    const newLabelData = {
      ...labelData,
      objects: labelData.objects.map(obj => 
        obj.id === objId ? updatedObject : obj
      )
    };

    // 更新本地状态
    set({ labelData: newLabelData });

    // 保存到服务器
    try {
      await labelingService.deleteLabelingV2(video_path, objId, time);
    } catch (error) {
      console.error('Error deleting keyframe:', error);
      // 如果删除失败，回滚状态
      set({ labelData });
    }
  },
})); 