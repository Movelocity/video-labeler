import { LabelDataV2, AnchorBox, LabelObject } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useLabelingStore } from '../store/labelingStore';
import { TIME_DIFF_THRESHOLD } from '@/lib/constants';
import { safeTimeKey } from '@/lib/utils';

export const useLabeling = ()  => {
  const store = useLabelingStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeObjId, setActiveObjId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  const [label_path, setLabelPath] = useState('');

  // Load label data when path changes
  useEffect(() => {
    store.loadLabelData(label_path);
  }, [label_path]);

  // Object selection logic
  const toggleObjectSelection = (objId: string) => {
    const object = store.labelData?.objects.find(obj => obj.id === objId);
    if (!object) return;
    
    setSelectedIds(prev => {
      const newSelectedIds = prev.includes(objId)
        ? prev.filter(id => id !== objId)
        : [...prev, objId];

      // Update active object
      if (activeObjId === objId && !newSelectedIds.includes(objId)) {
        setActiveObjId(null);
      } else if (!activeObjId && newSelectedIds.includes(objId)) {
        setActiveObjId(objId);
      }

      return newSelectedIds;
    });
  };

  // Get active object data
  const getActiveObjectData = (): LabelObject | undefined => {
    if (!store.labelData || !activeObjId) return undefined;
    return store.labelData.objects.find(obj => obj.id === activeObjId);
  };

  // Get current boxes with interpolation
  const getCurrentBoxes = (): AnchorBox[] => {
    if (!store.labelData || selectedIds.length === 0) return [];

    const boxes: AnchorBox[] = [];
    
    selectedIds.forEach(id => {
      const object = store.labelData?.objects.find(obj => obj.id === id);
      if (!object) return;

      const timePoints = Object.keys(object.timeline)
        .map(t => parseFloat(t))
        .sort((a, b) => a - b);

      // Find current time interval
      let startIdx = -1;
      for (let i = 0; i < timePoints.length - 1; i++) {
        if (videoProgress >= timePoints[i] && videoProgress <= timePoints[i + 1]) {
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

        const ratio = (videoProgress - t1) / (t2 - t1);
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
          Math.abs(t - videoProgress) < TIME_DIFF_THRESHOLD
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
    setSelectedIds(prev => [...prev, obj.id]);
    setActiveObjId(obj.id);
  };

  const deleteObject = async (objId: string) => {
    await store.removeObject(objId);
    setSelectedIds(prev => prev.filter(id => id !== objId));
    if (activeObjId === objId) {
      setActiveObjId(null);
    }
  };

  const addKeyFrame = async (objId: string, time: number, box: AnchorBox) => {
    await store.saveKeyFrame(objId, time, box);
  };

  const deleteKeyFrame = async (objId: string, time: number) => {
    await store.removeKeyFrame(objId, time);
  };

  return {
    // Data
    labelData: store.labelData,
    selectedIds,
    activeObjId,
    videoProgress,
    
    // Getters
    getCurrentBoxes,
    getActiveObjectData,
    
    // Setters
    setVideoProgress,
    setActiveObjId,
    toggleObjectSelection,
    
    // Operations
    addObject,
    deleteObject,
    addKeyFrame,
    deleteKeyFrame,

    label_path,
    setLabelPath
  };
};