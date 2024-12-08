'use client'
import React from 'react'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { type FileInfo } from '@/common/types'
import { FaFolder, FaFile, FaFileVideo, FaSpinner } from 'react-icons/fa'
import { isVideoFile } from '@/common/videos';
import cn from 'classnames';
import { fetchFiles, getFileTarget, getParentDirectory } from '@/service/routing'

function formatBytes(bytes:number) {
  if(!bytes) return '';
  if (bytes < 0) return ''+bytes;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index++;
  }
  return `${bytes.toFixed(2)} ${units[index]}`;
}

type TabLabelProps = {text: string}
/**
 * TabLabel component displays a colored label based on the text content
 * - Empty text: Not displayed
 * - Contains "开始": Blue background
 * - Contains "结束": Red background  
 * - Contains "#": Green background
 * - Otherwise: Gray background
 */
const TabLabel: React.FC<TabLabelProps> = ({text}) => {
  if (!text) return null;

  const isStart = text.includes("开始");
  const isEnd = text.includes("结束"); 
  const isHash = text.includes("#");
  const color = isHash ? "text-emerald-500" : isStart ? "text-sky-500" : isEnd ? "text-rose-500" : "text-neutral-400";

  return (
    <div className={cn("h-6 rounded-md text-center text-xs font-medium border border-gray-500 p-1", color)}>
      {text}
    </div>
  );
}

const FileIcon = ({ type, name }: { type: string; name: string }) => {
  if (type === "dir") return <FaFolder className="w-6 h-6 text-blue-500" />
  if(isVideoFile(name.toLocaleLowerCase()))
    return <FaFileVideo className="w-6 h-6 text-purple-400" />
  return <FaFile className="w-6 h-6 text-gray-500" />
}

const FileItem = ({ file, directory }: { directory: string, file: FileInfo }) => {
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

    const calculateTruncatedLabels = () => {
      const avgCharWidth = 8 // Approximate width per character in pixels
      const labelPadding = 16 // Padding for each label
      const availableWidth = labelContainerWidth - (file.labels.length * labelPadding)
      const totalChars = Math.floor(availableWidth / avgCharWidth)
      const charsPerLabel = Math.floor(totalChars / file.labels.length)

      return file.labels.map(label => {
        if (label.length > charsPerLabel) {
          return label.slice(0, Math.max(charsPerLabel - 2)) + '...'
        }
        return label
      })
    }

    setTruncatedLabels(calculateTruncatedLabels())
  }, [file.labels, labelContainerWidth])
        
  return (
    <a
      href={target}
      className="group h-16 cursor-pointer w-full border-b border-gray-700 flex justify-between items-center px-36 hover:bg-gray-800 transition-colors"
      aria-label={`Open ${file.name}`}
      role="link"
    >
      <span className="flex flex-row items-center space-x-3 w-[calc(100%-100px)] truncate">
        <FileIcon type={file.type} name={file.name} />
        <span 
          className="hover:text-blue-500 hover:underline transition-colors"
        >
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
        <div className="text-gray-200 text-sm group-hover:text-gray-300">
          {formatBytes(file.size)}
        </div>
      )}
    </a>
  )
} 

function ListFiles() {
  const searchParams = useSearchParams()
  const directory = searchParams.get('directory') ?? ""
  
  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = async (path: string) => {
    if(filesInfo.length > 0) return
    setIsLoading(true)
    setError(null)
    
    try {
      const files = await fetchFiles(path)
      setFilesInfo(files)
    } catch (error) {
      setError('Failed to load files. Please try again.')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFiles(directory)
  }, [directory]) // Remove loadFiles from dependency array since it's stable

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <FaSpinner className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  if (filesInfo.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        文件夹为空
      </div>
    )
  }

  return (
    <div className="h-full w-full pb-8">
      <div className="px-36 py-2 text-sm text-gray-200 border-b border-gray-500 flex items-center">
        <span className="text-gray-400 mr-2">
          路径: {directory || '根路径'}
        </span>
        {directory && (
          <button 
            className="text-gray-300 hover:text-gray-300 hover:underline"
            onClick={() => {
              const target = getParentDirectory(directory)
              window.location.href = "/list-files?directory=" + target
            }}
          >
            返回上一级
          </button>
        )}
      </div>
      
      {filesInfo.map((file, index) => <FileItem key={index} file={file} directory={directory} />)}
    </div>
  )
}

export default function ListFilesPage() {
  return (
    <Suspense>
      <ListFiles/>
    </Suspense>
  )
}