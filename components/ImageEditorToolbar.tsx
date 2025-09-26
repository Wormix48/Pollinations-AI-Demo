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
    className={`p-1 rounded-md flex flex-col items-center justify-center w-full aspect-square transition-colors ${
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

interface ImageEditorToolbarProps {
    tool: Tool;
    setTool: (tool: Tool) => void;
    onApplyCrop: () => void;
    onCancelCrop: () => void;
}

export const ImageEditorToolbar: React.FC<ImageEditorToolbarProps> = React.memo(({
    tool, setTool, onApplyCrop, onCancelCrop
}) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <ToolButton label="Brush" shortcut="B" icon={<PaintBrushIcon className="w-5 h-5"/>} isActive={tool === 'brush'} onClick={() => setTool('brush')} />
            <ToolButton label="Eraser" shortcut="E" icon={<EraserIcon className="w-5 h-5"/>} isActive={tool === 'eraser'} onClick={() => setTool('eraser')} />
            <ToolButton label="Text" shortcut="T" icon={<TypeIcon className="w-5 h-5"/>} isActive={tool === 'text'} onClick={() => setTool('text')} />
            <ToolButton label="Shape" shortcut="R" icon={<SquareIcon className="w-5 h-5"/>} isActive={tool === 'rectangle'} onClick={() => setTool('rectangle')} />
            <ToolButton label="Move" shortcut="V" icon={<MoveIcon className="w-5 h-5"/>} isActive={tool === 'move'} onClick={() => setTool('move')} />
            <ToolButton label="Crop" shortcut="C" icon={<CropIcon className="w-5 h-5"/>} isActive={tool === 'crop'} onClick={() => setTool('crop')} />

            {tool === 'crop' && (
                <div className="mt-2 flex flex-col gap-2">
                    <button onClick={onCancelCrop} className="flex-1 py-2 px-1 text-xs font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                    <button onClick={onApplyCrop} className="flex-1 py-2 px-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Apply</button>
                </div>
            )}
        </div>
    );
});