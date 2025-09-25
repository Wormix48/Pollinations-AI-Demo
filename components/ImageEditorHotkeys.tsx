import React from 'react';
import { QuestionMarkIcon } from './Icons';

const hotkeys = [
  { keys: ['B'], desc: 'Brush Tool' },
  { keys: ['E'], desc: 'Eraser Tool' },
  { keys: ['V'], desc: 'Move Tool' },
  { keys: ['R'], desc: 'Rectangle Tool' },
  { keys: ['T'], desc: 'Text Tool' },
  { keys: ['C'], desc: 'Crop Tool' },
  { keys: ['Spacebar'], desc: 'Hold to Pan' },
  { keys: ['Alt + Wheel'], desc: 'Zoom In/Out' },
  { keys: ['Shift + Wheel'], desc: 'Change Brush Size' },
  { keys: ['[', ']'], desc: 'Decrease/Increase Brush Size' },
  { keys: ['Ctrl/Cmd + Z'], desc: 'Undo' },
  { keys: ['Ctrl/Cmd + Y'], desc: 'Redo' },
  { keys: ['Delete'], desc: 'Delete Layer' },
];

export const ImageEditorHotkeys: React.FC = () => {
  return (
    <div className="absolute top-2 left-2 z-20 group hidden lg:block">
      <button className="p-2 bg-gray-800/60 rounded-full text-gray-300 hover:text-white hover:bg-gray-700/80 transition-colors backdrop-blur-sm">
        <QuestionMarkIcon className="w-6 h-6" />
      </button>
      <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800/90 border border-gray-600 rounded-lg p-3 text-sm text-gray-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto backdrop-blur-sm">
        <h4 className="font-bold text-white mb-2">Keyboard Shortcuts</h4>
        <ul>
          {hotkeys.map((hotkey, index) => (
            <li key={index} className="flex justify-between items-center py-1">
              <span>{hotkey.desc}</span>
              <div className="flex gap-1">
                {hotkey.keys.map(key => (
                  <kbd key={key} className="px-2 py-0.5 text-xs font-sans font-semibold text-gray-300 bg-gray-900/80 border border-gray-600 rounded-md">
                    {key}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};