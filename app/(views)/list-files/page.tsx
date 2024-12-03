'use client'
import React from 'react'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { type FileInfo } from '@/common/types'
import { FaFolder, FaFile, FaFileVideo, FaSpinner } from 'react-icons/fa'

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
const TabLabel: React.FC<TabLabelProps> = ({text}) => {
  return (
    <div className="rounded-md text-center bg-green-600/90 px-2 py-1 text-xs text-white font-medium">
      {text}
    </div>
  )
}

const FileIcon = ({ type, name }: { type: string; name: string }) => {
  if (type === "dir") return <FaFolder className="w-5 h-5 text-blue-500" />
  if (name.endsWith('.mp4')) return <FaFileVideo className="w-5 h-5 text-purple-500" />
  return <FaFile className="w-5 h-5 text-gray-500" />
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
      const response = await fetch('/api/list-files?directory=' + encodeURI(path))
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      const files: FileInfo[] = await response.json()
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
  }, [directory, loadFiles]) // Add directory as dependency

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
        This folder is empty
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {/* Path breadcrumb */}
      <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
        Path: {directory || 'Root'}
      </div>
      
      {filesInfo.map((file, index) => {
        let target = ""
        if (file.type === "dir") {
          target = "/list-files?directory=" + [directory, file.name].join("/")
        } else if (file.name.endsWith('.mp4')) {
          target = "/video?filepath=" + [directory, file.name].join("/") + "&label_file=" + file.label_file
        }
        
        return (
          <div 
            key={index} 
            className="group h-12 w-full border-b border-gray-200 flex justify-between items-center px-4 hover:bg-gray-700 transition-colors"
          >
            <span className="flex flex-row items-center space-x-3">
              <FileIcon type={file.type} name={file.name} />
              <a 
                href={target}
                className="hover:text-blue-600 hover:underline transition-colors"
                tabIndex={0}
                role="link"
                aria-label={`Open ${file.name}`}
              >
                {file.name}
              </a>
              <div className="flex gap-1">
                {file.labels?.map((label, index) => (
                  <TabLabel key={index} text={label} />
                ))}
              </div>
            </span>
            {file.size && (
              <div className="text-gray-200 text-sm group-hover:text-gray-300">
                {formatBytes(file.size)}
              </div>
            )}
          </div>
        )
      })}
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