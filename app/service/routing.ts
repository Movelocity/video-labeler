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

interface PathConfig {
  videoRoot?: string;
  labelsRoot?: string;
}

/**
 * Fetch current path configuration
 */
export const fetchPathConfig = async (): Promise<PathConfig> => {
  const response = await fetch('/api/get-paths')
  if (!response.ok) {
    throw new Error('Failed to fetch path configuration')
  }
  return response.json()
}

/**
 * Update path configuration
 */
export const updatePathConfig = async (config: PathConfig): Promise<void> => {
  const response = await fetch('/api/update-paths', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoRoot: config.videoRoot?.trim() || undefined,
      labelsRoot: config.labelsRoot?.trim() || undefined,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to update paths')
  }

  return response.json()
}

/**
 * Validate path input
 */
export const validatePath = (path: string): string => {
  const trimmedPath = path.trim().replaceAll('"', '')
  if (!/^[a-zA-Z]:\\/.test(trimmedPath) && !trimmedPath.startsWith('/')) {
    return '请输入有效的完整路径'
  }
  return ''
} 