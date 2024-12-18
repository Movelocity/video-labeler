'use client'
import { useState, useEffect } from 'react';
// import { PathConfig } from '@/components/files/PathConfig';
// import { FilePreview } from '@/components/files/FilePreview';

export default function Home() {

  const [dir, setDir] = useState('');

  useEffect(() => {
    console.log('Home useEffect', dir);
  }, [dir]);

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      {/* <PathConfig vidPathUpdater={setDir}/> */}
    </main>
  );
}