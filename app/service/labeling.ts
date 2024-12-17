import { LabelData, AnchorBox, LabelDataV2 } from '@/lib/types';

interface SaveLabelingParams {
  video_path: string;
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

/** 标注服务 */
export const labelingService = {
  // V1 API 兼容接口
  async readLabels(video_path: string, label_path: string): Promise<LabelData[]> {
    const response = await fetch(`/api/labeling?action=read&video_path=${video_path}&label_path=${label_path}`, {
      method: 'GET'
    });
    const data = await response.json();
    
    if (!data.labels) return [];

    return Object.keys(data.labels).map(time => ({
      time: parseFloat(time),
      boxes: data.labels[time].map(({sx, sy, w, h, label}: AnchorBox) => ({sx, sy, w, h, label}))
    }));
  },

  async saveLabeling(params: SaveLabelingParams, label_path: string): Promise<void> {
    await fetch(`/api/labeling?action=write&video_path=${params.video_path}&label_path=${label_path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  },

  async deleteLabeling(video_path: string, time: number, label_path: string): Promise<void> {
    await fetch(`/api/labeling?action=delete&video_path=${video_path}&time=${time}&label_path=${label_path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  // V2 API 新接口
  async readLabelsV2(video_path: string, label_path?: string): Promise<LabelDataV2> {

    const response = await fetch(`/api/labeling?action=read&video_path=${video_path}&label_path=${label_path || ''}`, {
      method: 'GET'
    });
    const data = await response.json();
    
    if (!data.version || data.version !== 2) {
      throw new Error('Invalid data format: expected V2 format');
    }

    return data;
  },

  /** 保存标注框信息，如果和已有 object id 重合，则会与已有合并，否则新增 object */
  async saveLabelingV2(video_path: string, object_updates: LabelObject[], label_path?: string): Promise<void> {
    await fetch(`/api/labeling?action=write&video_path=${video_path}&label_path=${label_path || ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(object_updates)
    });
  },

  async deleteLabelingV2(video_path: string, obj_id: string, time: number, label_path?: string): Promise<void> {
    await fetch(`/api/labeling?action=delete&video_path=${video_path}&obj_id=${obj_id}&time=${time}&label_path=${label_path || ''}`, {
      method: 'DELETE'
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