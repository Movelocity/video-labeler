'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FaSpinner } from 'react-icons/fa'
import { type FileInfo } from '@/lib/types'
import { fetchFiles, getParentDirectory } from '@/service/routing'
import { FileItem } from './FileItem'

/**
 * FileList 组件 - 显示文件列表，包含加载状态和错误处理
 */
export const FileList = () => {
  const searchParams = useSearchParams()
  const directory = searchParams.get('directory') ?? ""
  
  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  

  useEffect(() => {
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
    loadFiles(directory)
  }, [directory])

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
    <div className="h-full w-full pb-8 pt-10 max-w-[1200px] mx-auto px-12">
      <div className="py-2 text-sm text-gray-200 border-b border-gray-800 flex items-center">
        <span className="text-gray-300 mr-4">
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
      
      <div className="rounded-lg bg-gray-800 my-2 overflow-hidden">
        {filesInfo.map((file, index) => (
          <FileItem 
            key={index} 
            file={file} 
            directory={directory} 
          />
        ))}
      </div>
    </div>
  )
} 