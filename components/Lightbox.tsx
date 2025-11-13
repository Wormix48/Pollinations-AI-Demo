
import React, { useEffect } from 'react';
import type { GenerationHistoryItem } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface LightboxProps {
  item: GenerationHistoryItem;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const Lightbox: React.FC<LightboxProps> = ({ item, onClose, onNext, onPrev, hasNext, hasPrev }) => {
  const { t } = useTranslation();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        
        <div className="relative max-w-screen-xl w-full max-h-full flex flex-col gap-4">
            <div className="flex-grow flex items-center justify-center min-h-0">
                 <img src={item.imageDataUrl} alt={item.prompt} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            </div>
            <div className="bg-gray-900/60 p-4 rounded-lg text-sm text-gray-300 max-h-[15vh] overflow-y-auto backdrop-blur-sm border border-white/10">
                <strong className="text-gray-100">{t('lightbox.prompt')}</strong> {item.prompt}
            </div>
        </div>

        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={t('lightbox.closeAria')}
        >
            <CloseIcon className="w-6 h-6" />
        </button>

        {hasPrev && (
            <button 
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t('lightbox.prevAria')}
            >
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
        )}
        {hasNext && (
            <button 
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={t('lightbox.nextAria')}
            >
                <ChevronRightIcon className="w-8 h-8" />
            </button>
        )}
      </div>
    </div>
  );
};
