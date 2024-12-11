'use client'

import { Suspense } from 'react'
import { FileList } from '@/components/files/FileList'

/**
 * ListFilesPage 组件 - 文件列表页面的入口组件
 */
export default function ListFilesPage() {
  return (
    <Suspense>
      <FileList />
    </Suspense>
  )
}