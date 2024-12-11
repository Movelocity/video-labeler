import { useMemo } from 'react';
import { randomColor } from '@/lib/utils';
import { useLabelingStore } from './store/labelingStore';
import { KeyFrameViewer } from './KeyFrameViewer';
import cn from 'classnames';

interface ObjectWithColor {
  label: string;
  color: string;
  timelineCount: number;
}

interface ObjectItemProps {
  object: ObjectWithColor;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onActivate: () => void;
}

const ObjectItem = ({ 
  object, 
  isSelected, 
  isActive, 
  onSelect, 
  onActivate 
}: ObjectItemProps) => {
  return (
    <li 
      className={cn(
        'flex flex-row items-center rounded-lg pl-3 transition-colors',
        isActive ? 'bg-slate-800' : 'bg-slate-800/50',
        isSelected ? 'hover:bg-slate-700 cursor-pointer' : ''
      )}
    >
      <div 
        className="w-4 h-4 rounded-full cursor-pointer p-3 hover:filter hover:brightness-125"
        style={{ backgroundColor: isSelected? object.color : "#333" }}
        onClick={onSelect}
      />
      <div 
        className="flex items-center justify-between p-3 gap-2 shrink w-full"
        onClick={()=>{onActivate()}}
      >
        <span className="text-slate-200">{object.label}</span>
        <span className="text-sm text-slate-400">
          {object.timelineCount} 个节点
        </span>
      </div>
      
    </li>
  );
};

interface ObjectListProps {
  to_progress: (frame: number) => void;
}

export const ObjectList = ({ to_progress }: ObjectListProps) => {
  const labelData = useLabelingStore(state => state.labelData);
  const selectedObjects = useLabelingStore(state => state.selectedObjects);
  const activeObject = useLabelingStore(state => state.activeObject);
  const toggleObjectSelection = useLabelingStore(state => state.toggleObjectSelection);
  const setActiveObject = useLabelingStore(state => state.setActiveObject);
  
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
      <ul className="space-y-2 max-h-[400px] overflow-y-scroll p-2">
        {objectsWithColors?.map((obj, idx) => (
          <ObjectItem
            key={idx}  // object.label is not unique, so we use index as key
            object={obj}
            isSelected={selectedObjects.includes(obj.id)}
            isActive={activeObject === obj.id}
            onSelect={()=>toggleObjectSelection(obj.id)}
            onActivate={()=>setActiveObject(obj.id)}
          />
        ))}
      </ul>
      <KeyFrameViewer jump_to_frame={to_progress} />
    </div>
  );
};
