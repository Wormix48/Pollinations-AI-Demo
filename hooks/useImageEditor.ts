import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Tool, Layer, CanvasSize, InteractionState, TextPromptState, InteractionType } from '../types';

interface useImageEditorProps {
    imageUrl: string;
    onClose: () => void;
    onSave: (imageBlob: Blob) => void;
}

const getOpaqueBounds = (canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const { width, height } = canvas;
    if (width === 0 || height === 0) return null;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width, minY = height, maxX = -1, maxY = -1;

    // Top scan
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 0) {
                minY = y;
                y = height; // break outer loop
                break;
            }
        }
    }

    // If no pixels found, minY will still be height
    if (minY === height) {
        return null;
    }

    // Bottom scan
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 0) {
                maxY = y;
                y = -1; // break outer loop
                break;
            }
        }
    }

    // Left scan
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (data[(y * width + x) * 4 + 3] > 0) {
                minX = x;
                x = width; // break outer loop
                break;
            }
        }
    }

    // Right scan
    for (let x = width - 1; x >= 0; x--) {
        for (let y = 0; y < height; y++) {
            if (data[(y * width + x) * 4 + 3] > 0) {
                maxX = x;
                x = -1; // break outer loop
                break;
            }
        }
    }
    
    if (maxX < minX || maxY < minY) {
        return null;
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
};


export const useImageEditor = ({ imageUrl, onClose, onSave }: useImageEditorProps) => {
    // Refs
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(true);
    const layersRef = useRef<Layer[]>([]);
    const lastDrawPosRef = useRef({ x: 0, y: 0 });
    const prevCanvasSizeRef = useRef<CanvasSize | null>(null);
    const isUpdatingFromHistory = useRef(false);

    // State
    const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
    const [layers, _setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [tool, _setTool] = useState<Tool>('brush');
    const [color, setColor] = useState('#EF4444');
    const [brushSize, setBrushSize] = useState(20);
    const [eraserSize, setEraserSize] = useState(20);
    const [rectangleStrokeSize, setRectangleStrokeSize] = useState(1);
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
    const [isResizeModalOpen, setIsResizeModalOpen] = useState(false);
    const [resizeDimensions, setResizeDimensions] = useState({ width: 0, height: 0 });
    const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true);

    const setLayers = (newLayers: React.SetStateAction<Layer[]>) => {
        const result = typeof newLayers === 'function' ? newLayers(layersRef.current) : newLayers;
        layersRef.current = result;
        _setLayers(result);
    };
    
    const setTool = (newTool: Tool) => {
        _setTool(newTool);
    };

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
                ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);
            }
        }
    }, []);
    
    const saveState = useCallback(() => {
        if (textPrompt.visible) return;
        const stateData = {
            canvasSize,
            layers: layersRef.current.map(l => ({
                id: l.id, name: l.name, x: l.x, y: l.y, width: l.width, height: l.height, visible: l.visible,
                imageData: l.canvas.toDataURL(),
            }))
        };
        const newStateString = JSON.stringify(stateData);

        setHistory(prevHistory => {
            const currentHistory = prevHistory.slice(0, historyIndex + 1);
            
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
        
        isUpdatingFromHistory.current = true;
        
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
                        visible: savedLayer.visible, x: savedLayer.x, y: savedLayer.y,
                        width: savedLayer.width, height: savedLayer.height
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

    const drawOnLayer = useCallback((layer: Layer, from: {x: number, y: number}, to: {x: number, y: number}, currentTool: Tool, drawColor: string, size: number, isSinglePoint = false) => {
        const ctx = layer.canvas.getContext('2d')!;
        ctx.save();
        ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.lineWidth = size * (layer.canvas.width / layer.width); // Scale brush size
        ctx.strokeStyle = drawColor;
        ctx.fillStyle = drawColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const localFrom = { x: (from.x - layer.x) * (layer.canvas.width / layer.width), y: (from.y - layer.y) * (layer.canvas.height / layer.height) };
        const localTo = { x: (to.x - layer.x) * (layer.canvas.width / layer.width), y: (to.y - layer.y) * (layer.canvas.height / layer.height) };

        if (isSinglePoint) {
            ctx.beginPath();
            ctx.arc(localTo.x, localTo.y, ctx.lineWidth / 2, 0, Math.PI * 2);
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
    
    const handleDeleteLayer = useCallback((layerIdToDelete?: number) => {
        const idToDelete = layerIdToDelete ?? selectedLayerId;
        if (idToDelete) {
            saveState();
            setLayers(l => {
                const currentLayers = layersRef.current; // Use the most up-to-date list for finding index
                const filtered = l.filter(layer => layer.id !== idToDelete);
                if (filtered.length > 0) {
                    if (selectedLayerId === idToDelete) {
                        const currentIndex = currentLayers.findIndex(layer => layer.id === idToDelete);
                        setSelectedLayerId(filtered[Math.max(0, currentIndex - 1)].id);
                    }
                } else {
                    onClose();
                }
                return filtered;
            });
        }
    }, [selectedLayerId, saveState, onClose]);

    const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if ('button' in e && e.button === 1) { // Middle mouse pan
            e.preventDefault();
            setInteraction({ type: 'pan', startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, original: { x: viewOffset.x, y: viewOffset.y, width: 0, height: 0 } });
            return;
        }

        const isTouchEvent = 'touches' in e;

        if (isTouchEvent && (e as React.TouchEvent).touches.length === 2) { // Pinch zoom
            const t1 = (e as React.TouchEvent).touches[0]; const t2 = (e as React.TouchEvent).touches[1];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const midPoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            setInteraction({ type: 'pinch', startX: midPoint.x, startY: midPoint.y, lastX: midPoint.x, lastY: midPoint.y, original: {x: viewOffset.x, y: viewOffset.y, width: 0, height: 0}, initialPinch: { dist, zoom } });
            return;
        }
        if (textPrompt.visible) return;
        if (isSpacePressed) {
            const clientX = isTouchEvent ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = isTouchEvent ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
            setInteraction({ type: 'pan', startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, original: { x: viewOffset.x, y: viewOffset.y, width: 0, height: 0 } });
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
            
             const currentSize = tool === 'brush' ? brushSize : tool === 'eraser' ? eraserSize : rectangleStrokeSize;
             const halfBrush = tool === 'rectangle' ? (isRectFilled ? 0 : currentSize / 2) : currentSize / 2;
             const strokeBounds = {
                minX: pos.x - halfBrush,
                minY: pos.y - halfBrush,
                maxX: pos.x + halfBrush,
                maxY: pos.y + halfBrush,
            };

            if (tool === 'brush' || tool === 'eraser') {
                if (!isTouchEvent) { // Don't draw dot on touch start to allow for pinch-zoom
                    drawOnLayer(selectedLayer, pos, pos, tool, color, currentSize, true);
                    drawCompositeCanvas();
                }
                lastDrawPosRef.current = pos;
                setInteraction({ type: 'draw', layerId: selectedLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, width: selectedLayer.width, height: selectedLayer.height }, strokeBounds, isTouchEvent });
            } else { // rectangle
                const snapshot = selectedLayer.canvas.getContext('2d')!.getImageData(0, 0, selectedLayer.canvas.width, selectedLayer.canvas.height);
                setInteraction({ type: 'draw-rect', layerId: selectedLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, width: selectedLayer.width, height: selectedLayer.height }, snapshot, strokeBounds, isTouchEvent });
            }
        } else if (tool === 'move') {
            let targetLayer: Layer | null = null;
            if (autoSelectLayer) {
                for (let i = layersRef.current.length - 1; i >= 0; i--) { 
                    const l = layersRef.current[i];
                    if (l.visible && pos.x >= l.x && pos.x <= l.x + l.width && pos.y >= l.y && pos.y <= l.y + l.height) {
                        targetLayer = l;
                        break;
                    }
                }
            } else if (selectedLayer && selectedLayer.visible && pos.x >= selectedLayer.x && pos.x <= selectedLayer.x + selectedLayer.width && pos.y >= selectedLayer.y && pos.y <= selectedLayer.y + selectedLayer.height) {
                targetLayer = selectedLayer;
            }

            if (targetLayer) {
                if (autoSelectLayer && selectedLayerId !== targetLayer.id) setSelectedLayerId(targetLayer.id);
                setInteraction({ type: 'move', layerId: targetLayer.id, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: targetLayer.x, y: targetLayer.y, width: targetLayer.width, height: targetLayer.height } });
            }
        }
    }, [isSpacePressed, textPrompt.visible, tool, selectedLayerId, autoSelectLayer, getPointerPosition, viewOffset, zoom, drawOnLayer, color, brushSize, eraserSize, rectangleStrokeSize, isRectFilled, drawCompositeCanvas]);

    const handleTransformInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: InteractionType) => {
        const selectedLayer = layersRef.current.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return;
        e.stopPropagation();
        e.preventDefault();
        const pos = getPointerPosition(e);
        setInteraction({ type, layerId: selectedLayerId, startX: pos.x, startY: pos.y, lastX: pos.x, lastY: pos.y, original: { x: selectedLayer.x, y: selectedLayer.y, width: selectedLayer.width, height: selectedLayer.height } });
    }, [selectedLayerId, getPointerPosition]);

    const handleCropInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: any) => {
        e.preventDefault(); e.stopPropagation();
        const pos = getPointerPosition(e);
        setInteraction({ type, startX: pos.x, startY: pos.y, lastX:pos.x, lastY:pos.y, original: { ...cropBox, x: cropBox.x, y: cropBox.y } });
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
            const increment = e.deltaY < 0 ? 1 : -1;
            switch (tool) {
                case 'brush':
                    setBrushSize(s => Math.max(1, Math.min(200, s + increment)));
                    break;
                case 'eraser':
                    setEraserSize(s => Math.max(1, Math.min(200, s + increment)));
                    break;
                case 'rectangle':
                    setRectangleStrokeSize(s => Math.max(1, Math.min(200, s + increment)));
                    break;
                case 'text':
                    setTextSize(s => Math.max(8, Math.min(200, s + increment)));
                    break;
            }
        } else {
             setViewOffset(v => ({...v, x: v.x - e.deltaX, y: v.y - e.deltaY}));
        }
    }, [zoom, viewOffset, tool]);

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
            interaction.lastX = pos.x;
            interaction.lastY = pos.y;

            if (interaction.type === 'draw' || interaction.type === 'draw-rect') {
                const currentSize = tool === 'brush' ? brushSize : tool === 'eraser' ? eraserSize : rectangleStrokeSize;
                
                if (interaction.strokeBounds) {
                    const halfBrush = tool === 'rectangle' ? (isRectFilled ? 0 : currentSize / 2) : currentSize / 2;
                    interaction.strokeBounds.minX = Math.min(interaction.strokeBounds.minX, pos.x - halfBrush);
                    interaction.strokeBounds.minY = Math.min(interaction.strokeBounds.minY, pos.y - halfBrush);
                    interaction.strokeBounds.maxX = Math.max(interaction.strokeBounds.maxX, pos.x + halfBrush);
                    interaction.strokeBounds.maxY = Math.max(interaction.strokeBounds.maxY, pos.y + halfBrush);
                }

                let layer = layersRef.current.find(l => l.id === interaction.layerId);
                if (!layer) return;

                const halfBrush = tool === 'rectangle' ? (isRectFilled ? 0 : currentSize / 2) : currentSize / 2;
                
                const currentBounds = interaction.type === 'draw'
                    ? { minX: Math.min(pos.x, lastDrawPosRef.current.x) - halfBrush, minY: Math.min(pos.y, lastDrawPosRef.current.y) - halfBrush, maxX: Math.max(pos.x, lastDrawPosRef.current.x) + halfBrush, maxY: Math.max(pos.y, lastDrawPosRef.current.y) + halfBrush }
                    : { minX: Math.min(pos.x, interaction.startX) - halfBrush, minY: Math.min(pos.y, interaction.startY) - halfBrush, maxX: Math.max(pos.x, interaction.startX) + halfBrush, maxY: Math.max(pos.y, interaction.startY) + halfBrush };
                
                const expansion = {
                    left: Math.max(0, Math.ceil(layer.x - currentBounds.minX)),
                    top: Math.max(0, Math.ceil(layer.y - currentBounds.minY)),
                    right: Math.max(0, Math.ceil(currentBounds.maxX - (layer.x + layer.width))),
                    bottom: Math.max(0, Math.ceil(currentBounds.maxY - (layer.y + layer.height))),
                };

                let layerToDrawOn = layer;
                if (tool !== 'eraser' && (expansion.left > 0 || expansion.top > 0 || expansion.right > 0 || expansion.bottom > 0)) {
                    const scaleX = layer.canvas.width / layer.width;
                    const scaleY = layer.canvas.height / layer.height;

                    const newCanvas = document.createElement('canvas');
                    const oldCanvas = layer.canvas;
                    newCanvas.width = Math.round(oldCanvas.width + (expansion.left + expansion.right) * scaleX);
                    newCanvas.height = Math.round(oldCanvas.height + (expansion.top + expansion.bottom) * scaleY);
                    newCanvas.getContext('2d')!.drawImage(oldCanvas, Math.round(expansion.left * scaleX), Math.round(expansion.top * scaleY));

                    const newWidth = layer.width + expansion.left + expansion.right;
                    const newHeight = layer.height + expansion.top + expansion.bottom;
                    const newX = layer.x - expansion.left;
                    const newY = layer.y - expansion.top;

                    const newLayerState = { ...layer, canvas: newCanvas, x: newX, y: newY, width: newWidth, height: newHeight };
                    setLayers(ls => ls.map(l => l.id === layer.id ? newLayerState : l));
                    layerToDrawOn = newLayerState;
                    
                    if (interaction.type === 'draw-rect' && interaction.snapshot) {
                         const newSnapshotCanvas = document.createElement('canvas');
                         newSnapshotCanvas.width = newCanvas.width;
                         newSnapshotCanvas.height = newCanvas.height;
                         const newSnapshotCtx = newSnapshotCanvas.getContext('2d')!;
                         newSnapshotCtx.putImageData(interaction.snapshot, Math.round(expansion.left * scaleX), Math.round(expansion.top * scaleY));
                         interaction.snapshot = newSnapshotCtx.getImageData(0, 0, newSnapshotCanvas.width, newSnapshotCanvas.height);
                    }
                }
                
                if (interaction.type === 'draw') {
                    drawOnLayer(layerToDrawOn, lastDrawPosRef.current, pos, tool, color, currentSize);
                    lastDrawPosRef.current = pos;
                } else { // draw-rect
                    const ctx = layerToDrawOn.canvas.getContext('2d')!;
                    ctx.putImageData(interaction.snapshot!, 0, 0);
                    const localStart = { x: (interaction.startX - layerToDrawOn.x) * (layerToDrawOn.canvas.width / layerToDrawOn.width), y: (interaction.startY - layerToDrawOn.y) * (layerToDrawOn.canvas.height / layerToDrawOn.height) };
                    const localCurrent = { x: (pos.x - layerToDrawOn.x) * (layerToDrawOn.canvas.width / layerToDrawOn.width), y: (pos.y - layerToDrawOn.y) * (layerToDrawOn.canvas.height / layerToDrawOn.height) };
                    const rectToDraw = { x: Math.min(localStart.x, localCurrent.x), y: Math.min(localStart.y, localCurrent.y), w: Math.abs(localStart.x - localCurrent.x), h: Math.abs(localStart.y - localCurrent.y) };

                    if (isRectFilled) {
                        ctx.fillStyle = color;
                        ctx.fillRect(rectToDraw.x, rectToDraw.y, rectToDraw.w, rectToDraw.h);
                    } else {
                        const scaledBrushSize = currentSize * (layerToDrawOn.canvas.width / layerToDrawOn.width);
                        ctx.strokeStyle = color; ctx.lineWidth = scaledBrushSize;
                        ctx.strokeRect(rectToDraw.x + scaledBrushSize / 2, rectToDraw.y + scaledBrushSize / 2, rectToDraw.w - scaledBrushSize, rectToDraw.h - scaledBrushSize);
                    }
                }
                drawCompositeCanvas();
                return;
            }

            switch(interaction.type) {
                case 'move':
                    setLayers(ls => ls.map(l => l.id === interaction.layerId ? { ...l, x: interaction.original.x + pos.x - interaction.startX, y: interaction.original.y + pos.y - interaction.startY } : l));
                    break;
                default:
                    if (interaction.type.startsWith('transform-')) {
                        const { x, y, width, height } = interaction.original;
                        const type = interaction.type;

                        let newX = x, newY = y, newWidth = width, newHeight = height;

                        if (isAspectRatioLocked) {
                            const aspect = width / height;
                            const center = { x: x + width / 2, y: y + height / 2 };
                            let anchor = { x: 0, y: 0 };

                            switch (type) {
                                case 'transform-tl': anchor = { x: x + width, y: y + height }; break;
                                case 'transform-tr': anchor = { x: x, y: y + height }; break;
                                case 'transform-bl': anchor = { x: x + width, y: y }; break;
                                case 'transform-br': anchor = { x: x, y: y }; break;
                                case 'transform-t':  anchor = { x: center.x, y: y + height }; break;
                                case 'transform-b':  anchor = { x: center.x, y: y }; break;
                                case 'transform-l':  anchor = { x: x + width, y: center.y }; break;
                                case 'transform-r':  anchor = { x: x, y: center.y }; break;
                            }

                            const dx = pos.x - anchor.x;
                            const dy = pos.y - anchor.y;

                            if (type === 'transform-t' || type === 'transform-b') {
                                newHeight = Math.abs(dy);
                                newWidth = newHeight * aspect;
                            } else if (type === 'transform-l' || type === 'transform-r') {
                                newWidth = Math.abs(dx);
                                newHeight = newWidth / aspect;
                            } else { // Corner handles
                                if (Math.abs(dx / aspect) > Math.abs(dy)) {
                                    newWidth = Math.abs(dx);
                                    newHeight = newWidth / aspect;
                                } else {
                                    newHeight = Math.abs(dy);
                                    newWidth = newHeight * aspect;
                                }
                            }

                            switch (type) {
                                case 'transform-tl': newX = anchor.x - newWidth; newY = anchor.y - newHeight; break;
                                case 'transform-tr': newX = anchor.x; newY = anchor.y - newHeight; break;
                                case 'transform-bl': newX = anchor.x - newWidth; newY = anchor.y; break;
                                case 'transform-br': newX = anchor.x; newY = anchor.y; break;
                                case 'transform-t':  newX = anchor.x - newWidth / 2; newY = anchor.y - newHeight; break;
                                case 'transform-b':  newX = anchor.x - newWidth / 2; newY = anchor.y; break;
                                case 'transform-l':  newX = anchor.x - newWidth; newY = anchor.y - newHeight / 2; break;
                                case 'transform-r':  newX = anchor.x; newY = anchor.y - newHeight / 2; break;
                            }
                        } else { // Unlocked aspect ratio
                            const right = x + width;
                            const bottom = y + height;
                            
                            newX = x;
                            newY = y;
                            newWidth = width;
                            newHeight = height;

                            switch (type) {
                                case 'transform-br':
                                    newWidth = pos.x - x;
                                    newHeight = pos.y - y;
                                    break;
                                case 'transform-bl':
                                    newX = pos.x;
                                    newWidth = right - pos.x;
                                    newHeight = pos.y - y;
                                    break;
                                case 'transform-tr':
                                    newY = pos.y;
                                    newWidth = pos.x - x;
                                    newHeight = bottom - pos.y;
                                    break;
                                case 'transform-tl':
                                    newX = pos.x;
                                    newY = pos.y;
                                    newWidth = right - pos.x;
                                    newHeight = bottom - pos.y;
                                    break;
                                case 'transform-r':
                                    newWidth = pos.x - x;
                                    break;
                                case 'transform-l':
                                    newX = pos.x;
                                    newWidth = right - pos.x;
                                    break;
                                case 'transform-b':
                                    newHeight = pos.y - y;
                                    break;
                                case 'transform-t':
                                    newY = pos.y;
                                    newHeight = bottom - pos.y;
                                    break;
                            }

                            if (newWidth < 0) {
                                newX = newX + newWidth;
                                newWidth = -newWidth;
                            }
                            if (newHeight < 0) {
                                newY = newY + newHeight;
                                newHeight = -newHeight;
                            }
                        }
                        
                        setLayers(ls => ls.map(l => l.id === interaction.layerId ? { ...l, x: newX, y: newY, width: Math.max(10, newWidth), height: Math.max(10, newHeight) } : l));
                    
                    } else if (interaction.type.startsWith('crop-')) {
                        let { x, y, width, height } = interaction.original;
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

            if (interaction && interaction.type === 'draw' && interaction.isTouchEvent) {
                const isTap = interaction.startX === interaction.lastX && interaction.startY === interaction.lastY;
                if (isTap) {
                    // A tap on a touch device didn't draw a dot on pointer down, so draw it now.
                    let layer = layersRef.current.find(l => l.id === interaction.layerId);
                    if (layer) {
                        const pos = { x: interaction.startX, y: interaction.startY };
                        const currentSize = tool === 'brush' ? brushSize : eraserSize;
                        drawOnLayer(layer, pos, pos, tool, color, currentSize, true);
                        drawCompositeCanvas();
                    }
                }
            }

            if (interaction && (interaction.type === 'draw' || interaction.type === 'draw-rect')) {
                const { layerId, original: originalLayerState, strokeBounds } = interaction;
                const currentSize = tool === 'rectangle' ? rectangleStrokeSize : tool === 'eraser' ? eraserSize : brushSize;
                
                let finalShapeBounds = strokeBounds;
                if (interaction.type === 'draw-rect' && strokeBounds) {
                    const halfBrush = isRectFilled ? 0 : currentSize / 2;
                    finalShapeBounds = {
                        minX: Math.min(interaction.startX, interaction.lastX) - halfBrush,
                        minY: Math.min(interaction.startY, interaction.lastY) - halfBrush,
                        maxX: Math.max(interaction.startX, interaction.lastX) + halfBrush,
                        maxY: Math.max(interaction.startY, interaction.lastY) + halfBrush,
                    };
                }

                if (layerId && originalLayerState && finalShapeBounds) {
                    const layerAfterMouseMove = layersRef.current.find(l => l.id === layerId);
                    if (layerAfterMouseMove) {
                        const unionBounds = {
                            minX: Math.floor(Math.min(originalLayerState.x, finalShapeBounds.minX)),
                            minY: Math.floor(Math.min(originalLayerState.y, finalShapeBounds.minY)),
                            maxX: Math.ceil(Math.max(originalLayerState.x + originalLayerState.width, finalShapeBounds.maxX)),
                            maxY: Math.ceil(Math.max(originalLayerState.y + originalLayerState.height, finalShapeBounds.maxY)),
                        };

                        const finalWidth = unionBounds.maxX - unionBounds.minX;
                        const finalHeight = unionBounds.maxY - unionBounds.minY;
                        const finalX = unionBounds.minX;
                        const finalY = unionBounds.minY;
                        
                        const needsResize = Math.round(layerAfterMouseMove.width) !== finalWidth ||
                                            Math.round(layerAfterMouseMove.height) !== finalHeight ||
                                            Math.round(layerAfterMouseMove.x) !== finalX ||
                                            Math.round(layerAfterMouseMove.y) !== finalY;

                        if (needsResize) {
                            const scaleX = layerAfterMouseMove.canvas.width / layerAfterMouseMove.width;
                            const scaleY = layerAfterMouseMove.canvas.height / layerAfterMouseMove.height;

                            const newCanvas = document.createElement('canvas');
                            newCanvas.width = Math.max(1, Math.round(finalWidth * scaleX));
                            newCanvas.height = Math.max(1, Math.round(finalHeight * scaleY));
                            const ctx = newCanvas.getContext('2d')!;
                            
                            const sx_logical = finalX - layerAfterMouseMove.x;
                            const sy_logical = finalY - layerAfterMouseMove.y;
                            
                            const sx_pixels = sx_logical * scaleX;
                            const sy_pixels = sy_logical * scaleY;
                            const sWidth_pixels = finalWidth * scaleX;
                            const sHeight_pixels = finalHeight * scaleY;

                            ctx.drawImage(
                                layerAfterMouseMove.canvas,
                                sx_pixels, sy_pixels, sWidth_pixels, sHeight_pixels,
                                0, 0, newCanvas.width, newCanvas.height
                            );

                            const finalLayer = {
                                ...layerAfterMouseMove,
                                canvas: newCanvas,
                                x: finalX,
                                y: finalY,
                                width: finalWidth,
                                height: finalHeight,
                            };
                            
                            const newLayers = layersRef.current.map(l => l.id === layerId ? finalLayer : l);
                            layersRef.current = newLayers;
                            _setLayers(newLayers);
                        }
                    }
                }
            }

            if (interaction && interaction.type === 'draw' && tool === 'eraser') {
                const layer = layersRef.current.find(l => l.id === interaction.layerId);
                if (layer) {
                    const bounds = getOpaqueBounds(layer.canvas);
                    
                    if (!bounds) {
                        handleDeleteLayer(layer.id);
                    } else {
                        const { x: boundX, y: boundY, width: boundWidth, height: boundHeight } = bounds;
                        
                        if (boundWidth < layer.canvas.width || boundHeight < layer.canvas.height) {
                            const newCanvas = document.createElement('canvas');
                            newCanvas.width = boundWidth;
                            newCanvas.height = boundHeight;
                            newCanvas.getContext('2d')!.drawImage(
                                layer.canvas,
                                boundX, boundY, boundWidth, boundHeight,
                                0, 0, boundWidth, boundHeight
                            );
        
                            const scaleX = layer.width / layer.canvas.width;
                            const scaleY = layer.height / layer.canvas.height;
                            
                            const finalLayer = {
                                ...layer,
                                canvas: newCanvas,
                                x: layer.x + boundX * scaleX,
                                y: layer.y + boundY * scaleY,
                                width: boundWidth * scaleX,
                                height: boundHeight * scaleY,
                            };
                            
                            const newLayers = layersRef.current.map(l => l.id === layer.id ? finalLayer : l);
                            layersRef.current = newLayers;
                            _setLayers(newLayers);
                        }
                    }
                }
            }
            
            if (interaction) {
                const interactionType = interaction.type;
                if (!interactionType.startsWith('pan') && !interactionType.startsWith('pinch')) {
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
    }, [interaction, getPointerPosition, drawCompositeCanvas, saveState, drawOnLayer, tool, color, brushSize, eraserSize, rectangleStrokeSize, isRectFilled, isAspectRatioLocked, handleDeleteLayer]);

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
        
        const newLayer: Layer = { id: Date.now(), name: `Text: ${text.substring(0, 10)}...`, canvas, visible: true, x, y, width: canvas.width, height: canvas.height };
        saveState();
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
        setTool('move');
    }, [textSize, color, saveState]);

    const handleFitToView = useCallback(() => {
        if (isUpdatingFromHistory.current) return;
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
        setCropBox({ x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
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
                 ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);
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
                const newLayer: Layer = { id: Date.now(), name: `Layer ${layersRef.current.length + 1}`, canvas, visible: true, x: (canvasSize.width - canvas.width) / 2, y: (canvasSize.height - canvas.height) / 2, width: canvas.width, height: canvas.height };
                saveState(); setLayers(prev => [...prev, newLayer]); setSelectedLayerId(newLayer.id);
            }
        };
        reader.readAsDataURL(file);
    }, [canvasSize, saveState]);

    const onAddColorLayer = useCallback((bgColor: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize.width; canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const newLayer: Layer = { id: Date.now(), name: `Background`, canvas, visible: true, x: 0, y: 0, width: canvas.width, height: canvas.height };
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

    const handleOpenResizeModal = useCallback(() => {
        setResizeDimensions(canvasSize);
        setIsResizeModalOpen(true);
    }, [canvasSize]);

    const handleConfirmResize = useCallback(() => {
        saveState();
        const { width: newWidth, height: newHeight } = resizeDimensions;
        if (newWidth <= 0 || newHeight <= 0) return;

        const oldWidth = canvasSize.width;
        const oldHeight = canvasSize.height;

        const dx = (newWidth - oldWidth) / 2;
        const dy = (newHeight - oldHeight) / 2;

        const newLayers = layersRef.current.map(layer => ({ ...layer, x: layer.x + dx, y: layer.y + dy }));
        
        setLayers(newLayers);
        setCanvasSize({ width: newWidth, height: newHeight });
        setIsResizeModalOpen(false);
        setTimeout(handleFitToView, 50); // Use a short timeout to allow state to update
    }, [resizeDimensions, canvasSize, saveState, handleFitToView]);

    const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
        const selectedLayer = layersRef.current.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return;
    
        saveState();
    
        const sourceCanvas = selectedLayer.canvas;
        const newCanvas = document.createElement('canvas');
        newCanvas.width = sourceCanvas.width;
        newCanvas.height = sourceCanvas.height;
        const ctx = newCanvas.getContext('2d')!;
    
        if (direction === 'horizontal') {
            ctx.translate(newCanvas.width, 0);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(0, newCanvas.height);
            ctx.scale(1, -1);
        }
    
        ctx.drawImage(sourceCanvas, 0, 0);
    
        const newLayer = { ...selectedLayer, canvas: newCanvas };
        setLayers(ls => ls.map(l => l.id === selectedLayerId ? newLayer : l));
    }, [selectedLayerId, saveState]);

    const handleFlipHorizontal = useCallback(() => handleFlip('horizontal'), [handleFlip]);
    const handleFlipVertical = useCallback(() => handleFlip('vertical'), [handleFlip]);
    
    const handleRotate = useCallback((degrees: 90 | -90) => {
        const selectedLayer = layersRef.current.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return;
    
        saveState();
    
        const sourceCanvas = selectedLayer.canvas;
        
        const newCanvas = document.createElement('canvas');
        newCanvas.width = sourceCanvas.height;
        newCanvas.height = sourceCanvas.width;
        
        const ctx = newCanvas.getContext('2d')!;
    
        ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    
        const centerX = selectedLayer.x + selectedLayer.width / 2;
        const centerY = selectedLayer.y + selectedLayer.height / 2;
    
        const newWidth = selectedLayer.height;
        const newHeight = selectedLayer.width;
    
        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;
        
        const newLayer = { 
            ...selectedLayer, 
            canvas: newCanvas, 
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
        };
        
        setLayers(ls => ls.map(l => l.id === selectedLayerId ? newLayer : l));
    
    }, [selectedLayerId, saveState]);
    
    const handleRotateLeft = useCallback(() => handleRotate(-90), [handleRotate]);
    const handleRotateRight = useCallback(() => handleRotate(90), [handleRotate]);


    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d')?.drawImage(img, 0, 0);
            const newLayer: Layer = { id: Date.now(), name: "Base Image", canvas, visible: true, x: 0, y: 0, width: canvas.width, height: canvas.height };
            setLayers([newLayer]);
            setSelectedLayerId(newLayer.id);
            setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight });
            setHistory([]);
            setHistoryIndex(-1);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    useEffect(() => {
        if (layersRef.current.length > 0 && history.length === 0 && historyIndex === -1) {
            saveState();
        }
    }, [layers, history, historyIndex, saveState]);

    useEffect(() => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return;

        const newSize = canvasSize;
        canvas.width = newSize.width;
        canvas.height = newSize.height;

        if (isInitialLoad.current && newSize.width > 0 && containerRef.current) {
            handleFitToView();
            isInitialLoad.current = false;
        }
        
        prevCanvasSizeRef.current = newSize;

        setCropBox({ x: 0, y: 0, width: newSize.width, height: newSize.height });
        drawCompositeCanvas();
    }, [canvasSize, drawCompositeCanvas, handleFitToView]);

    useEffect(() => {
        drawCompositeCanvas();
    }, [layers, drawCompositeCanvas]);
    
    // This effect reliably resets the history update flag after a render, preventing race conditions.
    useEffect(() => {
        if (isUpdatingFromHistory.current) {
            isUpdatingFromHistory.current = false;
        }
    }, [historyIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isResizeModalOpen || textPrompt.visible || (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
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
    }, [isResizeModalOpen, textPrompt.visible, handleUndo, handleRedo, handleDeleteLayer]);

    return {
        refs: { mainCanvasRef, containerRef },
        state: {
            layers, selectedLayerId, tool, color, brushSize, eraserSize, rectangleStrokeSize,
            isRectFilled, history, historyIndex, interaction,
            cropBox, zoom, viewOffset, isSpacePressed, autoSelectLayer,
            textPrompt, textSize, canvasSize, isResizeModalOpen, resizeDimensions,
            isAspectRatioLocked,
        },
        actions: {
            handlePointerDown, handleTransformInteractionStart, handleCropInteractionStart, handleWheel,
            handleUndo, handleRedo, addTextLayer, applyCrop, cancelCrop, handleDeleteLayer,
            handleFitToView, handleZoomTo100, handleSaveClick, onAddImageLayer, onAddColorLayer,
            onToggleVisibility, onReorderLayers, setTool, setColor, setBrushSize, setEraserSize, setRectangleStrokeSize,
            setIsRectFilled, setAutoSelectLayer, setTextPrompt, setTextSize, setSelectedLayerId,
            handleOpenResizeModal, handleConfirmResize, setIsResizeModalOpen, setResizeDimensions,
            setIsAspectRatioLocked,
            handleFlipHorizontal, handleFlipVertical, handleRotateLeft, handleRotateRight,
        }
    };
};