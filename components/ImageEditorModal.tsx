import React, { useRef, useEffect, useState } from 'react';
import { useImageEditor } from '../hooks/useImageEditor';
import { ImageEditorToolbar } from './ImageEditorToolbar';
import { ImageEditorLayerPanel } from './ImageEditorLayerPanel';
import { ImageEditorFooter } from './ImageEditorFooter';
import { ImageEditorHotkeys } from './ImageEditorHotkeys';
import { CloseIcon, UndoIcon, RedoIcon } from './Icons';
import type { InteractionType } from '../types';


interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  isLoading: boolean;
}

const VerticalSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ value, min, max, onChange }) => (
    <div className="flex flex-col items-center gap-2 bg-gray-800/80 p-2 rounded-md h-full backdrop-blur-sm">
        <span className="text-xs font-bold w-12 text-center tabular-nums">{value}px</span>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-2 h-full appearance-none cursor-pointer bg-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
    </div>
);


export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageUrl, onSave, isLoading }) => {
    const {
        refs: { mainCanvasRef, containerRef },
        state,
        actions,
    } = useImageEditor({ imageUrl, onClose, onSave });
    
    const {
        layers, selectedLayerId, tool, color, brushSize, eraserSize, rectangleStrokeSize,
        isRectFilled, historyIndex, history, interaction,
        cropBox, zoom, viewOffset, isSpacePressed, autoSelectLayer,
        textPrompt, textSize, canvasSize, isResizeModalOpen, resizeDimensions,
        isAspectRatioLocked
    } = state;

    const {
        handlePointerDown, handleTransformInteractionStart, handleCropInteractionStart, handleWheel,
        handleUndo, handleRedo, addTextLayer, applyCrop, cancelCrop, handleDeleteLayer,
        onAddImageLayer, onAddColorLayer, onToggleVisibility, onReorderLayers,
        handleFitToView, handleZoomTo100, handleSaveClick,
        setTool, setColor, setBrushSize, setEraserSize, setRectangleStrokeSize, setIsRectFilled, setAutoSelectLayer,
        setTextPrompt, setTextSize, setSelectedLayerId,
        handleOpenResizeModal, handleConfirmResize, setIsResizeModalOpen, setResizeDimensions,
        setIsAspectRatioLocked
    } = actions;

    const textPromptInputRef = useRef<HTMLTextAreaElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });
    const [isColorPickerModalOpen, setIsColorPickerModalOpen] = useState(false);
    const [newBgColor, setNewBgColor] = useState('#FFFFFF');
    
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);
    
    useEffect(() => {
        if (textPrompt.visible) {
            textPromptInputRef.current?.focus();
            textPromptInputRef.current?.select();
        }
    }, [textPrompt.visible]);

    if (!isOpen) return null;
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    
    let currentSizeValue: number, setCurrentSize: (v: number) => void;
    let sizeMin = 1, sizeMax = 200;

    switch(tool) {
        case 'brush': currentSizeValue = brushSize; setCurrentSize = setBrushSize; break;
        case 'eraser': currentSizeValue = eraserSize; setCurrentSize = setEraserSize; break;
        case 'rectangle': currentSizeValue = rectangleStrokeSize; setCurrentSize = setRectangleStrokeSize; break;
        case 'text': currentSizeValue = textSize; setCurrentSize = setTextSize; sizeMin = 8; break;
        default: currentSizeValue = 0; setCurrentSize = () => {};
    }
    const currentBrushSizeForCursor = tool === 'brush' ? brushSize : tool === 'eraser' ? eraserSize : 0;
    const showCursorAdorners = (tool === 'brush' || tool === 'eraser') && cursorPos.visible && (!interaction || interaction.type === 'draw') && !isSpacePressed;
    const currentCursor = textPrompt.visible ? 'default' : interaction?.type === 'pan' || interaction?.type === 'pinch' ? 'grabbing' : isSpacePressed ? 'grab' : tool === 'move' ? (interaction?.type.startsWith('transform') ? 'crosshair' : (interaction?.type === 'move' ? 'grabbing' : 'grab')) : tool === 'text' ? 'text' : tool === 'crop' ? 'crosshair' : 'crosshair';

    const transformHandles: {type: InteractionType, cursor: string, style: React.CSSProperties}[] = [
        { type: 'transform-tl', cursor: 'nwse-resize', style: { top: '-6px', left: '-6px' } },
        { type: 'transform-t', cursor: 'ns-resize', style: { top: '-6px', left: '50%', transform: 'translateX(-50%)' } },
        { type: 'transform-tr', cursor: 'nesw-resize', style: { top: '-6px', right: '-6px' } },
        { type: 'transform-r', cursor: 'ew-resize', style: { top: '50%', right: '-6px', transform: 'translateY(-50%)' } },
        { type: 'transform-br', cursor: 'nwse-resize', style: { bottom: '-6px', right: '-6px' } },
        { type: 'transform-b', cursor: 'ns-resize', style: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' } },
        { type: 'transform-bl', cursor: 'nesw-resize', style: { bottom: '-6px', left: '-6px' } },
        { type: 'transform-l', cursor: 'ew-resize', style: { top: '50%', left: '-6px', transform: 'translateY(-50%)' } },
    ];


    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col font-sans" role="dialog" aria-modal="true">
            
            <header className="relative h-14 bg-gray-900/80 backdrop-blur-sm z-30 flex items-center justify-between p-2 pr-4 shadow-lg flex-shrink-0">
                <h2 className="text-lg font-bold text-white pl-2">Image Editor</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5" /></button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5" /></button>
                </div>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-16 bg-gray-900 p-2 flex flex-col items-center gap-2 overflow-y-auto flex-shrink-0">
                    <ImageEditorToolbar tool={tool} setTool={setTool} onApplyCrop={applyCrop} onCancelCrop={cancelCrop} />
                </aside>

                <main ref={containerRef} className="flex-1 bg-black/50 overflow-hidden select-none touch-none relative"
                      style={{ cursor: currentCursor }}
                      onMouseDown={handlePointerDown} onTouchStart={handlePointerDown}
                      onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true }); }}
                      onMouseLeave={() => setCursorPos(p => ({...p, visible: false})) }
                      onMouseEnter={() => setCursorPos(p => ({...p, visible: true}))}
                      onWheel={handleWheel} >
                    <ImageEditorHotkeys />
                    <div className="absolute" style={{ width: canvasSize.width, height: canvasSize.height, transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}>
                        <canvas ref={mainCanvasRef} className="pointer-events-none" />
                        {tool === 'move' && selectedLayer && !isSpacePressed && (
                            <div className="absolute border border-dashed border-indigo-400 pointer-events-none" style={{ left: selectedLayer.x, top: selectedLayer.y, width: selectedLayer.width, height: selectedLayer.height }}>
                                {transformHandles.map(handle => (
                                    <div 
                                        key={handle.type}
                                        onMouseDown={e => handleTransformInteractionStart(e, handle.type)} 
                                        onTouchStart={e => handleTransformInteractionStart(e, handle.type)} 
                                        className={`absolute w-3 h-3 bg-white rounded-sm border-2 border-indigo-500 pointer-events-auto`}
                                        style={{ 
                                            cursor: handle.cursor,
                                            ...handle.style,
                                            transform: `${handle.style.transform || ''} scale(${1/zoom})`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        {tool === 'crop' && mainCanvasRef.current && (
                            <>
                                <div className="absolute inset-0 bg-black/70 pointer-events-none" style={{ clipPath: `path("M0 0 H${canvasSize.width} V${canvasSize.height} H0Z M${cropBox.x} ${cropBox.y} v${cropBox.height} h${cropBox.width} v-${cropBox.height} Z")`, fillRule: "evenodd" }} />
                                <div className="absolute border-2 border-white pointer-events-auto cursor-move" onMouseDown={e => handleCropInteractionStart(e, 'crop-move')} onTouchStart={e => handleCropInteractionStart(e, 'crop-move')} style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height }}>
                                    <div onMouseDown={e => handleCropInteractionStart(e, 'crop-tl')} onTouchStart={e => handleCropInteractionStart(e, 'crop-tl')} className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white cursor-nwse-resize" style={{ transform: `scale(${1/zoom})` }}/>
                                    <div onMouseDown={e => handleCropInteractionStart(e, 'crop-tr')} onTouchStart={e => handleCropInteractionStart(e, 'crop-tr')} className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white cursor-nesw-resize" style={{ transform: `scale(${1/zoom})` }}/>
                                    <div onMouseDown={e => handleCropInteractionStart(e, 'crop-bl')} onTouchStart={e => handleCropInteractionStart(e, 'crop-bl')} className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white cursor-nesw-resize" style={{ transform: `scale(${1/zoom})` }}/>
                                    <div onMouseDown={e => handleCropInteractionStart(e, 'crop-br')} onTouchStart={e => handleCropInteractionStart(e, 'crop-br')} className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white cursor-nwse-resize" style={{ transform: `scale(${1/zoom})` }}/>
                                </div>
                            </>
                        )}
                    </div>
                    {showCursorAdorners && (
                        <div className="absolute rounded-full border border-white/50 bg-black/20 pointer-events-none" style={{ left: cursorPos.x, top: cursorPos.y, width: currentBrushSizeForCursor * zoom, height: currentBrushSizeForCursor * zoom, transform: 'translate(-50%, -50%)' }} />
                    )}
                </main>

                <aside className="w-20 bg-gray-900 p-2 flex flex-col items-center justify-start gap-8 flex-shrink-0">
                    <div className="flex flex-col items-center gap-2">
                        <input
                            type="color"
                            ref={colorInputRef}
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-0 h-0 opacity-0 absolute"
                            aria-hidden="true"
                        />
                        <button
                            onClick={() => colorInputRef.current?.click()}
                            className="w-10 h-10 rounded-full border-2 border-gray-500 shadow-lg"
                            style={{ backgroundColor: color }}
                            title="Select Color"
                            aria-label={`Current color is ${color}. Click to change.`}
                        />
                         {tool === 'rectangle' && (
                           <div className="mt-2 text-center">
                             <label className="flex flex-col items-center gap-1 text-xs text-gray-300 cursor-pointer">
                                <input type="checkbox" checked={isRectFilled} onChange={e => setIsRectFilled(e.target.checked)} className="w-4 h-4 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-600"/>
                                 Fill
                            </label>
                           </div>
                         )}
                    </div>
                </aside>
            </div>

             {(tool === 'brush' || tool === 'eraser' || tool === 'rectangle' || tool === 'text') && (
                <div className="absolute bottom-32 right-4 z-40 h-64 mb-2">
                    <VerticalSlider 
                        value={currentSizeValue} 
                        onChange={setCurrentSize} 
                        min={sizeMin} 
                        max={sizeMax} 
                    />
                </div>
            )}

            <footer className="h-28 bg-gray-900/80 backdrop-blur-sm z-30 flex-shrink-0 border-t border-gray-700">
                <div className="h-full">
                    <div className="h-full overflow-x-auto">
                        <div className="relative flex items-center justify-between p-4 gap-4 h-full min-w-max">
                            <ImageEditorLayerPanel 
                                layers={layers} selectedLayerId={selectedLayerId} setSelectedLayerId={setSelectedLayerId}
                                autoSelectLayer={autoSelectLayer} setAutoSelectLayer={setAutoSelectLayer}
                                onAddImageLayer={onAddImageLayer} onDeleteLayer={handleDeleteLayer}
                                onToggleVisibility={onToggleVisibility} onReorderLayers={onReorderLayers}
                                onOpenColorPicker={() => setIsColorPickerModalOpen(true)}
                            />
                            <ImageEditorFooter 
                                isAspectRatioLocked={isAspectRatioLocked}
                                setIsAspectRatioLocked={setIsAspectRatioLocked}
                                isMoveToolActive={tool === 'move'}
                                onZoomTo100={handleZoomTo100} onFitToView={handleFitToView} 
                                onResizeCanvas={handleOpenResizeModal}
                                onCancel={onClose} onSave={handleSaveClick} 
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </footer>
             
            {textPrompt.visible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Add Text</h3>
                        <textarea ref={textPromptInputRef} value={textPrompt.value} onChange={(e) => setTextPrompt(p => ({...p, value: e.target.value}))}
                            className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addTextLayer(textPrompt.value, textPrompt.x, textPrompt.y); setTextPrompt({visible: false, value: '', x: 0, y: 0}); }}} />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setTextPrompt(p => ({...p, visible: false}))} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                            <button onClick={() => { addTextLayer(textPrompt.value, textPrompt.x, textPrompt.y); setTextPrompt({visible: false, value: '', x: 0, y: 0}); }} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Add Text</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isResizeModalOpen && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Resize Canvas</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label htmlFor="canvas-width" className="text-sm font-medium text-gray-300 block mb-1">Width (px)</label>
                                <input id="canvas-width" type="number" value={resizeDimensions.width} onChange={e => setResizeDimensions(d => ({...d, width: Number(e.target.value)}))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500"
                                />
                           </div>
                           <div>
                                <label htmlFor="canvas-height" className="text-sm font-medium text-gray-300 block mb-1">Height (px)</label>
                                <input id="canvas-height" type="number" value={resizeDimensions.height} onChange={e => setResizeDimensions(d => ({...d, height: Number(e.target.value)}))}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500"
                                />
                           </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Resizing will add or remove space from the center of the canvas.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsResizeModalOpen(false)} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                            <button onClick={handleConfirmResize} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Resize</button>
                        </div>
                    </div>
                </div>
            )}

            {isColorPickerModalOpen && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xs border border-gray-700" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Choose Background Color</h3>
                        <div className="flex justify-center my-4">
                           <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-600">
                                <input
                                    type="color"
                                    value={newBgColor}
                                    onChange={(e) => setNewBgColor(e.target.value)}
                                    className="absolute -top-2 -left-2 w-32 h-32 p-0 border-none cursor-pointer"
                                />
                           </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsColorPickerModalOpen(false)} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                            <button onClick={() => { onAddColorLayer(newBgColor); setIsColorPickerModalOpen(false); }} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Add Background</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};