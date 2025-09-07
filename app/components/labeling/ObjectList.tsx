import { act, useEffect, useMemo, useRef, useState } from 'react';
import { autoIncrementId, randomColor } from '@/lib/utils';
import { useLabelingStore, useStore } from '@/components/labeling/store';
import cn from 'classnames';
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (label: string) => void;
}

const ObjectItem = ({ 
  object, 
  isSelected, 
  isActive, 
  onSelect, 
  onToggle,
  onDelete,
  onUpdate,
}: ObjectItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(object.label);

  return (
    <li 
      className={cn(
        'flex flex-row items-center rounded-lg transition-colors group',
        isActive ? 'bg-slate-800' : 'bg-slate-800/50',
        isSelected ? 'hover:bg-slate-700 ' : ''
      )}
    >

      <div className="flex items-center gap-1">
        <div className={cn('h-10 rounded-l-lg px-1', !isSelected && "opacity-30")} style={{ backgroundColor: object.color || "#333" }}></div>
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-slate-700"
        >
          {isSelected ? <FaEye className="w-4 h-4 text-slate-400" /> : <FaEyeSlash className="w-4 h-4 text-slate-400" />}
        </button>

        {/** radio select */}
        <div className='h-10 flex items-center'>
          <div 
            onClick={onSelect}
            className={cn(
              'h-4 w-4 cursor-pointer px-1 rounded-full border-2', 
              isActive ? 'bg-emerald-400 border-emerald-300' : 'bg-slate-700 border-slate-500 hover:bg-emerald-600'
            )}
          ></div>
        </div>
      </div>

      <div 
        className="flex items-center justify-between p-2 gap-2 shrink w-full"
        onClick={()=> {
          if(!isEditing) {
            setIsEditing(true)
            setLabel(object.label)
          }
        }}
      >
        {isEditing ? (
          <input
            autoFocus={true}
            type="text"
            value={label}
            placeholder="回车保存，内容为空时删除"
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {  // 失去焦点时，关闭编辑状态
              setIsEditing(false);
            }}
            onKeyDown={(e) => {  // 按下回车键时，更新标签
              if(e.key === 'Enter') {
                e.preventDefault();
                const value = label.trim();
                if(!value) {
                  onDelete()
                };
                onUpdate(value);
                setIsEditing(false);
              } else if(e.key === 'Escape') {
                setLabel(object.label);
                setIsEditing(false);
              }
            }}
            className="text-slate-200 outline-none bg-slate-700 px-1"
          />
        ) : (
          <span className="text-slate-200">
            {object.label}
          </span>
        )}

        <span className="text-xs text-slate-400">
          {object.timelineCount} 个关键帧
        </span>
      </div>
    </li>
  );
};

export const ObjectList = () => {
  const labelingStore = useLabelingStore()
  const labelData = useStore(state => state.labelData);
  const selectedIds = useStore(state => state.selectedIds);
  const activeObjId = useStore(state => state.activeObjId);
  
  // const [editingObject, setEditingObject] = useState<{id: string, label: string} | null>(null);
  const [version, setVersion] = useState(0);  // 控制刷新的时机，快速移动标注框而未保存，不用触发对象列表刷新
  
  const objectsWithColor = useMemo(() => {
    return labelData?.objects.map(obj => ({
      ...obj,
      color: obj.color || randomColor(),
      timelineCount: Object.keys(obj.timeline).length
    }));
  }, [labelData?.objects, version]);

  const activeObj = objectsWithColor?.find(obj => obj.id === activeObjId);


  const [newLabelName, setNewLabelName] = useState('');
  // const createObjInputRef = useRef<HTMLInputElement>(null);
  const handleCreateObject = async () => {
    if (!newLabelName || !labelData) return;
    await labelingStore.getState().addObject({
      id: autoIncrementId(labelData),
      label: newLabelName,
      color: randomColor(),
      timeline: {}
    });
    setNewLabelName('');
  };

  return (
    <div className="flex gap-2 flex-col pt-16 bg-slate-900 rounded-lg p-4 w-96 border-l border-slate-600">
      <div className="flex justify-between items-center">
        <div className='flex flex-row gap-2 items-baseline'>
          <h3 className="text-slate-200 font-medium">标注对象: </h3>
          <span className="text-sm">{activeObj?.label}</span>
        </div>
      </div>

      <div className="flex h-10 bg-slate-700 rounded-lg">
        <input
          
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value.trim())}
          type="text"
          placeholder="输入对象标签"
          className="flex-1 px-2 py-0 bg-transparent text-slate-200 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateObject();
          }}
          spellCheck={false}
        />
        <button
          onClick={handleCreateObject}
          className="m-1 px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-sm"
        >
          新建对象
        </button>
      </div>


      <ul className="space-y-2">
        {objectsWithColor?.map((obj) => (
          <ObjectItem
            key={obj.id}
            object={obj}
            isSelected={selectedIds.includes(obj.id)}
            isActive={activeObjId === obj.id}
            onSelect={() => {
              labelingStore.getState().selectObject(obj.id)
              labelingStore.getState().setActiveObjId(obj.id)
            }}
            onToggle={() => {
              labelingStore.getState().toggleObjectSelection(obj.id)
            }}
            onDelete={() => {
              console.log("delete obj: ", obj.id)
              labelingStore.getState().removeObject(obj.id);
              setVersion(v => v + 1);
            }}
            onUpdate={(label) => {
              const objectToUpdate = labelData?.objects.find(o => o.id === obj.id);
              if (!objectToUpdate) return;
              labelingStore.getState().renameObj(obj.id, label);
              setVersion(v => v + 1);
            }}
          />
        ))}
      </ul>

    </div>
  );
};
