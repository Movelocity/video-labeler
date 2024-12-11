import { FaFolder, FaFile, FaFileVideo } from 'react-icons/fa'
import { isVideoFile } from '@/lib/videos'

interface FileIconProps {
  type: string
  name: string
}

/**
 * FileIcon 组件 - 根据文件类型显示不同的图标
 * @param type - 文件类型 ('dir' 为文件夹)
 * @param name - 文件名，用于判断是否为视频文件
 * @returns 对应类型的图标组件
 */
export const FileIcon = ({ type, name }: FileIconProps) => {
  if (type === "dir") return <FaFolder className="w-6 h-6 text-blue-500" />
  if(isVideoFile(name.toLowerCase()))
    return <FaFileVideo className="w-6 h-6 text-purple-400" />
  return <FaFile className="w-6 h-6 text-gray-400" />
} 