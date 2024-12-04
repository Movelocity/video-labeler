import { type FileInfo } from '@/common/types'
import { isVideoFile } from '@/common/videos'
/**
 * Fetch files from the specified directory
 */
export const fetchFiles = async (directory: string): Promise<FileInfo[]> => {
  const response = await fetch('/api/list-files?directory=' + encodeURI(directory))
  if (!response.ok) {
    throw new Error('Failed to fetch files')
  }
  return response.json()
}

/**
 * Get file target URL based on file type and directory
 */
export const getFileTarget = (file: FileInfo, directory: string): string => {
  if (file.type === "dir") {
    return "/list-files?directory=" + [directory, file.name].join("/")
  } 
  
  if (isVideoFile(file.name.toLowerCase())) {
    return "/video?filepath=" + [directory, file.name].join("/") + "&label_file=" + file.label_file
  }
  
  return ""
}

/**
 * Get parent directory path
 */
export const getParentDirectory = (directory: string): string => {
  return directory.split("/").slice(0, -1).join("/")
} 