import { create } from 'zustand';
import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { labelingService } from '@/service/labeling';
import { safeTimeKey } from '@/lib/utils';

interface LabelingState {
  // Core states
  video_path: string;
  label_path: string;
  labelData: LabelDataV2 | undefined;
  
  // Basic setters
  setLabelPath: (path: string) => void;
  setVideoPath: (path: string) => void;
  setLabelData: (data: LabelDataV2) => void;
  
  // Core data operations
  loadLabelData: (label_path: string) => Promise<void>;
  saveObject: (obj: LabelObject) => Promise<void>;
  removeObject: (objId: string) => Promise<void>;
  saveKeyFrame: (objId: string, time: number, box: AnchorBox) => Promise<void>;
  removeKeyFrame: (objId: string, time: number) => Promise<void>;
}

export const useLabelingStore = create<LabelingState>((set, get) => ({
  // Initial states
  labelData: undefined,
  video_path: '',
  label_path: '',

  // Basic setters
  setVideoPath: (path) => set({ video_path: path }),
  setLabelPath: (path) => set({ label_path: path }),
  setLabelData: (data) => set({ labelData: data }),
  
  // Core data operations
  loadLabelData: async (label_path) => {
    const { video_path } = get();
    try {
      const data = await labelingService.readLabelsV2(video_path, label_path);
      if (data) set({ labelData: data });
    } catch (error) {
      console.error('Error reading labels:', error);
    }
  },

  saveObject: async (obj: LabelObject) => {
    const { labelData, video_path } = get();
    if (!labelData) return;

    const newLabelData = {
      ...labelData,
      objects: [...labelData.objects, obj]
    };

    set({ labelData: newLabelData });

    try {
      await labelingService.saveLabelingV2(video_path, [obj]);
    } catch (error) {
      console.error('Error saving object:', error);
      set({ labelData });
    }
  },

  removeObject: async (objId: string) => {
    const { labelData, video_path } = get();
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
        await labelingService.deleteLabelingV2(video_path, objId, time);
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      set({ labelData });
    }
  },

  saveKeyFrame: async (objId: string, time: number, box: AnchorBox) => {
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
      objects: labelData.objects.map(obj => obj.id === objId ? updatedObject : obj)
    };

    set({ labelData: newLabelData });

    try {
      await labelingService.saveLabelingV2(video_path, [updatedObject]);
    } catch (error) {
      console.error('Error saving keyframe:', error);
      set({ labelData });
    }
  },

  removeKeyFrame: async (objId: string, time: number) => {
    const { labelData, video_path } = get();
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
      await labelingService.deleteLabelingV2(video_path, objId, time);
    } catch (error) {
      console.error('Error deleting keyframe:', error);
      set({ labelData });
    }
  },
})); 