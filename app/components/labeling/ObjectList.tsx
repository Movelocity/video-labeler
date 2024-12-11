import { useMemo} from 'react';
import { randomColor } from '@/lib/utils';
import { useLabeling } from './hooks/useLabeling';
import { KeyFrameViewer } from './KeyFrameViewer';

interface ObjectListProps {
  label_file: string;
  to_progress: (frame: number) => void;
}

export const ObjectList = ({ label_file, to_progress }: ObjectListProps) => {
  const { labelData, selectedObject, setSelectedObject, selectedObjectData } = useLabeling(label_file);
  
  // 为每个对象分配颜色（如果没有的话）
  const objectsWithColors = useMemo(() => {
    return labelData?.objects.map(obj => ({
      ...obj,
      color: obj.color || randomColor(),
      timelineCount: Object.keys(obj.timeline).length
    }));
  }, [labelData?.objects]);

  if (objectsWithColors?.length === 0) {
    return (
      <div className="p-4 text-slate-400 text-center">
        暂无标注对象
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-[30%] ml-4">
      <ul className="space-y-2 max-h-[400px] overflow-y-scroll">
        {objectsWithColors?.map((obj, idx) => (
          <li 
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer ${
              selectedObject === obj.label ? 'bg-slate-800' : 'bg-slate-800/50'
            }`}
            onClick={() => setSelectedObject(obj.label)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedObject(obj.label);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: obj.color }}
              />
              <span className="text-slate-200">{obj.label}</span>
            </div>
            <span className="text-sm text-slate-400">
              {obj.timelineCount} 个节点
            </span>
          </li>
        ))}
      </ul>
      {selectedObjectData && (
        <KeyFrameViewer 
          timeline={selectedObjectData.timeline}
          color={selectedObjectData.color || randomColor()}
          jump_to_frame={to_progress}
        />
      )}
    </div>
  );
};
