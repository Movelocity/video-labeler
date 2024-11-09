'use client'
import { Suspense, useEffect, useState } from 'react'
// import { useParams} from 'next/navigation'
import { useSearchParams } from 'next/navigation'

type FileInfo = {
  name: string;
  size: number;
  modified_time: number;
  type: string;
}

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

function ListFiles() {
  const searchParams = useSearchParams()
  const directory = searchParams.get('directory')??""

  const [filesInfo, setFilesInfo] = useState<FileInfo[]>([]);

  const loadFiles = async (path: string) => {
    if(filesInfo.length > 0) return;
    try {
      const response = await fetch('/api/list-files?directory=' + encodeURI(path));
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const files: FileInfo[]  = await response.json();
      console.log(files)
      setFilesInfo(files)
    } catch (error) {
      console.error('Error:', error);
    }
  }

  useEffect(()=> {
    loadFiles(directory)
  })

  return (
    <div className="h-full w-full">
      { 
        filesInfo.map((file, index) => {
          let target = ""
          if (file.type=="dir") {
            target ="/list-files?directory="+[directory,file.name].join("/")
          } else if (file.name.endsWith('.mp4')) {
            target = "/video?filepath="+[directory,file.name].join("/")
          }
          return (
            <div key={index} className="h-10 w-full border-b border-gray-300 flex justify-between items-center px-4">
              <a className="hover:underline" href={target}>{file.name}</a>
              <div className="mr-2 text-gray-300 text-sm">{formatBytes(file.size)}</div>
            </div>
          )}
        )
      }
    </div>
  );
}

export default function ListFilesPage() {
  return (
    <Suspense>
      <ListFiles/>
    </Suspense>
  )
}