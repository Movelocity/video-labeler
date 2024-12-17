import { useMemo, useState } from 'react';
import { autoIncrementId, randomColor } from '@/lib/utils';
import { useLabeling } from '@/components/labeling/hooks/useLabeling';
import { KeyFrameViewer } from '@/components/labeling/KeyFrameViewer';
import cn from 'classnames';
// import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FaPlus, FaPencilAlt } from "react-icons/fa";

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
  onActivate,
  onEdit 
}: ObjectItemProps & { onEdit: () => void }) => {
  const handleClick = () => {
    onSelect();
  };

  return (
    <li 
      className={cn(
        'flex flex-row items-center rounded-lg pl-3 transition-colors group',
        isActive ? 'bg-slate-800' : 'bg-slate-800/50',
        isSelected ? 'hover:bg-slate-700 cursor-pointer' : ''
      )}
      onClick={handleClick}
    >
      <div 
        className="w-4 h-4 rounded-full p-3"
        style={{ backgroundColor: isSelected? object.color : "#333" }}
      />
      <div 
        className="flex items-center justify-between p-3 gap-2 shrink w-full"
      >
        <span className="text-slate-200">{object.label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {object.timelineCount} 个节点
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded-md hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FaPencilAlt className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </li>
  );
};

interface ObjectListProps {
  to_progress: (frame: number) => void;
}

export const ObjectList = ({ to_progress }: ObjectListProps) => {
  const { 
    labelData,
    selectedIds,
    activeObjId,
    toggleObjectSelection,
    setActiveObjId,
    addObject,
    updateObject
  } = useLabeling();

  const [editingObject, setEditingObject] = useState<{id: string, label: string} | null>(null);
  const [newObjectLabel, setNewObjectLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const objectsWithColors = useMemo(() => {
    return labelData?.objects.map(obj => ({
      ...obj,
      color: obj.color || randomColor(),
      timelineCount: Object.keys(obj.timeline).length
    }));
  }, [labelData?.objects]);

  const handleObjectSelect = (objId: string) => {
    toggleObjectSelection(objId);
    if (!selectedIds.includes(objId)) {
      setActiveObjId(objId);
    } else if (activeObjId === objId) {
      const newActiveId = selectedIds.find(id => id !== objId);
      setActiveObjId(newActiveId || null);
    }
  };

  const handleCreateObject = async () => {
    if (!newObjectLabel.trim() || !labelData) return;
    
    const newObject = {
      id: autoIncrementId(labelData),
      label: newObjectLabel.trim(),
      color: randomColor(),
      timeline: {}
    };
    
    await addObject(newObject);
    setNewObjectLabel('');
    setIsCreating(false);
  };

  const handleUpdateObject = async () => {
    if (!editingObject || !editingObject.label.trim()) return;
    
    const objectToUpdate = labelData?.objects.find(obj => obj.id === editingObject.id);
    if (!objectToUpdate) return;

    await updateObject({
      ...objectToUpdate,
      label: editingObject.label.trim()
    });
    
    setEditingObject(null);
  };

  if (objectsWithColors?.length === 0 && !isCreating) {
    return (
      <div className="flex flex-col gap-4 w-[30%] ml-4">
        <div className="p-4 text-slate-400 text-center">
          暂无标注对象
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <FaPlus className="w-5 h-5" />
          <span>新建对象</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-[30%] ml-4">
      <div className="flex justify-between items-center">
        <h3 className="text-slate-200 font-medium">标注对象</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-200"
        >
          <FaPlus className="w-5 h-5" />
        </button>
      </div>

      {isCreating && (
        <div className="flex gap-2 p-2 bg-slate-800 rounded-lg">
          <input
            type="text"
            value={newObjectLabel}
            onChange={(e) => setNewObjectLabel(e.target.value)}
            placeholder="输入对象标签"
            className="flex-1 px-2 py-1 bg-slate-700 rounded-md text-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateObject();
              if (e.key === 'Escape') setIsCreating(false);
            }}
          />
          <button
            onClick={handleCreateObject}
            className="px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white"
          >
            确定
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="px-3 py-1 rounded-md hover:bg-slate-700 text-slate-300"
          >
            取消
          </button>
        </div>
      )}

      <ul className="space-y-2 max-h-[400px] overflow-y-scroll p-2">
        {objectsWithColors?.map((obj) => (
          <ObjectItem
            key={obj.id}
            object={obj}
            isSelected={selectedIds.includes(obj.id)}
            isActive={activeObjId === obj.id}
            onSelect={() => handleObjectSelect(obj.id)}
            onActivate={() => {}}
            onEdit={() => setEditingObject({ id: obj.id, label: obj.label })}
          />
        ))}
      </ul>

      {editingObject && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setEditingObject(null)}
        >
          <div 
            className="w-80 p-4 bg-slate-800 rounded-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg text-slate-200">编辑对象</h3>
            <input
              type="text"
              value={editingObject.label}
              onChange={(e) => setEditingObject({ ...editingObject, label: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 rounded-md text-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateObject();
                if (e.key === 'Escape') setEditingObject(null);
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleUpdateObject}
                className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white"
              >
                确定
              </button>
              <button
                onClick={() => setEditingObject(null)}
                className="px-4 py-2 rounded-md hover:bg-slate-700 text-slate-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <KeyFrameViewer jump_to_frame={to_progress} />
    </div>
  );
};
