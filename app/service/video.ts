export const videoService = {
  getVideoUrl(video_file: string, label_file: string): string {
    return `/api/video?video_file=${video_file}&label_file=${label_file}`;
  }
}; 