'use client'
import { PathConfig } from '@/components/PathConfig';
import { FilePreview } from '@/components/FilePreview';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-50">视频标注工具</h1>
        </div>

        <PathConfig />
        <FilePreview />
      </div>
    </main>
  );
}