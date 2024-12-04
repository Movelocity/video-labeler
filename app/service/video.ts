export const videoService = {
  getVideoUrl(filepath: string, label_file: string): string {
    return `/api/video?filepath=${filepath}&label_file=${label_file}`;
  }
}; 