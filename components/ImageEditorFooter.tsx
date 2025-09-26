import React from 'react';
import { ExpandIcon, CanvasSizeIcon, LoadingSpinner } from './Icons';

interface ImageEditorFooterProps {
    isAspectRatioLocked: boolean;
    setIsAspectRatioLocked: (locked: boolean) => void;
    isMoveToolActive: boolean;
    onZoomTo100: () => void;
    onFitToView: () => void;
    onResizeCanvas: () => void;
    onCancel: () => void;
    onSave: () => void;
    isLoading: boolean;
}

export const ImageEditorFooter: React.FC<ImageEditorFooterProps> = React.memo(({
    isAspectRatioLocked, setIsAspectRatioLocked, isMoveToolActive,
    onZoomTo100, onFitToView, onResizeCanvas, onCancel, onSave, isLoading
}) => {
    return (
        <div className="flex items-center justify-end gap-6 h-full">
            <div className="flex items-center gap-2">
                {isMoveToolActive && (
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
                        <input type="checkbox" checked={isAspectRatioLocked} onChange={e => setIsAspectRatioLocked(e.target.checked)} className="w-4 h-4 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-600"/>
                        Lock Ratio
                    </label>
                )}
                <button onClick={onZoomTo100} className="py-2 px-3 text-sm font-semibold rounded-md bg-gray-800 hover:bg-gray-700 transition-colors" title="Zoom to 100%">100%</button>
                <button onClick={onFitToView} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors" title="Fit to view"><CanvasSizeIcon className="w-5 h-5"/></button>
                <button onClick={onResizeCanvas} className="flex items-center gap-1.5 py-2 px-3 text-sm font-semibold rounded-md bg-gray-800 hover:bg-gray-700 transition-colors" title="Resize Canvas">
                    <ExpandIcon className="w-5 h-5"/>
                    Resize
                </button>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onCancel} 
                    disabled={isLoading}
                    className="py-3 px-6 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button 
                    onClick={onSave} 
                    disabled={isLoading}
                    className="py-3 px-6 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2 w-32 disabled:bg-indigo-800/50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner className="w-5 h-5" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        'Save & Use'
                    )}
                </button>
            </div>
        </div>
    );
});