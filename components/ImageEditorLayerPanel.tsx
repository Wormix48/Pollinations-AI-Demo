import React, { useRef, useState } from 'react';
import type { Layer } from '../types';
import { LayersIcon, PlusIcon, DeleteIcon, EyeOpenIcon, EyeClosedIcon, SquareIcon } from './Icons';

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

interface ColorPickerState {
    visible: boolean;
    color: string;
}

interface ImageEditorLayerPanelProps {
    layers: Layer[];
    selectedLayerId: number | null;
    setSelectedLayerId: (id: number) => void;
    autoSelectLayer: boolean;
    setAutoSelectLayer: (enabled: boolean) => void;
    onAddImageLayer: (file: File) => void;
    onAddColorLayer: (color: string) => void;
    onDeleteLayer: () => void;
    onToggleVisibility: (id: number) => void;
    onReorderLayers: (dragIndex: number, hoverIndex: number) => void;
}

export const ImageEditorLayerPanel: React.FC<ImageEditorLayerPanelProps> = React.memo(({
    layers, selectedLayerId, setSelectedLayerId, autoSelectLayer, setAutoSelectLayer,
    onAddImageLayer, onAddColorLayer, onDeleteLayer, onToggleVisibility, onReorderLayers
}) => {
    const addLayerInputRef = useRef<HTMLInputElement>(null);
    const dragLayerRef = useRef<number | null>(null);
    const dragOverLayerRef = useRef<number | null>(null);
    const [colorPicker, setColorPicker] = useState<ColorPickerState>({ visible: false, color: '#FFFFFF' });

    const handleAddLayerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAddImageLayer(file);
        }
        e.target.value = '';
    };

    const handleLayerDragSort = () => {
        if (dragLayerRef.current !== null && dragOverLayerRef.current !== null) {
            onReorderLayers(dragLayerRef.current, dragOverLayerRef.current);
        }
        dragLayerRef.current = null;
        dragOverLayerRef.current = null;
    };

    return (
        <div className="flex flex-col flex-grow min-h-0">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2"><LayersIcon className="w-5 h-5" /> Layers</h3>
                <Toggle
                    label="Auto-select"
                    id="auto-select-toggle"
                    checked={autoSelectLayer}
                    onChange={setAutoSelectLayer}
                />
            </div>
            <div className="flex-grow min-h-[120px] bg-gray-900/50 rounded-md p-2 overflow-y-auto space-y-2">
                {layers.slice().reverse().map((layer, index) => {
                    const originalIndex = layers.length - 1 - index;
                    return (
                        <div
                            key={layer.id}
                            onClick={() => setSelectedLayerId(layer.id)}
                            draggable
                            onDragStart={() => dragLayerRef.current = originalIndex}
                            onDragEnter={() => dragOverLayerRef.current = originalIndex}
                            onDragEnd={handleLayerDragSort}
                            onDragOver={e => e.preventDefault()}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors active:cursor-grabbing ${selectedLayerId === layer.id ? 'bg-indigo-600/30' : 'hover:bg-gray-700/50'}`}
                        >
                            <canvas width="40" height="40" className="bg-white/10 rounded-sm w-10 h-10 object-contain border border-gray-600" ref={c => {if(c){const ctx=c.getContext('2d'); if(!ctx)return; ctx.clearRect(0,0,40,40); const aspect = layer.canvas.width/layer.canvas.height; let dw=40, dh=40; if(aspect > 1) dh = 40/aspect; else dw = 40*aspect; ctx.drawImage(layer.canvas, (40-dw)/2, (40-dh)/2, dw, dh)}}} />
                            <span className="text-sm flex-grow truncate">{layer.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }} className="p-1 text-gray-300 hover:text-white">
                                {layer.visible ? <EyeOpenIcon className="w-5 h-5" /> : <EyeClosedIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center justify-between mt-2 relative">
                <input type="file" ref={addLayerInputRef} onChange={handleAddLayerFile} accept="image/*" className="hidden" />
                <button onClick={() => addLayerInputRef.current?.click()} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full" title="Add Image Layer"><PlusIcon className="w-5 h-5"/></button>
                <button onClick={() => setColorPicker(p => ({...p, visible: !p.visible}))} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full" title="Add Color Background"><SquareIcon className="w-5 h-5"/></button>
                <button onClick={onDeleteLayer} disabled={!selectedLayerId || layers.length < 1} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full disabled:text-gray-600 disabled:cursor-not-allowed" title="Delete Selected Layer (Del)"><DeleteIcon className="w-5 h-5"/></button>
                {colorPicker.visible && (
                    <div className="absolute bottom-full mb-2 right-0 bg-gray-700 p-3 rounded-lg shadow-lg border border-gray-600 z-10 w-60">
                        <label className="text-sm font-medium text-gray-200">Choose Background Color</label>
                        <div className="relative h-10 w-full my-2"><input type="color" value={colorPicker.color} onChange={(e) => setColorPicker(p => ({ ...p, color: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full h-full rounded-md border-2 border-gray-500" style={{ backgroundColor: colorPicker.color }}></div></div>
                        <div className="flex gap-2">
                            <button onClick={() => setColorPicker({ visible: false, color: '#FFFFFF'})} className="flex-1 py-1.5 px-2 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                            <button onClick={() => { onAddColorLayer(colorPicker.color); setColorPicker({ visible: false, color: '#FFFFFF'})}} className="flex-1 py-1.5 px-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">OK</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
