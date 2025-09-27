import React, { useRef } from 'react';
import type { Layer } from '../types';
import { LayersIcon, PlusIcon, DeleteIcon, EyeOpenIcon, EyeClosedIcon, SquareIcon } from './Icons';

interface ImageEditorLayerPanelProps {
    layers: Layer[];
    selectedLayerId: number | null;
    setSelectedLayerId: (id: number) => void;
    autoSelectLayer: boolean;
    setAutoSelectLayer: (enabled: boolean) => void;
    onAddImageLayer: (file: File) => void;
    onOpenColorPicker: () => void;
    onDeleteLayer: () => void;
    onToggleVisibility: (id: number) => void;
    onReorderLayers: (dragIndex: number, hoverIndex: number) => void;
}

export const ImageEditorLayerPanel: React.FC<ImageEditorLayerPanelProps> = React.memo(({
    layers, selectedLayerId, setSelectedLayerId, autoSelectLayer, setAutoSelectLayer,
    onAddImageLayer, onOpenColorPicker, onDeleteLayer, onToggleVisibility, onReorderLayers
}) => {
    const addLayerInputRef = useRef<HTMLInputElement>(null);
    const dragLayerRef = useRef<number | null>(null);
    const dragOverLayerRef = useRef<number | null>(null);
    
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
        <div className="flex items-center gap-4 h-full">
            <div className="flex items-center gap-2 h-full relative">
                <input type="file" ref={addLayerInputRef} onChange={handleAddLayerFile} accept="image/*" className="hidden" />
                <button onClick={() => addLayerInputRef.current?.click()} className="p-2 h-12 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md" title="Add Image Layer"><PlusIcon className="w-5 h-5"/></button>
                <button onClick={onOpenColorPicker} className="p-2 h-12 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md" title="Add Color Background"><SquareIcon className="w-5 h-5"/></button>
                <button onClick={onDeleteLayer} disabled={!selectedLayerId || layers.length < 1} className="p-2 h-12 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed" title="Delete Selected Layer (Del)"><DeleteIcon className="w-5 h-5"/></button>
            </div>
            <div className="h-12 border-l border-gray-700"></div>
            <div className="flex items-center gap-2 h-full" style={{ minWidth: '360px' }}>
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
                            className={`relative flex-shrink-0 p-1.5 rounded-md cursor-pointer transition-colors active:cursor-grabbing ${selectedLayerId === layer.id ? 'bg-indigo-600/40' : 'hover:bg-gray-700/50'}`}
                             title={layer.name}
                        >
                            <canvas width="60" height="60" className="bg-white/10 rounded-sm w-[60px] h-[60px] object-contain border border-gray-600" ref={c => {if(c){const ctx=c.getContext('2d'); if(!ctx)return; ctx.clearRect(0,0,60,60); const aspect = layer.canvas.width/layer.canvas.height; let dw=60, dh=60; if(aspect > 1) dh = 60/aspect; else dw = 60*aspect; ctx.drawImage(layer.canvas, (60-dw)/2, (60-dh)/2, dw, dh)}}} />
                            <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }} className="absolute bottom-1 right-1 p-1 bg-black/50 rounded-full text-gray-300 hover:text-white">
                                {layer.visible ? <EyeOpenIcon className="w-4 h-4" /> : <EyeClosedIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    )
                })}
            </div>
            <div className="h-12 border-l border-gray-700"></div>
             <div className="flex items-center gap-2">
                <label htmlFor="auto-select" className="text-sm text-gray-300 whitespace-nowrap">Auto-select</label>
                <input type="checkbox" id="auto-select" checked={autoSelectLayer} onChange={e => setAutoSelectLayer(e.target.checked)} className="w-4 h-4 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-600"/>
             </div>
        </div>
    );
});