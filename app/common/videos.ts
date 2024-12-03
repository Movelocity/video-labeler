export const supportedExtensions = ['.mp4', '.mkv'];

export const isVideoFile = (filePath: string) => {
  const lowerCasePath = filePath.toLowerCase();
  return lowerCasePath.endsWith('.mp4') 
      || lowerCasePath.endsWith('.avi') 
      || lowerCasePath.endsWith('.mov') 
      || lowerCasePath.endsWith('.mkv');
};