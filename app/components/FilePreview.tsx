import { useEffect, useState } from 'react';
import { FileInfo } from '@/common/types';
import { FaFolder, FaFile } from 'react-icons/fa';
import Link from 'next/link';
import { fetchFiles } from '@/service/routing';

export const FilePreview = (props: {dir: string}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await fetchFiles(props.dir);
        setFiles(data);
      } catch (err) {
        setError('加载文件列表失败');
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [props.dir]);

  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="mt-8">
      <div className='flex flex-row items-baseline'>
        <h3 className="text-xl font-semibold mb-4">文件预览</h3>
        <Link
          href="/list-files"
          className="mx-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          详细页面
        </Link>
      </div>
      

      <div className="flex flex-row flex-wrap w-full">
        {files.map((file, index) => (
          <div key={index} className="hover:bg-gray-800 flex flex-col items-center p-4 w-24 mx-6 rounded-md">
            {file.type === 'dir' ? <FaFolder className="w-8 h-8 text-blue-500"/>: <FaFile className="w-8 h-8" />}
            <span className="pt-4 text-xs text-gray-200 break-all text-center w-24">
              {file.name}
            </span>
          </div>
        ))}
      </div>
      
    </div>
  );
}; 