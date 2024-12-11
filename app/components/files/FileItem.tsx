import React, { useEffect, useState } from 'react'
import { type FileInfo } from '@/lib/types'
import { getFileTarget } from '@/service/routing'
import { FileIcon } from './FileIcon'
import { TabLabel } from './TabLabel'
import { formatBytes, calculateTruncatedLabels } from './utils'

interface FileItemProps {
  file: FileInfo
  directory: string
}

/**
 * FileItem 组件 - 显示单个文件或文件夹的信息
 * @param file - 文件信息
 * @param directory - 当前目录路径
 */
export const FileItem: React.FC<FileItemProps> = ({ file, directory }) => {
  const [target, setTarget] = useState("")
  const [labelContainerWidth, setLabelContainerWidth] = useState(0)
  const [truncatedLabels, setTruncatedLabels] = useState<string[]>([])
  const labelContainerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = getFileTarget(file, directory)
    setTarget(target)
  }, [file, directory])

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (labelContainerRef.current) {
          const width = labelContainerRef.current.offsetWidth
          if (width !== labelContainerWidth) {
            setLabelContainerWidth(width)
          }
        }
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [labelContainerWidth])

  useEffect(() => {
    if (!file.labels) return
    setTruncatedLabels(calculateTruncatedLabels(file.labels, labelContainerWidth))
  }, [file.labels, labelContainerWidth])
        
  return (
    <a
      href={target}
      className="px-4 h-16 cursor-pointer w-full border-b border-zinc-700 flex justify-between items-center hover:bg-gray-600/70 transition-colors"
      aria-label={`Open ${file.name}`}
      role="link"
    >
      <span className="flex flex-row items-center space-x-3 w-[calc(100%-100px)] truncate">
        <FileIcon type={file.type} name={file.name} />
        <span className="hover:text-blue-500 hover:underline transition-colors">
          {file.name}
        </span>
        <div 
          ref={labelContainerRef}
          className="flex flex-wrap gap-1 overflow-y-hidden w-[800px]"
        >
          {truncatedLabels.map((label, index) => (
            <TabLabel 
              key={index} 
              text={label}
            />
          ))}
        </div>
      </span>
      {file.size && (
        <div className="text-gray-200 text-sm">
          {formatBytes(file.size)}
        </div>
      )}
    </a>
  )
} 