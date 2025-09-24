import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CloseIcon, PaintBrushIcon, TypeIcon, SquareIcon, UndoIcon, RedoIcon, CheckIcon } from './Icons';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (imageDataUrl: string) => void;
}

type Tool = 'brush' | 'text' | 'rect';

type InteractionState = {
    type: 'move' | 'scale';
    startX: number;
    startY: number;
    startBoxX: number;
    startBoxY: number;
    startBoxWidth: number;
    startBoxHeight: number;
    startFontSize: number;
} | null;

const ToolButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-md flex flex-col items-center justify-center w-full h-16 transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-700/50 hover:bg-gray-700'
    }`}
    aria-label={`Select ${label} tool`}
    title={label}
  >
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageUrl, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const [tool, setTool] = useState<Tool>('brush');
    const [color, setColor] = useState('#EF4444'); // red-500
    const [brushSize, setBrushSize] = useState(10);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [snapshot, setSnapshot] = useState<ImageData | null>(null);
    
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [textInput, setTextInput] = useState('');
    const [isPlacingText, setIsPlacingText] = useState(false);
    
    const [activeText, setActiveText] = useState<{
        text: string;
        x: number; // Overlay DOM pixels
        y: number; // Overlay DOM pixels
        width: number; // Overlay DOM pixels
        height: number; // Overlay DOM pixels
        color: string;
        fontSize: number; // Overlay DOM pixels
    } | null>(null);
    const [interaction, setInteraction] = useState<InteractionState>(null);

    const [brushPreview, setBrushPreview] = useState({ visible: false, x: 0, y: 0 });
    const [crosshairColor, setCrosshairColor] = useState('#FFFFFF');
    const [canvasScale, setCanvasScale] = useState(1);

    const saveState = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const drawImageOnCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx?.drawImage(img, 0, 0);

            const initialState = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([initialState]);
            setHistoryIndex(0);

            if (containerRef.current) {
                const event = new Event('resize');
                window.dispatchEvent(event);
            }
        };
        img.onerror = () => {
            console.error("Failed to load image for editing.");
            onClose();
        }
    }, [imageUrl, onClose]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !isOpen) return;

        const resizeCanvasElement = () => {
            if (canvas.width === 0 || canvas.height === 0) return;

            const containerW = container.clientWidth;
            const containerH = container.clientHeight;
            const containerAspectRatio = containerW / containerH;
            const imageAspectRatio = canvas.width / canvas.height;

            let scaledWidth, scaledHeight;
            if (containerAspectRatio > imageAspectRatio) {
                scaledHeight = containerH;
                scaledWidth = scaledHeight * imageAspectRatio;
            } else {
                scaledWidth = containerW;
                scaledHeight = scaledWidth / imageAspectRatio;
            }

            canvas.style.width = `${scaledWidth}px`;
            canvas.style.height = `${scaledHeight}px`;

            setCanvasScale(scaledWidth / canvas.width);
        };

        const resizeObserver = new ResizeObserver(resizeCanvasElement);
        resizeObserver.observe(container);
        
        window.addEventListener('resize', resizeCanvasElement);
        resizeCanvasElement();

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', resizeCanvasElement);
        }
    }, [isOpen, history]);

    useEffect(() => {
        if (isOpen) {
            drawImageOnCanvas();
        } else {
            setActiveText(null);
            setTextInput('');
        }
    }, [isOpen, drawImageOnCanvas]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(i => i - 1);
        }
    }, [historyIndex]);

    useEffect(() => {
        if (!isOpen) return;
    
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                handleUndo();
            }
            if (e.key === 'Escape') {
                setIsPlacingText(false);
                setActiveText(null);
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleUndo]);
    
    useEffect(() => {
        const element = modalRef.current;
        if (!isOpen || !element) return;
    
        const handleWheel = (e: WheelEvent) => {
            if (e.shiftKey) {
                e.preventDefault();
                const change = e.deltaY < 0 ? 1 : -1;
                setBrushSize(prev => Math.max(1, Math.min(100, prev + change)));
            }
        };
    
        element.addEventListener('wheel', handleWheel, { passive: false });
    
        return () => {
            element.removeEventListener('wheel', handleWheel);
        };
    }, [isOpen]);

    const getPointerPosition = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent, target: 'canvas' | 'container'): { x: number; y: number } => {
        const sourceEl = target === 'canvas' ? canvasRef.current : containerRef.current;
        if (!sourceEl) return { x: 0, y: 0 };

        const rect = sourceEl.getBoundingClientRect();
        const touch = 'touches' in e && e.touches[0];
        const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;

        if (target === 'canvas') {
            const canvas = sourceEl as HTMLCanvasElement;
            return {
                x: (clientX - rect.left) / rect.width * canvas.width,
                y: (clientY - rect.top) / rect.height * canvas.height,
            };
        } else { // container
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }
    }, []);

    const updateBrushPreview = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const overlayPos = getPointerPosition(e, 'container');
        setBrushPreview({ visible: true, x: overlayPos.x, y: overlayPos.y });

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        const { x: canvasX, y: canvasY } = getPointerPosition(e, 'canvas');
        const clampedX = Math.max(0, Math.min(Math.floor(canvasX), canvas.width - 1));
        const clampedY = Math.max(0, Math.min(Math.floor(canvasY), canvas.height - 1));

        try {
            const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
            const [r, g, b] = pixel;
            const invertedColor = `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
            setCrosshairColor(invertedColor);
        } catch (err) {
            setCrosshairColor('#FFFFFF');
        }
    }, [getPointerPosition]);
    
    const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault();
        if (activeText) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        if (isPlacingText && tool === 'text' && textInput.trim()) {
            const { x: clientX, y: clientY } = getPointerPosition(e, 'container');
            const overlayFontSize = brushSize * 2;
            const canvasFontSize = overlayFontSize / canvasScale;
            ctx.font = `${canvasFontSize}px sans-serif`;
            const lines = textInput.trim().split('\n');
            const canvasWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            const canvasLineHeight = canvasFontSize * 1.2;
            const canvasHeight = lines.length * canvasLineHeight;
            const overlayWidth = canvasWidth * canvasScale;
            const overlayHeight = canvasHeight * canvasScale;
            setActiveText({
                text: textInput.trim(),
                x: clientX - overlayWidth / 2, y: clientY - overlayHeight / 2,
                width: overlayWidth, height: overlayHeight,
                color: color, fontSize: overlayFontSize,
            });
            setIsPlacingText(false);
            setTextInput('');
            return;
        }

        const { x, y } = getPointerPosition(e, 'canvas');
        setIsDrawing(true);
        setStartPoint({ x, y });
        if (tool === 'brush') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        } else if (tool === 'rect') {
            setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    };

    const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) e.preventDefault();
        
        if (tool === 'brush' && !activeText) {
            updateBrushPreview(e);
        }
        
        if (!isDrawing || !startPoint) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { x, y } = getPointerPosition(e, 'canvas');
        if (tool === 'brush') {
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (tool === 'rect' && snapshot) {
            ctx.putImageData(snapshot, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.strokeRect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
        }
    };

    const handleDrawEnd = () => {
        if (isDrawing) saveState();
        setIsDrawing(false);
        setStartPoint(null);
        setSnapshot(null);
    };

    const handleConfirmText = () => {
        if (!activeText) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const container = containerRef.current;
        if (!canvas || !ctx || !container) return;
    
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;
        const canvasX = (activeText.x - offsetX) / canvasScale;
        const canvasY = (activeText.y - offsetY) / canvasScale;
        const canvasFontSize = activeText.fontSize / canvasScale;
    
        ctx.fillStyle = activeText.color;
        ctx.font = `${canvasFontSize}px sans-serif`;
        ctx.textBaseline = 'top';
        const lines = activeText.text.split('\n');
        const lineHeight = canvasFontSize * 1.2;
        lines.forEach((line, i) => {
            ctx.fillText(line, canvasX, canvasY + (i * lineHeight));
        });
        saveState();
        setActiveText(null);
    };
    
    const handleTextInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'scale') => {
        if (!activeText) return;
        e.preventDefault();
        e.stopPropagation();
        const { x: mouseX, y: mouseY } = getPointerPosition(e, 'container');
        setInteraction({
            type, startX: mouseX, startY: mouseY,
            startBoxX: activeText.x, startBoxY: activeText.y,
            startBoxWidth: activeText.width, startBoxHeight: activeText.height,
            startFontSize: activeText.fontSize,
        });
    };

    const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!interaction || !activeText) return;
        e.preventDefault();
        const { x: mouseX, y: mouseY } = getPointerPosition(e, 'container');
        const dx = mouseX - interaction.startX;
        const dy = mouseY - interaction.startY;

        if (interaction.type === 'move') {
            setActiveText(t => t ? { ...t, x: interaction.startBoxX + dx, y: interaction.startBoxY + dy } : null);
        } else { // scale
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;
            const newWidthTarget = Math.max(20, interaction.startBoxWidth + dx);
            const scale = newWidthTarget / interaction.startBoxWidth;
            const newFontSize = interaction.startFontSize * scale;
            const canvasFontSize = newFontSize / canvasScale;
            ctx.font = `${canvasFontSize}px sans-serif`;
            const lines = activeText.text.split('\n');
            const newCanvasWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            const newCanvasLineHeight = canvasFontSize * 1.2;
            const newCanvasHeight = lines.length * newCanvasLineHeight;
            const newOverlayWidth = newCanvasWidth * canvasScale;
            const newOverlayHeight = newCanvasHeight * canvasScale;
            setActiveText(t => t ? { ...t, width: newOverlayWidth, height: newOverlayHeight, fontSize: newFontSize } : null);
        }
    }, [interaction, activeText, canvasScale, getPointerPosition]);

    const handleInteractionEnd = useCallback(() => {
        setInteraction(null);
    }, []);

    useEffect(() => {
        if (interaction) {
            window.addEventListener('mousemove', handleInteractionMove);
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('mouseleave', handleInteractionEnd);
            window.addEventListener('touchmove', handleInteractionMove, { passive: false });
            window.addEventListener('touchend', handleInteractionEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('mouseleave', handleInteractionEnd);
            window.removeEventListener('touchmove', handleInteractionMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [interaction, handleInteractionMove, handleInteractionEnd]);

    const handleSaveClick = () => {
        const canvas = canvasRef.current;
        if (canvas) onSave(canvas.toDataURL('image/png'));
    };
    
    const handleRedo = () => historyIndex < history.length - 1 && setHistoryIndex(i => i + 1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && history[historyIndex]) {
            ctx.putImageData(history[historyIndex], 0, 0);
        }
    }, [historyIndex, history]);

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
            <div className="bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Image Editor</h2>
                     <div className="flex items-center gap-2">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><UndoIcon className="w-5 h-5" /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-300 rounded-md hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed" title="Redo"><RedoIcon className="w-5 h-5" /></button>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
                </header>
                
                <main className="flex-grow p-4 overflow-hidden flex flex-col lg:flex-row gap-4 relative">
                    <div ref={containerRef} className="w-full h-1/2 lg:h-full lg:flex-1 flex items-center justify-center bg-black/50 rounded-md overflow-hidden relative">
                        <canvas 
                            ref={canvasRef}
                            onMouseDown={handleDrawStart}
                            onMouseMove={handleDrawMove}
                            onMouseUp={handleDrawEnd}
                            onMouseLeave={() => { handleDrawEnd(); setBrushPreview(p => ({...p, visible: false})); }}
                            onMouseEnter={updateBrushPreview}
                            onTouchStart={handleDrawStart}
                            onTouchMove={handleDrawMove}
                            onTouchEnd={handleDrawEnd}
                            onTouchCancel={handleDrawEnd}
                            style={{ cursor: tool === 'brush' && !activeText ? 'none' : (isPlacingText ? 'text' : 'crosshair'), touchAction: 'none' }}
                        />
                         {tool === 'brush' && brushPreview.visible && !activeText && (
                            <>
                                <div
                                    className="absolute pointer-events-none rounded-full"
                                    style={{
                                        left: `${brushPreview.x}px`, top: `${brushPreview.y}px`,
                                        width: `${brushSize * canvasScale}px`, height: `${brushSize * canvasScale}px`,
                                        backgroundColor: color, opacity: 0.5,
                                        transform: `translate(-50%, -50%)`, border: '1px solid white'
                                    }}
                                />
                                <div className="absolute pointer-events-none" style={{
                                    left: `${brushPreview.x}px`, top: `${brushPreview.y}px`,
                                    width: '1px', height: '7px',
                                    backgroundColor: crosshairColor,
                                    transform: 'translate(-50%, -50%)'
                                }}/>
                                <div className="absolute pointer-events-none" style={{
                                    left: `${brushPreview.x}px`, top: `${brushPreview.y}px`,
                                    width: '7px', height: '1px',
                                    backgroundColor: crosshairColor,
                                    transform: 'translate(-50%, -50%)'
                                }}/>
                            </>
                        )}
                        {activeText && (
                            <div
                                className="absolute border border-dashed border-indigo-400 p-1 flex flex-col justify-center select-none"
                                style={{
                                    left: activeText.x, top: activeText.y,
                                    width: activeText.width, height: activeText.height,
                                    color: activeText.color, fontSize: activeText.fontSize,
                                    lineHeight: 1.1,
                                    cursor: interaction?.type === 'move' ? 'grabbing' : 'grab'
                                }}
                                onMouseDown={(e) => handleTextInteractionStart(e, 'move')}
                                onTouchStart={(e) => handleTextInteractionStart(e, 'move')}
                            >
                                {activeText.text.split('\n').map((line, i) => <div key={i} className="whitespace-nowrap">{line || ' '}</div>)}
                                <div
                                    className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-400 rounded-full border-2 border-gray-900 -mr-2 -mb-2"
                                    style={{ cursor: 'nwse-resize' }}
                                    onMouseDown={(e) => handleTextInteractionStart(e, 'scale')}
                                    onTouchStart={(e) => handleTextInteractionStart(e, 'scale')}
                                />
                                <div className="absolute top-0 right-0 -mt-8 flex gap-1">
                                    <button onClick={() => setActiveText(null)} className="p-1 bg-gray-800 text-red-400 hover:bg-gray-700 rounded-full"><CloseIcon className="w-4 h-4" /></button>
                                    <button onClick={handleConfirmText} className="p-1 bg-gray-800 text-green-400 hover:bg-gray-700 rounded-full"><CheckIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className="lg:w-64 h-1/2 lg:h-auto flex-shrink-0 bg-gray-800/50 rounded-lg p-4 flex flex-col gap-6 overflow-y-auto">
                       <div>
                            <h3 className="font-semibold text-gray-200 mb-2">Tools</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <ToolButton label="Brush" icon={<PaintBrushIcon className="w-6 h-6"/>} isActive={tool === 'brush'} onClick={() => { setTool('brush'); setIsPlacingText(false); }} />
                                <ToolButton label="Text" icon={<TypeIcon className="w-6 h-6"/>} isActive={tool === 'text'} onClick={() => { setTool('text'); setIsPlacingText(false); }} />
                                <ToolButton label="Frame" icon={<SquareIcon className="w-6 h-6"/>} isActive={tool === 'rect'} onClick={() => { setTool('rect'); setIsPlacingText(false); }} />
                            </div>
                       </div>
                       <div className="border-t border-gray-700/50"></div>
                       <div>
                         <label htmlFor="color-picker" className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                         <div className="relative h-10 w-full"><input type="color" id="color-picker" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="w-full h-full rounded-md border-2 border-gray-600" style={{ backgroundColor: color }}></div></div>
                       </div>
                        <div>
                           <label htmlFor="size-slider" className="block text-sm font-medium text-gray-300 mb-2">{tool === 'brush' ? 'Brush Size' : tool === 'rect' ? 'Frame Thickness' : 'Font Size'}: {brushSize}px</label>
                           <input id="size-slider" type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                           <p className="text-xs text-gray-400 mt-2 text-center">Tip: Use Shift + Scroll to adjust size.</p>
                        </div>
                        <div className="border-t border-gray-700/50"></div>
                        <div>
                            <h3 className="font-semibold text-gray-200 mb-2">Text</h3>
                            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Your text here..." rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500" />
                            <button onClick={() => { if (textInput.trim()) { setTool('text'); setIsPlacingText(true); setActiveText(null); } }} disabled={!textInput.trim()} className="w-full mt-2 py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed">Add Text to Canvas</button>
                            {isPlacingText && <p className="text-xs text-indigo-300 text-center mt-2 animate-pulse">Click on the canvas to place your text.</p>}
                        </div>
                    </aside>
                </main>
                <footer className="flex items-center justify-end p-4 border-t border-gray-700/50 flex-shrink-0 gap-3">
                    <button onClick={onClose} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                    <button onClick={handleSaveClick} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Save & Use Image</button>
                </footer>
            </div>
        </div>
    );
};
