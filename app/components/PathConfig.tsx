import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PathConfigProps {
  onSuccess?: () => void;
  vidPathUpdater?: (newPath: string) => void;
}

export const PathConfig = ({ onSuccess, vidPathUpdater }: PathConfigProps) => {
  const [videoRoot, setVideoRoot] = useState('');
  const [labelsRoot, setLabelsRoot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentPaths = async () => {
      try {
        const response = await fetch('/api/get-paths');
        const data = await response.json();
        
        setVideoRoot(data.videoRoot || '');
        setLabelsRoot(data.labelsRoot || '');
      } catch (err) {
        setError('获取当前配置失败');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCurrentPaths();
  }, []);

  const validatePathInput = (path: string): string => {
    const trimmedPath = path.trim().replaceAll('"', ''); // Remove surrounding quotes if present
    console.log(trimmedPath)
    if (!/^[a-zA-Z]:\\/.test(trimmedPath) && !trimmedPath.startsWith('/')) {
      return '请输入有效的完整路径';
    }
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (videoRoot) {
      const videoPathError = validatePathInput(videoRoot);
      if (videoPathError) {
        setError(videoPathError);
        return;
      }
      vidPathUpdater?.(videoRoot||'');
    }
    
    if (labelsRoot) {
      const labelsPathError = validatePathInput(labelsRoot);
      if (labelsPathError) {
        setError(labelsPathError);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/update-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoRoot: videoRoot.trim() || undefined,
          labelsRoot: labelsRoot.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新失败');
      }

      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-50">路径配置</h2>
      
      {initialLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="videoRoot" className="block text-sm font-medium text-gray-50 mb-1">
                视频文件路径
              </label>
              <input
                id="videoRoot"
                type="text"
                value={videoRoot}
                onChange={(e) => setVideoRoot(e.target.value)}
                placeholder="例如: C:/Users/YourName/Videos"
                className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="videoRootHelp"
              />
              <p id="videoRootHelp" className="mt-1 text-sm text-gray-400">
                请输入完整路径，支持包含空格的路径
              </p>
            </div>

            <div>
              <label htmlFor="labelsRoot" className="block text-sm font-medium text-gray-50 mb-1">
                标签文件路径
              </label>
              <input
                id="labelsRoot"
                type="text"
                value={labelsRoot}
                onChange={(e) => setLabelsRoot(e.target.value)}
                placeholder="例如: C:/Users/YourName/Labels"
                className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="labelsRootHelp"
              />
              <p id="labelsRootHelp" className="mt-1 text-sm text-gray-400">
                请输入完整路径，支持包含空格的路径
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              disabled={loading || (!videoRoot && !labelsRoot)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '更新配置'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 