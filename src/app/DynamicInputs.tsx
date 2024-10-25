import React, { useState } from 'react';
import cn from 'classnames'

type DynamicInputsProps = {
  onSelectText: (text: string) => void
}

const DynamicInputs: React.FC<DynamicInputsProps> = ({onSelectText}) => {
  const [inputs, setInputs] = useState(['']); // 初始状态只有一个空输入
  const [activeIndex, setActiveIndex] = useState(-1); // 当前活跃的输入索引
  const containerRef = React.createRef<HTMLDivElement>();
  const changeActiveIndex = (index: number) => {
    setActiveIndex(index);
    onSelectText(inputs[index]);
  };

  const focusIndex = (idx:number) => {
    if(!containerRef.current) return;
    const inputElems = containerRef.current.querySelectorAll('input[type="text"]');
    if (inputElems.length > 0 && idx >= 0 && idx < inputElems.length) {
      (inputElems[idx] as HTMLInputElement).focus();
    }
  }

  const addInput = () => {
    setInputs([...inputs, '']);
    changeActiveIndex(inputs.length); // 将焦点设置到新添加的输入
    setTimeout(()=>{focusIndex(inputs.length);}, 1000)
  }

  const handleInputChange = (index: number, value:string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
    onSelectText(value);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        focusIndex(newIndex)  // 聚焦到新的活动输入框
        return newIndex;
      });
    }
  };

  return (
    <div ref={containerRef}>
      <div>当前标签：{inputs[activeIndex]}</div>
      {inputs.map((input, index) => (
        <div 
          key={index}
          className={cn('my-1 flex flex-row rounded-md bg-gray-700')}
          onClick={() => changeActiveIndex(index)}
        >
          <div className={cn("w-4 min-w-4 cursor-pointer hover:bg-teal-700", activeIndex === index ? 'bg-teal-600': 'bg-gray-700')}></div>
          <input
            type="text"
            placeholder='输入标签名字'
            value={input}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={handleKeyDown}
            className='px-2 m-2 w-36 bg-gray-600 rounded-sm outline-none text-white'
          />
        </div>
      ))}
      <button className="bg-teal-600 px-2 rounded-md" onClick={addInput}>增加标签</button>
    </div>
  );
};

export default DynamicInputs;