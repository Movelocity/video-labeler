import { LabelData, AnchorBox } from '@/lib/types';

interface SaveLabelingParams {
  video_name: string;
  boxes: AnchorBox[];
  time: number;
}

interface TimelineEntry {
  [time: string]: AnchorBox;
}

interface LabelObject {
  label: string;
  timeline: TimelineEntry;
}

interface LabelDataV2 {
  metadata: Record<string, any>;
  labels?: Record<string, AnchorBox[]>;
  objects: LabelObject[];
  version: 2;
}

interface SaveLabelingV2Params {
  video_name: string;
  object_updates: LabelObject[];
}

interface DeleteLabelingV2Params {
  video_name: string;
  label: string;
  time: number;
}

/** 标注服务 */
export const labelingService = {
  // V1 API 兼容接口
  async readLabels(videopath: string, label_file: string): Promise<LabelData[]> {
    const response = await fetch(`/api/labeling?action=read&videopath=${videopath}&label_file=${label_file}`, {
      method: 'GET'
    });
    const data = await response.json();
    
    if (!data.labels) return [];

    return Object.keys(data.labels).map(time => ({
      time: parseFloat(time),
      boxes: data.labels[time].map(({sx, sy, w, h, label}: AnchorBox) => ({sx, sy, w, h, label}))
    }));
  },

  async saveLabeling(params: SaveLabelingParams, label_file: string): Promise<void> {
    await fetch(`/api/labeling?action=write&videopath=${params.video_name}&label_file=${label_file}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  },

  async deleteLabeling(videopath: string, time: number, label_file: string): Promise<void> {
    await fetch(`/api/labeling?action=delete&videopath=${videopath}&time=${time}&label_file=${label_file}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  // V2 API 新接口
  async readLabelsV2(videopath: string, label_file: string): Promise<LabelDataV2> {
    const response = await fetch(`/api/labeling?action=read&videopath=${videopath}&label_file=${label_file}`, {
      method: 'GET'
    });
    const data = await response.json();
    
    if (!data.version || data.version !== 2) {
      throw new Error('Invalid data format: expected V2 format');
    }

    return data;
  },

  async saveLabelingV2(params: SaveLabelingV2Params, label_file: string): Promise<void> {
    await fetch(`/api/labeling?action=write&videopath=${params.video_name}&label_file=${label_file}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  },

  async deleteLabelingV2(params: DeleteLabelingV2Params, label_file: string): Promise<void> {
    await fetch(`/api/labeling?action=delete&videopath=${params.video_name}&label_file=${label_file}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  },

  // 工具函数：将V1格式数据转换为V2格式
  convertToV2Format(labelData: LabelData[]): LabelObject[] {
    const labelGroups = new Map<string, LabelObject>();

    labelData.forEach(({time, boxes}) => {
      boxes.forEach(box => {
        const baseLabel = box.label.replace(/_(开始|结束)$/, '');
        
        if (!labelGroups.has(baseLabel)) {
          labelGroups.set(baseLabel, {
            label: baseLabel,
            timeline: {}
          });
        }

        const labelObject = labelGroups.get(baseLabel)!;
        labelObject.timeline[time.toString()] = box;
      });
    });

    return Array.from(labelGroups.values());
  },

  // 工具函数：将V2格式数据转换为V1格式
  convertToV1Format(objects: LabelObject[]): LabelData[] {
    const timeMap = new Map<string, AnchorBox[]>();

    objects.forEach(obj => {
      Object.entries(obj.timeline).forEach(([time, box]) => {
        if (!timeMap.has(time)) {
          timeMap.set(time, []);
        }
        timeMap.get(time)!.push(box);
      });
    });

    return Array.from(timeMap.entries())
      .map(([time, boxes]) => ({
        time: parseFloat(time),
        boxes
      }))
      .sort((a, b) => a.time - b.time);
  }
}; 