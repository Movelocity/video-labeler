export const videoService = {
  getVideoUrl(video_path: string, label_path: string): string {
    return `/api/video?video_path=${video_path}&label_path=${label_path}`;
  }
}; 