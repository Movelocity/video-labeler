import React, { useState, useRef, useEffect } from 'react';
import cn from 'classnames'
import { useMainStore, useStore } from '@/lib/store'

type DynamicInputsProps = {
  onSelectText: (text: string) => void
}

const DynamicInputs: React.FC<DynamicInputsProps> = ({onSelectText}) => {
  const mainStore = useMainStore();
  const editLabels = useStore(state => state.editLabels)
  const [inputs, setInputs] = useState<string[]>([''])
  const {setEditLabels} = mainStore.getState();
  const [activeIndex, setActiveIndex] = useState(0); // 当前活跃的输入索引
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const containerRef = React.createRef<HTMLDivElement>();
  const changeActiveIndex = (index: number) => {
    setActiveIndex(index);
    onSelectText(inputs[index]);
  };

  // 当inputs数组长度改变时，聚焦到最后一个input
  useEffect(() => {
    if (inputRefs.current.length > 0) {
      (inputRefs.current[inputRefs.current.length - 1] as HTMLInputElement)?.focus();
    }
  }, [inputs.length]);

  useEffect(()=> {
    setInputs(editLabels.length > 0 ? editLabels : ['default']);
  }, [setInputs, editLabels])

  const focusIndex = (idx:number) => {
    if(!containerRef.current) return;
    const inputElems = containerRef.current.querySelectorAll('input[type="text"]');
    if (inputElems.length > 0 && idx >= 0 && idx < inputElems.length) {
      (inputElems[idx] as HTMLInputElement).focus();
      console.log('focusIndex', inputElems[idx])
    }
  }

  const addInput = () => {
    setInputs([...inputs, ''])
    setEditLabels([...inputs, '']);
    changeActiveIndex(inputs.length); // 将焦点设置到新添加的输入
  }

  const handleInputChange = (index: number, value:string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs)
    setEditLabels(newInputs);
    onSelectText(value);
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if(!containerRef.current) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prevIndex) => {
        let newIndex;
        if (e.key === 'ArrowUp') {
          newIndex = prevIndex > 0 ? prevIndex - 1 : inputs.length - 1;
        } else {
          newIndex = prevIndex < inputs.length - 1 ? prevIndex + 1 : 0;
        }
        focusIndex(newIndex)
        return newIndex;
      });
    } else if (e.key === 'Enter' && index === inputs.length - 1) {
      addInput();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="p-4 bg-slate-800/80 rounded-lg shadow-lg border border-slate-700"
    >
      <div className="overflow-x-scroll text-nowrap no-scrollbar mb-3 text-slate-300 text-sm">
        当前标签：<span className="font-medium text-emerald-400">{inputs[activeIndex] || 'default'}</span>
      </div>
      <div className="space-y-2">
        {inputs.map((input, index) => (
          <div 
            key={index}
            className={cn(
              'group relative flex items-center rounded-md transition-all duration-200',
              activeIndex === index ? 'bg-emerald-700/30 ring-1 ring-emerald-600' : 'bg-slate-700/50 hover:bg-slate-700'
            )}
            onClick={() => changeActiveIndex(index)}
            role="button"
            tabIndex={0}
          >
            <div className="w-1 h-full absolute left-0 rounded-l-md bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              ref={(el) => {if(el){inputRefs.current[index] = el}}}
              type="text"
              placeholder='输入标签名字'
              value={input}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className='px-3 py-2 w-full bg-transparent rounded-md outline-none text-white placeholder:text-slate-500
                focus:ring-1 focus:ring-emerald-500 transition-all duration-200'
              spellCheck={false}
              aria-label={`标签 ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <button 
        className="mt-4 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 
          text-white rounded-md transition-colors duration-200 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={addInput}
        aria-label="增加新标签"
      >
        增加标签
      </button>
    </div>
  );
};

export default DynamicInputs;