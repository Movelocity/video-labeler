import { useState, useEffect } from 'react';
import { fetchPathConfig, updatePathConfig, validatePath } from '@/service/routing';

interface PathConfigProps {
  onSuccess?: () => void;
  vidPathUpdater?: (newPath: string) => void;
  show: boolean;
  onClose: () => void;
}

export const PathConfig = ({ onSuccess, vidPathUpdater, show, onClose }: PathConfigProps) => {
  const [videoRoot, setVideoRoot] = useState('');
  const [labelsRoot, setLabelsRoot] = useState('');
  const [useCustomLabelsPath, setUseCustomLabelsPath] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchPathConfig();
        setVideoRoot(data.videoRoot || '');
        if (data.labelsRoot && data.labelsRoot !== data.videoRoot) {
          console.log(data.labelsRoot, "!==", data.videoRoot)
          setLabelsRoot(data.labelsRoot);
          setUseCustomLabelsPath(true);
        } else {
          setLabelsRoot(data.videoRoot || '');
          setUseCustomLabelsPath(false);
        }
      } catch (err) {
        setError('获取当前配置失败');
      } finally {
        setInitialLoading(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (!useCustomLabelsPath) {
      setLabelsRoot(videoRoot);
    }
  }, [videoRoot, useCustomLabelsPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (videoRoot) {
      const videoPathError = validatePath(videoRoot);
      if (videoPathError) {
        setError(videoPathError);
        return;
      }
      vidPathUpdater?.(videoRoot);
    }
    
    const effectiveLabelsRoot = useCustomLabelsPath ? labelsRoot : videoRoot;
    if (effectiveLabelsRoot) {
      const labelsPathError = validatePath(effectiveLabelsRoot);
      if (labelsPathError) {
        setError(labelsPathError);
        return;
      }
    }

    setLoading(true);

    try {
      await updatePathConfig({
        videoRoot: videoRoot || undefined,
        labelsRoot: useCustomLabelsPath ? (labelsRoot || undefined) : (videoRoot || undefined),
      });
      
      onSuccess?.();
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      open={show}
      className="fixed inset-0 z-50 overflow-y-auto h-full w-full bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <div className="relative w-full max-w-2xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-50">路径配置</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
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
                    className="w-full px-4 py-2 bg-gray-700 text-white border-none rounded-md focus:ring-2 focus:ring-blue-500"
                    aria-describedby="videoRootHelp"
                  />
                  <p id="videoRootHelp" className="mt-1 text-sm text-gray-400">
                    请输入完整路径，支持包含空格的路径
                  </p>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="useCustomLabelsPath"
                    checked={useCustomLabelsPath}
                    onChange={(e) => setUseCustomLabelsPath(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useCustomLabelsPath" className="text-sm font-medium text-gray-50">
                    使用自定义标签文件路径
                  </label>
                </div>

                {useCustomLabelsPath && (
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
                      className="w-full px-4 py-2 bg-gray-700 text-white border-none rounded-md focus:ring-2 focus:ring-blue-500"
                      aria-describedby="labelsRootHelp"
                    />
                    <p id="labelsRootHelp" className="mt-1 text-sm text-gray-400">
                      请输入完整路径，支持包含空格的路径
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !videoRoot || (useCustomLabelsPath && !labelsRoot)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '更新中...' : '更新配置'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}; 