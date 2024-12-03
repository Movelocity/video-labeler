'use client'
import { useState } from 'react';
import { PathConfig } from '@/components/PathConfig';
import { FilePreview } from '@/components/FilePreview';

export default function Home() {

  const [dir, setDir] = useState('');

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-50">视频标注工具</h1>
        </div>

        <PathConfig vidPathUpdater={setDir}/>
        <FilePreview dir={dir}/>
      </div>
    </main>
  );
}