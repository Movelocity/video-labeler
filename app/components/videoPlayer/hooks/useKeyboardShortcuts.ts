import { useEffect } from 'react';

type Controls = {
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  saveCurrentLabeling: () => void;
  deleteCurrentLabeling: () => void;
};

export const useKeyboardShortcuts = (controls: Controls) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case ' ': 
          e.preventDefault();
          controls.togglePlay();
          break;
        case 'arrowright':
          if (e.shiftKey) controls.stepForward();
          break;
        case 'arrowleft':
          if (e.shiftKey) controls.stepBackward();
          break;
        case 's':
          if (e.ctrlKey) {
            e.preventDefault();
            controls.saveCurrentLabeling();
          }
          break;
        case 'delete':
          controls.deleteCurrentLabeling();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [controls]);
}; 