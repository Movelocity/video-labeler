import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { useEffect } from 'react';
import { useLabelingStore } from '../store/labelingStore';
import { TIME_DIFF_THRESHOLD } from '@/lib/constants';
import { safeTimeKey } from '@/lib/utils';

export const useLabeling = () => {
  const store = useLabelingStore();

  // Load label data when path changes
  useEffect(() => {
    console.log("Label path changed:", store.label_path)
    store.loadLabelData(store.label_path);
  }, [store.label_path]);

  // Get active object data
  const getActiveObjectData = (): LabelObject | undefined => {
    if (!store.labelData || !store.activeObjId) return undefined;
    return store.labelData.objects.find(obj => obj.id === store.activeObjId);
  };

  // Get current boxes with interpolation
  const getCurrentBoxes = (): AnchorBox[] => {
    if (!store.labelData || store.selectedIds.length === 0) return [];

    const boxes: AnchorBox[] = [];
    
    store.selectedIds.forEach(id => {
      const object = store.labelData?.objects.find(obj => obj.id === id);
      if (!object) return;

      const timePoints = Object.keys(object.timeline)
        .map(t => parseFloat(t))
        .sort((a, b) => a - b);

      // Find current time interval
      let startIdx = -1;
      for (let i = 0; i < timePoints.length - 1; i++) {
        if (store.videoProgress >= timePoints[i] && store.videoProgress <= timePoints[i + 1]) {
          startIdx = i;
          break;
        }
      }

      if (startIdx !== -1) {
        // Interpolate between keyframes
        const t1 = timePoints[startIdx];
        const t2 = timePoints[startIdx + 1];
        const box1 = object.timeline[safeTimeKey(t1)];
        const box2 = object.timeline[safeTimeKey(t2)];

        const ratio = (store.videoProgress - t1) / (t2 - t1);
        const interpolatedBox: AnchorBox = {
          sx: box1.sx + (box2.sx - box1.sx) * ratio,
          sy: box1.sy + (box2.sy - box1.sy) * ratio,
          w: box1.w + (box2.w - box1.w) * ratio,
          h: box1.h + (box2.h - box1.h) * ratio,
          label: box1.label,
          color: object.color
        };

        boxes.push(interpolatedBox);
      } else {
        // Check for exact time match
        const exactTimePoint = timePoints.find(t => 
          Math.abs(t - store.videoProgress) < TIME_DIFF_THRESHOLD
        );
        if (exactTimePoint !== undefined) {
          const box = object.timeline[safeTimeKey(exactTimePoint)];
          boxes.push({ ...box, color: object.color });
        }
      }
    });

    return boxes;
  };

  // Object operations
  const addObject = async (obj: LabelObject) => {
    await store.saveObject(obj);
    store.toggleObjectSelection(obj.id);
  };

  const deleteObject = async (objId: string) => {
    await store.removeObject(objId);
    if (store.activeObjId === objId) {
      store.setActiveObjId(null);
    }
  };

  const addKeyFrame = async (objId: string, time: number, box: AnchorBox) => {
    await store.saveKeyFrame(objId, time, box);
  };

  const deleteKeyFrame = async (objId: string, time: number) => {
    await store.removeKeyFrame(objId, time);
  };

  const setLabelPath = (path: string) => {
    if(!path) {
      console.log("skip")
      return
    }
    store.setLabelPath(path);
  }

  return {
    // Data
    labelData: store.labelData,
    selectedIds: store.selectedIds,
    activeObjId: store.activeObjId,
    videoProgress: store.videoProgress,
    
    // Getters
    getCurrentBoxes,
    getActiveObjectData,
    
    // Setters
    setVideoProgress: store.setVideoProgress,
    setActiveObjId: store.setActiveObjId,
    toggleObjectSelection: store.toggleObjectSelection,
    
    // Operations
    addObject,
    deleteObject,
    addKeyFrame,
    deleteKeyFrame,

    label_path: store.label_path,
    setLabelPath
  };
};