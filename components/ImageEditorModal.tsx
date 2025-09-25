import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useImageEditor } from '../hooks/useImageEditor';
import { ImageEditorToolbar } from './ImageEditorToolbar';
import { ImageEditorLayerPanel } from './ImageEditorLayerPanel';
import { ImageEditorFooter } from './ImageEditorFooter';
import { ImageEditorHotkeys } from './ImageEditorHotkeys';
import { CloseIcon, UndoIcon, RedoIcon } from './Icons';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageUrl, onSave }) => {
    const {
        refs: { mainCanvasRef, containerRef },
        state,
        actions,
    } = useImageEditor({ imageUrl, onClose, onSave });
    
    const {
        layers, selectedLayerId, tool, color, brushSize,
        isRectFilled, historyIndex, history, interaction,
        cropBox, zoom, viewOffset, isSpacePressed, autoSelectLayer,
        textPrompt, textSize, canvasSize
    } = state;

    const {
        handlePointerDown, handleScaleInteractionStart, handleCropInteractionStart, handleWheel,
        handleUndo, handleRedo, addTextLayer, applyCrop, cancelCrop, handleDeleteLayer,
        onAddImageLayer, onAddColorLayer, onToggleVisibility, onReorderLayers,
        handleFitToView, handleZoomTo100, handleSaveClick,
        setTool, setColor, setBrushSize, setIsRectFilled, setAutoSelectLayer,
        setTextPrompt, setTextSize, setSelectedLayerId,
    } = actions;

    const textPromptInputRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });

    // Prevent body scroll
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
    const showCursorAdorners = (tool === 'brush' || tool === 'eraser') && cursorPos.visible && !interaction && !isSpacePressed;
    const currentCursor = textPrompt.visible ? 'default' : interaction?.type === 'pan' || interaction?.type === 'pinch' ? 'grabbing' : isSpacePressed ? 'grab' : tool === 'move' ? (interaction?.type === 'move' ? 'grabbing' : 'grab') : tool === 'text' ? 'text' : tool === 'crop' ? 'crosshair' : 'crosshair';

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Image Editor</h2>
                     <div className="flex items-center gap-2">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5" /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><RedoIcon className="w-5 h-5" /></button>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                <main className="flex-grow p-4 overflow-hidden flex flex-col lg:flex-row gap-4 relative">
                    <aside className="lg:w-72 lg:flex-initial flex-1 min-h-0 bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto order-2 lg:order-1">
                        <ImageEditorToolbar 
                            tool={tool} setTool={setTool} color={color} setColor={setColor} brushSize={brushSize} setBrushSize={setBrushSize}
                            textSize={textSize} setTextSize={setTextSize} isRectFilled={isRectFilled} setIsRectFilled={setIsRectFilled}
                            onApplyCrop={applyCrop} onCancelCrop={cancelCrop}
                        />
                         <div className="border-t border-gray-700/50"></div>
                         <ImageEditorLayerPanel 
                            layers={layers} selectedLayerId={selectedLayerId} setSelectedLayerId={setSelectedLayerId}
                            autoSelectLayer={autoSelectLayer} setAutoSelectLayer={setAutoSelectLayer}
                            onAddImageLayer={onAddImageLayer} onAddColorLayer={onAddColorLayer} onDeleteLayer={handleDeleteLayer}
                            onToggleVisibility={onToggleVisibility} onReorderLayers={onReorderLayers}
                         />
                    </aside>
                    <div ref={containerRef} className="w-full flex-1 min-h-0 lg:flex-1 bg-black/50 rounded-md overflow-hidden relative select-none touch-none order-1 lg:order-2"
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
                                <div className="absolute border border-dashed border-indigo-400 pointer-events-none" style={{ left: selectedLayer.x, top: selectedLayer.y, width: selectedLayer.canvas.width * selectedLayer.scale, height: selectedLayer.canvas.height * selectedLayer.scale }}>
                                    <div onMouseDown={handleScaleInteractionStart} onTouchStart={handleScaleInteractionStart} className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-nwse-resize pointer-events-auto" style={{ transform: `scale(${1/zoom})` }}/>
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
                            <div className="absolute rounded-full border border-white/50 bg-black/20 pointer-events-none" style={{ left: cursorPos.x, top: cursorPos.y, width: brushSize * zoom, height: brushSize * zoom, transform: 'translate(-50%, -50%)' }} />
                        )}
                    </div>
                </main>
                <ImageEditorFooter onZoomTo100={handleZoomTo100} onFitToView={handleFitToView} onCancel={onClose} onSave={handleSaveClick} />
            </div>
             {textPrompt.visible && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20" onClick={() => setTextPrompt(p => ({...p, visible: false}))}>
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
        </div>
    );
};
