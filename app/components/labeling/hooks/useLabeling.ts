import { LabelDataV2 } from '@/lib/types';
import { useState, useEffect } from 'react';
import { labelingService } from '@/service/labeling';

export const useLabeling = (label_path: string) => {
  const [labelData, setLabelData] = useState<LabelDataV2>();
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  useEffect(() => {
    labelingService.readLabelsV2('', label_path)
      .then(data => {
        if(data) setLabelData(data);
      })
      .catch(error => {
        console.error('Error reading labels:', error);
      });
  }, [label_path]);

  const selectedObjectData = selectedObject && labelData?.objects.find(obj => obj.label === selectedObject);

  return {
    labelData,
    selectedObject,
    setSelectedObject,
    selectedObjectData
  };
};