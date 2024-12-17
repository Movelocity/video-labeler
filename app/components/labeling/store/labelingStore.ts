import { create } from 'zustand';
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { labelingService } from '@/service/labeling';
import { safeTimeKey } from '@/lib/utils';

interface LabelingState {
  // Core states
  video_path: string;
  label_path: string;
  /** 一个视频对应的标注数据，包括多个物体 */
  labelData: LabelDataV2 | undefined;
  selectedIds: string[];
  activeObjId: string | null;
  videoProgress: number;
  renderedBoxes: AnchorBox[];
  
  // Basic setters
  setLabelPath: (path: string) => void;
  setVideoPath: (path: string) => void;
  setLabelData: (data: LabelDataV2) => void;
  setVideoProgress: (progress: number) => void;
  setRenderedBoxes: (boxes: AnchorBox[]) => void,
  
  // Selection operations
  toggleObjectSelection: (objId: string) => void;
  setActiveObjId: (objId: string | null) => void;
  
  // Core data operations
  loadLabelData: (label_path: string) => Promise<void>;
  saveObject: (obj: LabelObject) => Promise<void>;
  removeObject: (objId: string) => Promise<void>;
  /** 保存物体id在关键帧time的标注框 */
  saveKeyFrame: (objId: string, time: number, box: AnchorBox) => Promise<void>;
  /** 删除物体id在关键帧time的标注框 */
  removeKeyFrame: (objId: string, time: number) => Promise<void>;
  moveKeyFrame: (objId: string, fromTime: number, toTime: number) => Promise<void>;
}

export const useLabelingStore = create<LabelingState>((set, get) => ({
  // Initial states
  labelData: undefined,
  video_path: '',
  label_path: '',
  selectedIds: [],
  activeObjId: null,
  renderedBoxes: [],
  videoProgress: 0,

  // Basic setters
  setVideoPath: (path) => set({ video_path: path }),
  setLabelPath: (path) => set({ label_path: path }),
  setLabelData: (data) => set({ labelData: data }),
  setVideoProgress: (progress) => set({ videoProgress: progress }),
  setRenderedBoxes: (boxes) => set({ renderedBoxes: boxes }),
  
  // Selection operations
  toggleObjectSelection: (objId) => {
    const { selectedIds, activeObjId } = get();
    const newSelectedIds = selectedIds.includes(objId)
      ? selectedIds.filter(id => id !== objId)
      : [...selectedIds, objId];

    set({
      selectedIds: newSelectedIds,
      activeObjId: activeObjId === objId && !newSelectedIds.includes(objId)
        ? null
        : (!activeObjId && newSelectedIds.includes(objId) ? objId : activeObjId)
    });
  },
  
  setActiveObjId: (objId) => set({ activeObjId: objId }),
  
  // Core data operations
  loadLabelData: async (label_path) => {
    const { video_path } = get();
    try {
      console.log('Reading labels from:', label_path);
      const data = await labelingService.readLabelsV2(video_path, label_path);
      if (data) set({ labelData: data });
    } catch (error) {
      console.error('Error reading labels:', error);
    }
  },

  saveObject: async (obj: LabelObject) => {
    const { labelData, video_path, label_path } = get();
    if (!labelData) return;

    const newLabelData = {
      ...labelData,
      objects: [...labelData.objects, obj]
    };

    set({ labelData: newLabelData });

    try {
      await labelingService.saveLabelingV2(video_path, [obj], label_path);
    } catch (error) {
      console.error('Error saving object:', error);
      set({ labelData });
    }
  },

  removeObject: async (objId: string) => {
    const { labelData, video_path, label_path } = get();
    if (!labelData) return;

    const objectToDelete = labelData.objects.find(obj => obj.id === objId);
    if (!objectToDelete) return;

    const newLabelData = {
      ...labelData,
      objects: labelData.objects.filter(obj => obj.id !== objId)
    };

    set({ labelData: newLabelData });

    try {
      const timePoints = Object.keys(objectToDelete.timeline).map(t => parseFloat(t));
      for (const time of timePoints) {
        await labelingService.deleteLabelingV2(video_path, objId, time, label_path);
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      set({ labelData });
    }
  },

  saveKeyFrame: async (objId: string, time: number, box: AnchorBox) => {
    const { labelData, video_path, label_path } = get();
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
      objects: labelData.objects.map(obj => obj.id === objId ? updatedObject : obj)
    };

    set({ labelData: newLabelData });

    try {
      await labelingService.saveLabelingV2(video_path, [updatedObject], label_path);
    } catch (error) {
      console.error('Error saving keyframe:', error);
      set({ labelData });
    }
  },

  removeKeyFrame: async (objId: string, time: number) => {
    const { labelData, video_path, label_path } = get();
    if (!labelData) return;

    const objectToUpdate = labelData.objects.find(obj => obj.id === objId);
    if (!objectToUpdate) return;

    const { [safeTimeKey(time)]: _, ...remainingTimeline } = objectToUpdate.timeline;
    const updatedObject = {
      ...objectToUpdate,
      timeline: remainingTimeline
    };

    const newLabelData = {
      ...labelData,
      objects: labelData.objects.map(obj => obj.id === objId ? updatedObject : obj)
    };

    set({ labelData: newLabelData });

    try {
      await labelingService.deleteLabelingV2(video_path, objId, time, label_path);
    } catch (error) {
      console.error('Error deleting keyframe:', error);
      set({ labelData });
    }
  },

  moveKeyFrame: async (objId: string, fromTime: number, toTime: number) => {
    const { labelData, label_path } = get();
    if (!labelData) return;
    const objectToUpdate = labelData.objects.find(obj => obj.id === objId);
    if (!objectToUpdate) return;
    const box = objectToUpdate.timeline[safeTimeKey(fromTime)];
    if (!box) return;
    delete objectToUpdate.timeline[safeTimeKey(fromTime)];
    objectToUpdate.timeline[safeTimeKey(toTime)] = box;

    set({ labelData: { ...labelData, objects: [...labelData.objects] } });
    try{
      await labelingService.saveLabelingV2(objectToUpdate.id, [objectToUpdate], label_path);
    } catch (error) {
      console.error('Error moving keyframe:', error);
      set({ labelData });
    }
  },
})); 