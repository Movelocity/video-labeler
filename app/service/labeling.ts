import { LabelData, AnchorBox } from '@/common/types';

interface SaveLabelingParams {
  video_name: string;
  boxes: AnchorBox[];
  time: number;
}
/** 标注服务 */
export const labelingService = {
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
  }
}; 