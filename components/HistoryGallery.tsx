import React, { useState, useEffect, useRef } from 'react';
import type { GenerationHistoryItem } from '../types';
import { DownloadIcon, DeleteIcon, ExpandIcon, ImageIcon } from './Icons';

interface HistoryGalleryProps {
  history: GenerationHistoryItem[];
  activeItemId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onView: (id: number) => void;
  isImageModelSelected: boolean;
  onUseAsSource: (imageDataUrl: string) => void;
}

const HistoryItem: React.FC<{
  item: GenerationHistoryItem;
  isActive: boolean;
  areControlsVisible: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onView: (e: React.MouseEvent) => void;
  onUseAsSource: (e: React.MouseEvent) => void;
  isImageModelSelected: boolean;
}> = ({ item, isActive, areControlsVisible, onSelect, onDelete, onDownload, onView, onUseAsSource, isImageModelSelected }) => {
  return (
    <div className="relative aspect-square rounded-md overflow-hidden" onClick={onSelect}>
      <img
        src={item.imageDataUrl}
        alt={item.prompt.substring(0, 50)}
        className={`w-full h-full object-cover cursor-pointer transition-all duration-200 ${
          isActive ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : 'ring-2 ring-transparent hover:ring-indigo-600'
        }`}
      />
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 grid grid-cols-2 gap-2 place-content-center p-2 ${
            areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        // Prevent click from bubbling up to the main div
        onClick={(e) => e.stopPropagation()}
      >
        {isImageModelSelected && (
            <button
              onClick={onUseAsSource}
              className="p-2 bg-gray-900/70 text-gray-200 hover:text-white rounded-full transition-colors"
              title="Use as Source"
              aria-label="Use as Source"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
        )}
        <button
          onClick={onView}
          className="p-2 bg-gray-900/70 text-gray-200 hover:text-white rounded-full transition-colors"
          title="View Fullscreen"
          aria-label="View Fullscreen"
        >
          <ExpandIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onDownload}
          className="p-2 bg-gray-900/70 text-gray-200 hover:text-white rounded-full transition-colors"
          title="Download Image"
          aria-label="Download Image"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-gray-900/70 text-red-400 hover:text-red-300 rounded-full transition-colors"
          title="Delete Image"
          aria-label="Delete Image"
        >
          <DeleteIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, activeItemId, onSelect, onDelete, onDownload, onView, isImageModelSelected, onUseAsSource }) => {
  const [controlsVisibleId, setControlsVisibleId] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (galleryRef.current && !galleryRef.current.contains(event.target as Node)) {
        setControlsVisibleId(null);
      }
    };

    if (controlsVisibleId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [controlsVisibleId]);


  if (history.length === 0) {
    return null;
  }

  const handleSelect = (id: number) => {
    onSelect(id);
    setControlsVisibleId(prevId => (prevId === id ? null : id));
  };

  return (
    <div ref={galleryRef} className="bg-gray-800/50 rounded-lg border border-gray-700/50 mt-8 p-4 animate-fade-in">
      <h3 className="font-semibold text-gray-200 mb-4">Generation History</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {history.map(item => (
          <HistoryItem
            key={item.id}
            item={item}
            isActive={item.id === activeItemId}
            areControlsVisible={item.id === controlsVisibleId}
            onSelect={() => handleSelect(item.id)}
            onDelete={(e) => { e.stopPropagation(); onDelete(item.id); }}
            onDownload={(e) => { e.stopPropagation(); onDownload(item.id); }}
            onView={(e) => { e.stopPropagation(); onView(item.id); }}
            onUseAsSource={(e) => { e.stopPropagation(); onUseAsSource(item.imageDataUrl); }}
            isImageModelSelected={isImageModelSelected}
          />
        ))}
      </div>
    </div>
  );
};
