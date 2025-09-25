import React from 'react';
import { PaintBrushIcon, EraserIcon, MoveIcon, CropIcon, SquareIcon, TypeIcon } from './Icons';
import type { Tool } from '../types';

const ToolButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  shortcut?: string;
}> = React.memo(({ label, icon, isActive, onClick, shortcut }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-md flex flex-col items-center justify-center w-full h-16 transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-700/50 hover:bg-gray-700'
    }`}
    aria-label={`Select ${label} tool`}
    title={`${label} ${shortcut ? `(${shortcut})` : ''}`}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
));

const Toggle: React.FC<{
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = React.memo(({ label, id, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <label htmlFor={id} className="text-sm font-medium text-gray-300 cursor-pointer select-none">{label}</label>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${checked ? 'bg-indigo-600' : 'bg-gray-600'}`}
    >
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
));

interface ImageEditorToolbarProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    color: string;
    setColor: (color: string) => void;
    brushSize: number;
    setBrushSize: (size: number) => void;
    textSize: number;
    setTextSize: (size: number) => void;
    isRectFilled: boolean;
    setIsRectFilled: (filled: boolean) => void;
    onApplyCrop: () => void;
    onCancelCrop: () => void;
}

export const ImageEditorToolbar: React.FC<ImageEditorToolbarProps> = React.memo(({
    tool, setTool, color, setColor, brushSize, setBrushSize, textSize, setTextSize, isRectFilled, setIsRectFilled, onApplyCrop, onCancelCrop
}) => {
    return (
        <>
            <div>
                <h3 className="font-semibold text-gray-200 mb-2">Tools</h3>
                <div className="grid grid-cols-3 gap-2">
                    <ToolButton label="Brush" shortcut="B" icon={<PaintBrushIcon className="w-6 h-6"/>} isActive={tool === 'brush'} onClick={() => setTool('brush')} />
                    <ToolButton label="Eraser" shortcut="E" icon={<EraserIcon className="w-6 h-6"/>} isActive={tool === 'eraser'} onClick={() => setTool('eraser')} />
                    <ToolButton label="Text" shortcut="T" icon={<TypeIcon className="w-6 h-6"/>} isActive={tool === 'text'} onClick={() => setTool('text')} />
                    <ToolButton label="Shape" shortcut="R" icon={<SquareIcon className="w-6 h-6"/>} isActive={tool === 'rectangle'} onClick={() => setTool('rectangle')} />
                    <ToolButton label="Move" shortcut="V" icon={<MoveIcon className="w-6 h-6"/>} isActive={tool === 'move'} onClick={() => setTool('move')} />
                    <ToolButton label="Crop" shortcut="C" icon={<CropIcon className="w-6 h-6"/>} isActive={tool === 'crop'} onClick={() => setTool('crop')} />
                </div>
                {tool === 'crop' && (
                    <div className="mt-2 flex gap-2">
                        <button onClick={onCancelCrop} className="flex-1 py-2 px-2 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                        <button onClick={onApplyCrop} className="flex-1 py-2 px-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Apply Crop</button>
                    </div>
                )}
            </div>
            <div className="border-t border-gray-700/50"></div>
            <div className={`${(tool !== 'brush' && tool !== 'text' && tool !== 'rectangle') ? 'opacity-50 pointer-events-none' : ''}`}>
                <label htmlFor="color-picker" className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="relative h-10 w-full"><input type="color" id="color-picker" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full h-full rounded-md border-2 border-gray-600" style={{ backgroundColor: color }}></div></div>
            </div>
            <div className={`${(tool !== 'brush' && tool !== 'eraser' && tool !== 'rectangle') ? 'opacity-50 pointer-events-none' : ''}`}>
                <label htmlFor="size-slider" className="block text-sm font-medium text-gray-300 mb-2">{tool === 'rectangle' ? 'Stroke Size' : 'Brush Size'}: {brushSize}px</label>
                <input id="size-slider" type="range" min="1" max="200" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className={`${tool !== 'rectangle' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'} transition-all duration-300`}>
                <Toggle label="Fill Shape" id="fill-shape-toggle" checked={isRectFilled} onChange={setIsRectFilled} />
            </div>
            <div className={`${tool !== 'text' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'} transition-all duration-300 space-y-2`}>
                <label className="block text-sm font-medium text-gray-300">Text Size</label>
                <div className="flex items-center gap-2">
                    <input id="text-size" type="range" min="8" max="200" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm w-12 text-center">{textSize}px</span>
                </div>
            </div>
        </>
    );
});
