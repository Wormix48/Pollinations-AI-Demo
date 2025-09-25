import React from 'react';
import { ExpandIcon } from './Icons';

interface ImageEditorFooterProps {
    onZoomTo100: () => void;
    onFitToView: () => void;
    onCancel: () => void;
    onSave: () => void;
}

export const ImageEditorFooter: React.FC<ImageEditorFooterProps> = React.memo(({
    onZoomTo100, onFitToView, onCancel, onSave
}) => {
    return (
        <footer className="flex items-center justify-between p-4 border-t border-gray-700/50 flex-shrink-0 gap-3">
            <div className="flex items-center gap-2">
                <button onClick={onZoomTo100} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors" title="Zoom to 100%">100%</button>
                <button onClick={onFitToView} className="p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors" title="Fit to view"><ExpandIcon className="w-5 h-5"/></button>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={onCancel} className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-600/50 hover:bg-gray-600/80 transition-colors">Cancel</button>
                <button onClick={onSave} className="py-2 px-4 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">Save & Use Image</button>
            </div>
        </footer>
    );
});
