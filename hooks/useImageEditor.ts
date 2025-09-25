import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Tool, Layer, CanvasSize, InteractionState, TextPromptState } from '../types';

interface useImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    onSave: (imageBlob: Blob) => void;
}

export const useImageEditor = ({ imageUrl, onClose, onSave }: useImageEditorProps) => {
    // Refs
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(true);
    // This ref is to allow high-frequency move handlers to access latest layer data without causing re-renders
    const layersRef = useRef<Layer[]>([]);

    // State
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
    const [layers, _setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [tool, _setTool] = useState<Tool>('brush');
    const [color, setColor] = useState('#EF4444');
    const [brushSize, setBrushSize] = useState(20);
    const [isRectFilled, setIsRectFilled] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [interaction, setInteraction] = useState<InteractionState | null>(null);
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [autoSelectLayer, setAutoSelectLayer] = useState(false);
    const [textPrompt, setTextPrompt] = useState<TextPromptState>({ visible: false, value: '', x: 0, y: 0 });
    const [textSize, setTextSize] = useState(48);

    const setLayers = (newLayers: React.SetStateAction<Layer[]>) => {
        const result = typeof newLayers === 'function' ? newLayers(layersRef.current) : newLayers;
        layersRef.current = result;
        _setLayers(result);
    };
    
    const setTool = (newTool: Tool) => {
        if (newTool === 'rectangle' && tool !== 'rectangle') {
            setBrushSize(1);
        }
        _setTool(newTool);
    };

    // --- Core Drawing & State Management ---

    const drawCompositeCanvas = useCallback(() => {
        const canvas = mainCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d')!;
        patternCanvas.width = 16;
        patternCanvas.height = 16;
        patternCtx.fillStyle = '#4a5568';
        patternCtx.fillRect(0, 0, 16, 16);
        patternCtx.fillStyle = '#2d3748';
        patternCtx.fillRect(0, 0, 8, 8);
        patternCtx.fillRect(8, 8, 8, 8);
        const pattern = ctx.createPattern(patternCanvas, 'repeat')!;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const layer of layersRef.current) {
            if (layer.visible) {
                const w = layer.canvas.width * layer.scale;
                const h = layer.canvas.height * layer.scale;
                ctx.drawImage(layer.canvas, layer.x, layer.y, w, h);
            }
        }
    }, []);
    
    const saveState = useCallback(() => {
        if (textPrompt.visible) return;
        const stateData = {
            canvasSize,
            layers: layersRef.current.map(l => ({
                id: l.id, name: l.name, x: l.x, y: l.y, scale: l.scale, visible: l.visible,
                imageData: l.canvas.toDataURL(),
            }))
        };
        const newStateString = JSON.stringify(stateData);

        setHistory(prevHistory => {
            const currentHistory = prevHistory.slice(0, historyIndex + 1);
            
            // Prevent saving identical subsequent states
            if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === newStateString) {
                return prevHistory;
            }

            currentHistory.push(newStateString);
            setHistoryIndex(currentHistory.length - 1);
            return currentHistory;
        });
    }, [historyIndex, canvasSize, textPrompt.visible]);

    const restoreState = useCallback(async (index: number) => {
        if (index < 0 || index >= history.length) return;
        
        const historyEntry = JSON.parse(history[index]);
        const stateToRestore = Array.isArray(historyEntry) ? historyEntry : historyEntry.layers;
        const canvasSizeToRestore = historyEntry.canvasSize;
        
        const newLayersPromises = stateToRestore.map((savedLayer: any) => 
            new Promise<Layer>(resolve => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.getContext('2d')?.drawImage(img, 0, 0);
                    resolve({
                        id: savedLayer.id, name: savedLayer.name, canvas,
                        visible: savedLayer.visible, x: savedLayer.x, y: savedLayer.y, scale: savedLayer.scale
                    });
                };
                img.src = savedLayer.imageData;
            })
        );
        
        const newLayers = await Promise.all(newLayersPromises);
        const layerMap = new Map(newLayers.map(l => [l.id, l]));
        const sortedLayers = stateToRestore.map((s: any) => layerMap.get(s.id)).filter(Boolean);

        if (canvasSizeToRestore) {
            setCanvasSize(canvasSizeToRestore);
        }

        setLayers(sortedLayers as Layer[]);
        setHistoryIndex(index);
    }, [history]);

    const handleUndo = () => historyIndex > 0 && restoreState(historyIndex - 1);
    const handleRedo = () => historyIndex < history.length - 1 && restoreState(historyIndex + 1);

    // --- Interaction Logic ---
    const drawOnLayer = useCallback((layer: Layer, from: {x: number, y: number}, to: {x: number, y: number}, currentTool: Tool, drawColor: string, size: number, isSinglePoint = false) => {
        const ctx = layer.canvas.getContext('2d')!;
        ctx.save();
        ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.lineWidth = size;
        ctx.strokeStyle = drawColor;
        ctx.fillStyle = drawColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const localFrom = { x: (from.x - layer.x) / layer.scale, y: (from.y - layer.y) / layer.scale };
        const localTo = { x: (to.x - layer.x) / layer.scale, y: (to.y - layer.y) / layer.scale };

        if (isSinglePoint) {
            ctx.beginPath();
            ctx.arc(localTo.x, localTo.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(localFrom.x, localFrom.y);
            ctx.lineTo(localTo.x, localTo.y);
            ctx.stroke();
        }
        ctx.restore();
    }, []);

    const getPointerPosition = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent): { x: number; y: number } => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        const touch = 'touches' in e && e.touches[0];
        const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;
        
        const canvasX = (clientX - rect.left - viewOffset.x) / zoom;
        const canvasY = (clientY - rect.top - viewOffset.y) / zoom;
        return { x: canvasX, y: canvasY };
    }, [zoom, viewOffset]);
    
    const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if ('button' in e && e.button === 1) { // Middle mouse pan
            e.preventDefault();
            setInteraction({ type: 'pan', startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, original: { x: viewOffset.x, y: viewOffset.y } });
            return;
        }
        if ('touches' in e && e.touches.length === 2) { // Pinch zoom
            const t1 = e.touches[0]; const t2 = e.touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const midPoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            setInteraction({ type: 'pinch', startX: midPoint.x, startY: midPoint.y, lastX: midPoint.x, lastY: midPoint.y, original: {x: viewOffset.x, y: viewOffset.y}, initialPinch: { dist, zoom } });
            return;
        }
        if (textPrompt.visible) return;
        if (isSpacePressed) {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setInteraction({ type: 'pan', startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, original: { x: viewOffset.x, y: viewOffset.y } });
            return;
        }
        const pos = getPointerPosition(e);
        if (tool === 'text') {
            setTextPrompt({ visible: true, value: 'Your text here', x: pos.x, y: pos.y });
            return;
        }
        let selectedLayer = layersRef.current.find(l => l.id === selectedLayerId);
        if (tool === 'brush' || tool === 'eraser' || tool === 'rectangle') {
            if (!selectedLayer || !selectedLayer.visible) return;
            
            const snapshotCanvas = document.createElement('canvas');
            snapshotCanvas.width = selectedLayer.canvas.width;
            snapshotCanvas.height = selectedLayer.canvas.height;
            snapshotCanvas.getContext('2d')!.drawImage(selectedLayer.canvas, 0, 0);

            if (tool === 'brush' || tool === 'eraser') {
                drawOnLayer(selectedLayer, pos, pos, tool, color, brushSize, true);
                setInteraction({ type: 'draw', layerId: selectedLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, scale: selectedLayer.scale }, snapshotCanvas, strokePoints: [pos] });
            } else { // rectangle
                const snapshot = selectedLayer.canvas.getContext('2d')!.getImageData(0, 0, selectedLayer.canvas.width, selectedLayer.canvas.height);
                setInteraction({ type: 'draw-rect', layerId: selectedLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, scale: selectedLayer.scale }, snapshot, snapshotCanvas });
            }
        } else if (tool === 'move') {
            let targetLayer: Layer | null = null;
            if (autoSelectLayer) {
                for (let i = layersRef.current.length - 1; i >= 0; i--) { 
                    const l = layersRef.current[i];
                    if (l.visible && pos.x >= l.x && pos.x <= l.x + l.canvas.width*l.scale && pos.y >= l.y && pos.y <= l.y + l.canvas.height*l.scale) {
                        targetLayer = l;
                        break;
                    }
                }
            } else if (selectedLayer && selectedLayer.visible && pos.x >= selectedLayer.x && pos.x <= selectedLayer.x + selectedLayer.canvas.width*selectedLayer.scale && pos.y >= selectedLayer.y && pos.y <= selectedLayer.y + selectedLayer.canvas.height*selectedLayer.scale) {
                targetLayer = selectedLayer;
            }

            if (targetLayer) {
                if (autoSelectLayer && selectedLayerId !== targetLayer.id) setSelectedLayerId(targetLayer.id);
                setInteraction({ type: 'move', layerId: targetLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: targetLayer.x, y: targetLayer.y } });
            }
        }
    }, [isSpacePressed, textPrompt.visible, tool, selectedLayerId, autoSelectLayer, getPointerPosition, viewOffset, zoom, drawOnLayer, color, brushSize, isRectFilled]);

    const handleScaleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const selectedLayer = layersRef.current.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return;
        e.stopPropagation();
        const pos = getPointerPosition(e);
        setInteraction({ type: 'scale-br', layerId: selectedLayerId, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, width: selectedLayer.canvas.width * selectedLayer.scale, height: selectedLayer.canvas.height * selectedLayer.scale, scale: selectedLayer.scale } });
    }, [selectedLayerId, getPointerPosition]);

    const handleCropInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: any) => {
        e.preventDefault(); e.stopPropagation();
        const pos = getPointerPosition(e);
        setInteraction({ type, startX: pos.x, startY: pos.y, lastX:pos.x, lastY:pos.y, original: { ...cropBox } });
    }, [cropBox, getPointerPosition]);
    
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        if (e.altKey) {
            const rect = container.getBoundingClientRect();
            const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const newZoom = Math.max(0.05, Math.min(10, zoom * (e.deltaY < 0 ? 1.1 : 1/1.1)));
            const worldPos = { x: (pointer.x - viewOffset.x) / zoom, y: (pointer.y - viewOffset.y) / zoom };
            setViewOffset({ x: pointer.x - worldPos.x * newZoom, y: pointer.y - worldPos.y * newZoom });
            setZoom(newZoom);
        } else if (e.shiftKey) {
            setBrushSize(s => Math.max(1, Math.min(200, s + (e.deltaY < 0 ? 1 : -1))));
        } else {
             setViewOffset(v => ({...v, x: v.x - e.deltaX, y: v.y - e.deltaY}));
        }
    }, [zoom, viewOffset]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!interaction) return;
            e.preventDefault();

            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const touch = 'touches' in e && e.touches[0];
            const clientX = touch ? touch.clientX : (e as MouseEvent).clientX;
            const clientY = touch ? touch.clientY : (e as MouseEvent).clientY;

            if (interaction.type === 'pan') {
                 setViewOffset({ x: interaction.original.x + (clientX - interaction.startX), y: interaction.original.y + (clientY - interaction.startY) });
                 return;
            }
            if (interaction.type === 'pinch' && 'touches' in e && e.touches.length === 2) {
                const t1 = e.touches[0], t2 = e.touches[1];
                const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const midPoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
                const { initialPinch, startX: iMidX, startY: iMidY, original } = interaction;
                if (!initialPinch || initialPinch.dist === 0) return;
                const newZoom = Math.max(0.05, Math.min(10, initialPinch.zoom * (newDist / initialPinch.dist)));
                const worldPoint = { x: ((iMidX - rect.left) - original.x) / initialPinch.zoom, y: ((iMidY - rect.top) - original.y) / initialPinch.zoom };
                setZoom(newZoom);
                setViewOffset({ x: (midPoint.x - rect.left) - worldPoint.x * newZoom, y: (midPoint.y - rect.top) - worldPoint.y * newZoom });
                return;
            }

            const pos = getPointerPosition(e);

            switch(interaction.type) {
                case 'draw': {
                    const layer = layersRef.current.find(l => l.id === interaction.layerId);
                    if (!layer) return;

                    drawOnLayer(layer, { x: interaction.lastX, y: interaction.lastY }, pos, tool, color, brushSize);
                    
                    drawCompositeCanvas();
                    setInteraction(prev => {
                        if (!prev || !prev.strokePoints) return null;
                        return { ...prev, lastX: pos.x, lastY: pos.y, strokePoints: [...prev.strokePoints, pos] };
                    });
                    break;
                }
                case 'draw-rect': {
                    const layer = layersRef.current.find(l => l.id === interaction.layerId);
                    if (!layer || !interaction.snapshot) break;

                    const ctx = layer.canvas.getContext('2d')!;
                    ctx.putImageData(interaction.snapshot, 0, 0);

                    const localStart = { x: (interaction.startX - layer.x) / layer.scale, y: (interaction.startY - layer.y) / layer.scale };
                    const localCurrent = { x: (pos.x - layer.x) / layer.scale, y: (pos.y - layer.y) / layer.scale };

                    const rectToDraw = { x: Math.min(localStart.x, localCurrent.x), y: Math.min(localStart.y, localCurrent.y), w: Math.abs(localStart.x - localCurrent.x), h: Math.abs(localStart.y - localCurrent.y) };

                    if (isRectFilled) {
                        ctx.fillStyle = color;
                        ctx.fillRect(rectToDraw.x, rectToDraw.y, rectToDraw.w, rectToDraw.h);
                    } else {
                        ctx.strokeStyle = color; ctx.lineWidth = brushSize;
                        ctx.strokeRect(rectToDraw.x + brushSize / 2, rectToDraw.y + brushSize / 2, rectToDraw.w - brushSize, rectToDraw.h - brushSize);
                    }
                    
                    drawCompositeCanvas();
                    setInteraction(prev => prev ? { ...prev, lastX: pos.x, lastY: pos.y } : null);
                    break;
                }
                case 'move':
                    setLayers(ls => ls.map(l => l.id === interaction.layerId ? { ...l, x: interaction.original.x + pos.x - interaction.startX, y: interaction.original.y + pos.y - interaction.startY } : l));
                    break;
                case 'scale-br': {
                    const layer = layersRef.current.find(l => l.id === interaction.layerId)!;
                    const newScale = ((interaction.original.width! + pos.x - interaction.startX) / layer.canvas.width);
                    setLayers(ls => ls.map(l => l.id === interaction.layerId ? { ...l, scale: Math.max(0.05, newScale) } : l));
                    break;
                }
                default:
                    if (interaction.type.startsWith('crop-')) {
                        let { x, y, width, height } = interaction.original;
                        width = width!; height = height!;
                        const dx = pos.x - interaction.startX, dy = pos.y - interaction.startY;
                        switch(interaction.type) {
                            case 'crop-move': x += dx; y += dy; break;
                            case 'crop-t': y += dy; height -= dy; break;
                            case 'crop-b': height += dy; break;
                            case 'crop-l': x += dx; width -= dx; break;
                            case 'crop-r': width += dx; break;
                            case 'crop-tl': x += dx; width -= dx; y += dy; height -= dy; break;
                            case 'crop-tr': width += dx; y += dy; height -= dy; break;
                            case 'crop-bl': x += dx; width -= dx; height += dy; break;
                            case 'crop-br': width += dx; height += dy; break;
                        }
                        setCropBox({ x: Math.round(x), y: Math.round(y), width: Math.max(10, Math.round(width)), height: Math.max(10, Math.round(height)) });
                    }
            }
        };

        const handleGlobalPointerUp = (e: MouseEvent | TouchEvent) => {
            if ('touches' in e && e.touches.length > 0) return;

            if (interaction) {
                const interactionType = interaction.type;
                if (interactionType === 'draw' || interactionType === 'draw-rect') {
                    const { snapshotCanvas, strokePoints, layerId, original } = interaction;
                    const finalLayer = layersRef.current.find(l => l.id === layerId)!;
                    const halfBrush = brushSize / 2;
                    
                    const points = interactionType === 'draw' ? strokePoints! : [ {x: interaction.startX, y: interaction.startY}, {x: interaction.lastX, y: interaction.lastY} ];
                    
                    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
                    points.forEach(p => {
                        const localX = (p.x - original.x) / original.scale!;
                        const localY = (p.y - original.y) / original.scale!;
                        bounds.minX = Math.min(bounds.minX, localX - halfBrush);
                        bounds.minY = Math.min(bounds.minY, localY - halfBrush);
                        bounds.maxX = Math.max(bounds.maxX, localX + halfBrush);
                        bounds.maxY = Math.max(bounds.maxY, localY + halfBrush);
                    });

                    const expansion = {
                        left: Math.max(0, Math.ceil(-bounds.minX)),
                        top: Math.max(0, Math.ceil(-bounds.minY)),
                        right: Math.max(0, Math.ceil(bounds.maxX - snapshotCanvas!.width)),
                        bottom: Math.max(0, Math.ceil(bounds.maxY - snapshotCanvas!.height)),
                    };
                    if (Object.values(expansion).some(v => v > 0)) {
                        const newCanvas = document.createElement('canvas');
                        newCanvas.width = snapshotCanvas!.width + expansion.left + expansion.right;
                        newCanvas.height = snapshotCanvas!.height + expansion.top + expansion.bottom;
                        const newCtx = newCanvas.getContext('2d')!;
                        newCtx.drawImage(snapshotCanvas!, expansion.left, expansion.top);
                        const newLayerX = original.x - (expansion.left * original.scale!);
                        const newLayerY = original.y - (expansion.top * original.scale!);
                        
                        // Redraw full stroke/rect
                        if(interactionType === 'draw') {
                            newCtx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                            newCtx.lineWidth = brushSize; newCtx.strokeStyle = color; newCtx.fillStyle = color;
                            newCtx.lineCap = 'round'; newCtx.lineJoin = 'round';
                            if (points.length === 1) {
                                const p = points[0]; const localX = (p.x - newLayerX) / original.scale!; const localY = (p.y - newLayerY) / original.scale!;
                                newCtx.beginPath(); newCtx.arc(localX, localY, brushSize / 2, 0, Math.PI * 2); newCtx.fill();
                            } else {
                                newCtx.beginPath();
                                for (let i = 0; i < points.length; i++) {
                                    const p = points[i]; const localX = (p.x - newLayerX) / original.scale!; const localY = (p.y - newLayerY) / original.scale!;
                                    if (i === 0) newCtx.moveTo(localX, localY); else newCtx.lineTo(localX, localY);
                                }
                                newCtx.stroke();
                            }
                        } else { // rect
                            const localStart = { x: (interaction.startX - newLayerX) / original.scale!, y: (interaction.startY - newLayerY) / original.scale! };
                            const localEnd = { x: (interaction.lastX - newLayerX) / original.scale!, y: (interaction.lastY - newLayerY) / original.scale! };
                            const rect = { x: Math.min(localStart.x, localEnd.x), y: Math.min(localStart.y, localEnd.y), w: Math.abs(localStart.x - localEnd.x), h: Math.abs(localStart.y - localEnd.y) };
                            if (isRectFilled) {
                                newCtx.fillStyle = color; newCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
                            } else {
                                newCtx.strokeStyle = color; newCtx.lineWidth = brushSize; newCtx.strokeRect(rect.x + halfBrush, rect.y + halfBrush, rect.w - brushSize, rect.h - brushSize);
                            }
                        }
                        setLayers(layersRef.current.map(l => l.id === layerId ? { ...finalLayer, canvas: newCanvas, x: newLayerX, y: newLayerY } : l));
                    }
                }
                
                if (interactionType !== 'pan' && interactionType !== 'pinch') {
                    saveState();
                }
            }
            setInteraction(null);
        };
        
        if (interaction) {
            window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
            window.addEventListener('touchmove', handleGlobalMouseMove, { passive: false });
            window.addEventListener('mouseup', handleGlobalPointerUp, { passive: false });
            window.addEventListener('touchend', handleGlobalPointerUp, { passive: false });
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('touchmove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalPointerUp);
            window.removeEventListener('touchend', handleGlobalPointerUp);
        };
    }, [interaction, getPointerPosition, drawCompositeCanvas, saveState, drawOnLayer, tool, color, brushSize, isRectFilled]);

    // --- Actions ---

    const addTextLayer = useCallback((text: string, x: number, y: number) => {
        if (!text.trim()) return;
        const tempCtx = document.createElement('canvas').getContext('2d')!;
        tempCtx.font = `${textSize}px sans-serif`;
        const lines = text.split('\n');
        const maxWidth = Math.max(...lines.map(line => tempCtx.measureText(line).width));
        const metrics = tempCtx.measureText("M");
        const fontHeight = (metrics.fontBoundingBoxAscent || textSize * 0.8) + (metrics.fontBoundingBoxDescent || textSize * 0.2);
        if (maxWidth <= 0 || fontHeight <= 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = fontHeight * lines.length;
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${textSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => ctx.fillText(line, 0, i * fontHeight));
        
        const newLayer: Layer = { id: Date.now(), name: `Text: ${text.substring(0, 10)}...`, canvas, visible: true, x, y, scale: 1 };
        saveState();
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
        setTool('move');
    }, [textSize, color, saveState]);

    const handleDeleteLayer = useCallback(() => {
        if (selectedLayerId) {
            saveState();
            setLayers(l => {
                const filtered = l.filter(layer => layer.id !== selectedLayerId);
                if (filtered.length > 0) {
                    const currentIndex = l.findIndex(layer => layer.id === selectedLayerId);
                    setSelectedLayerId(filtered[Math.max(0, currentIndex - 1)].id);
                } else onClose();
                return filtered;
            });
        }
    }, [selectedLayerId, saveState, onClose]);

    const handleFitToView = useCallback(() => {
        const container = containerRef.current;
        if (!container || !canvasSize.width || !canvasSize.height) return;
        const { clientWidth, clientHeight } = container;
        const scaleX = clientWidth / canvasSize.width;
        const scaleY = clientHeight / canvasSize.height;
        const newZoom = Math.min(scaleX, scaleY) * 0.95;
        setZoom(newZoom);
        setViewOffset({
            x: (clientWidth - canvasSize.width * newZoom) / 2,
            y: (clientHeight - canvasSize.height * newZoom) / 2,
        });
    }, [canvasSize]);

    const handleZoomTo100 = () => {
        const container = containerRef.current;
        if (!container || !canvasSize.width) return;
        const { clientWidth, clientHeight } = container;
        setZoom(1);
        setViewOffset({
            x: (clientWidth - canvasSize.width) / 2,
            y: (clientHeight - canvasSize.height) / 2,
        });
    };
    
    const applyCrop = () => {
        saveState();
        const { x: cropX, y: cropY, width: newWidth, height: newHeight } = cropBox;
        if (newWidth <= 0 || newHeight <= 0) return;
        const updatedLayers = layersRef.current.map(layer => ({ ...layer, x: layer.x - cropX, y: layer.y - cropY }));
        setCanvasSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
        setLayers(updatedLayers);
        setTool('move');
    };
    const cancelCrop = () => { 
        if(historyIndex > 0) {
            restoreState(historyIndex);
        }
        setTool('move');
    };

    const getCompressedBlob = async (canvas: HTMLCanvasElement, maxSizeInBytes: number = 10 * 1024 * 1024): Promise<Blob> => {
        const pngBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (pngBlob && pngBlob.size <= maxSizeInBytes) return pngBlob;
    
        let quality = 0.92;
        let jpegBlob: Blob | null = null;
        while (quality > 0.1) {
            jpegBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
            if (jpegBlob && jpegBlob.size <= maxSizeInBytes) return jpegBlob;
            quality -= 0.15;
        }
    
        const smallestJpeg = jpegBlob;
        if (pngBlob && smallestJpeg && pngBlob.size < smallestJpeg.size) return pngBlob;
        if (smallestJpeg) return smallestJpeg;
        if (pngBlob) return pngBlob;
        
        throw new Error("Could not create blob from canvas.");
    };

    const handleSaveClick = async () => {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvasSize.width;
        finalCanvas.height = canvasSize.height;
        const ctx = finalCanvas.getContext('2d')!;
        
        [...layersRef.current].forEach(layer => {
            if (layer.visible) {
                 const w = layer.canvas.width * layer.scale;
                 const h = layer.canvas.height * layer.scale;
                 ctx.drawImage(layer.canvas, layer.x, layer.y, w, h);
            }
        });
        
        try {
            const compressedBlob = await getCompressedBlob(finalCanvas);
            onSave(compressedBlob);
        } catch (error) {
            console.error("Failed to compress and save image:", error);
            alert(`Could not save the image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    
    const onAddImageLayer = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                canvas.getContext('2d')?.drawImage(img, 0, 0);
                const newLayer: Layer = { id: Date.now(), name: `Layer ${layersRef.current.length + 1}`, canvas, visible: true, x: (canvasSize.width - canvas.width) / 2, y: (canvasSize.height - canvas.height) / 2, scale: 1 };
                saveState(); setLayers(prev => [...prev, newLayer]); setSelectedLayerId(newLayer.id);
            }
        };
        reader.readAsDataURL(file);
    }, [canvasSize, saveState]);

    const onAddColorLayer = useCallback((bgColor: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize.width; canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const newLayer: Layer = { id: Date.now(), name: `Background`, canvas, visible: true, x: 0, y: 0, scale: 1 };
        saveState(); setLayers(prev => [newLayer, ...prev]); setSelectedLayerId(newLayer.id);
    }, [canvasSize, saveState]);

    const onToggleVisibility = useCallback((id: number) => { 
        saveState(); 
        setLayers(l => l.map(l2 => l2.id === id ? {...l2, visible: !l2.visible} : l2)); 
    }, [saveState]);

    const onReorderLayers = useCallback((dragIndex: number, hoverIndex: number) => {
        saveState();
        setLayers(currentLayers => {
            const newLayers = [...currentLayers];
            const [draggedItem] = newLayers.splice(dragIndex, 1);
            newLayers.splice(hoverIndex, 0, draggedItem);
            return newLayers;
        });
    }, [saveState]);

    // --- Effects for Initialization & Observation ---

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d')?.drawImage(img, 0, 0);
            const newLayer: Layer = { id: Date.now(), name: "Base Image", canvas, visible: true, x: 0, y: 0, scale: 1, };
            setLayers([newLayer]);
            setSelectedLayerId(newLayer.id);
            setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight });
            setHistory([]);
            setHistoryIndex(-1);
        };
        img.src = imageUrl;
    }, [imageUrl]);
    
    useEffect(() => {
        if (canvasSize.width > 0 && containerRef.current && isInitialLoad.current) {
             handleFitToView();
             isInitialLoad.current = false;
        }
    }, [canvasSize.width, canvasSize.height, handleFitToView]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(() => handleFitToView());
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [handleFitToView]);

    useEffect(() => {
        if (layersRef.current.length > 0 && history.length === 0 && historyIndex === -1) {
            saveState();
        }
    }, [layers, history, historyIndex, saveState]);

    useEffect(() => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        setCropBox({ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
        drawCompositeCanvas();
    }, [canvasSize, drawCompositeCanvas]);

    useEffect(() => {
        drawCompositeCanvas();
    }, [layers, drawCompositeCanvas]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (textPrompt.visible || (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
            if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); }
            const isCtrl = e.ctrlKey || e.metaKey;
            if (isCtrl && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
            if (isCtrl && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
            if (e.code === 'KeyB') setTool('brush'); if (e.code === 'KeyE') setTool('eraser');
            if (e.code === 'KeyV') setTool('move'); if (e.code === 'KeyC') setTool('crop');
            if (e.code === 'KeyT') setTool('text'); if (e.code === 'KeyR') setTool('rectangle');
            if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); handleDeleteLayer(); }
            if (e.code === 'BracketLeft') setBrushSize(s => Math.max(1, s - (e.shiftKey ? 10 : 1)));
            if (e.code === 'BracketRight') setBrushSize(s => Math.min(200, s + (e.shiftKey ? 10 : 1)));
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(false); }};
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); }
    }, [textPrompt.visible, handleUndo, handleRedo, handleDeleteLayer]);

    return {
        refs: { mainCanvasRef, containerRef },
        state: {
            layers, selectedLayerId, tool, color, brushSize,
            isRectFilled, history, historyIndex, interaction,
            cropBox, zoom, viewOffset, isSpacePressed, autoSelectLayer,
            textPrompt, textSize, canvasSize
        },
        actions: {
            handlePointerDown, handleScaleInteractionStart, handleCropInteractionStart, handleWheel,
            handleUndo, handleRedo, addTextLayer, applyCrop, cancelCrop, handleDeleteLayer,
            handleFitToView, handleZoomTo100, handleSaveClick, onAddImageLayer, onAddColorLayer,
            onToggleVisibility, onReorderLayers, setTool, setColor, setBrushSize,
            setIsRectFilled, setAutoSelectLayer, setTextPrompt, setTextSize, setSelectedLayerId,
        }
    };
};