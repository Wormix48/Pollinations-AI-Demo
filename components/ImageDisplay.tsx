
import React from 'react';
import { ImageIcon, LoadingSpinner, WarningIcon, ExternalLinkIcon, UpdateIcon, CloseIcon } from './Icons';
import type { GenerationHistoryItem } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ImageDisplayProps {
  activeHistoryItem: GenerationHistoryItem | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  lastRequestUrl: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  isImageModelSelected: boolean;
  onUseAsSource: (imageDataUrl: string) => void;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  activeHistoryItem,
  isLoading,
  loadingMessage,
  error,
  lastRequestUrl,
  onRetry,
  onCancel,
  isImageModelSelected,
  onUseAsSource,
}) => {
  const { t } = useTranslation();
  const generatedImageUrl = activeHistoryItem?.imageDataUrl;
  const prompt = activeHistoryItem?.prompt ?? '';
  const translationUsedFallback = activeHistoryItem?.translationUsedFallback ?? false;
  const enhancementFailed = activeHistoryItem?.enhancementFailed ?? false;
  
  const sourceImageParam = activeHistoryItem?.params?.image;
  const sourceImageUrls = sourceImageParam ? (Array.isArray(sourceImageParam) ? sourceImageParam : [sourceImageParam]) : [];


  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500">
      <ImageIcon className="w-24 h-24" />
      <h2 className="text-xl font-semibold text-gray-400">{t('imageDisplay.placeholder.title')}</h2>
      <p>{t('imageDisplay.placeholder.body')}</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-400 animate-fade-in">
        <div className="relative">
            <div className="w-32 h-32 border-4 border-dashed border-gray-600 rounded-lg animate-spin-slow"></div>
            <LoadingSpinner className="w-16 h-16 absolute top-1/2 left-1/2 -mt-8 -ml-8 text-indigo-500 animate-pulse-fast"/>
        </div>
        <h2 className="text-xl font-semibold text-indigo-400">{loadingMessage}</h2>
        <p className="max-w-md">{t('imageDisplay.loading.body')}</p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-colors duration-200 py-2 px-4 rounded-md bg-red-900/40 hover:bg-red-900/60 ring-1 ring-inset ring-red-500/50"
            aria-label={t('imageDisplay.loading.cancelAria')}
          >
            <CloseIcon className="w-4 h-4" />
            {t('imageDisplay.loading.cancel')}
          </button>
        )}
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-900/70 border border-dashed border-gray-700 rounded-lg flex items-center justify-center p-4 min-h-[400px] lg:min-h-full">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="w-full max-w-3xl animate-fade-in flex flex-col gap-4 items-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center text-red-400 bg-red-900/20 p-8 rounded-lg w-full">
              <WarningIcon className="w-16 h-16"/>
              <h2 className="text-xl font-semibold">{t('imageDisplay.error.title')}</h2>
              <p className="break-words">{error}</p>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-indigo-500/10"
                >
                  <UpdateIcon className="w-4 h-4" />
                  {t('imageDisplay.error.retry')}
                </button>
              )}
              {lastRequestUrl && (
                <a
                  href={lastRequestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 py-2 px-3 rounded-md hover:bg-indigo-500/10"
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  {t('imageDisplay.error.openLink')}
                </a>
              )}
            </div>
          </div>
        </div>
      ) : generatedImageUrl ? (
        <div className="w-full max-w-3xl animate-fade-in flex flex-col gap-4">
          <div className="aspect-square bg-black rounded-lg overflow-hidden shadow-2xl shadow-indigo-900/20">
            <img src={generatedImageUrl} alt={prompt} className="w-full h-full object-contain" />
          </div>
          {sourceImageUrls.length > 0 && (
            <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
              <p className="text-sm font-semibold text-gray-200 mb-2">{t('imageDisplay.result.sourceImages')}</p>
              <div className="flex flex-wrap gap-2">
                {sourceImageUrls.map((url, index) => (
                    <img key={index} src={url} alt={t('imageDisplay.result.sourceImageAlt', { index: index + 1 })} className="max-h-24 rounded-md" />
                ))}
              </div>
            </div>
          )}
          <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-300 break-words"><strong className="font-semibold text-gray-200">{t('imageDisplay.result.prompt')}</strong> {prompt}</p>
            {(translationUsedFallback || enhancementFailed) && (
              <div className="mt-3 pt-3 border-t border-gray-700/60 text-xs text-yellow-400/90 space-y-1">
                {translationUsedFallback && <p><strong>{t('imageDisplay.result.notes.translationFailed').split(':')[0]}:</strong> {t('imageDisplay.result.notes.translationFailed').split(':')[1]}</p>}
                {enhancementFailed && <p><strong>{t('imageDisplay.result.notes.enhancementFailed').split(':')[0]}:</strong> {t('imageDisplay.result.notes.enhancementFailed').split(':')[1]}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {activeHistoryItem?.requestUrl && (
              <a
                href={activeHistoryItem.requestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 self-start py-2 px-3 rounded-md hover:bg-indigo-500/10"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                {t('imageDisplay.result.openFullImage')}
              </a>
            )}
            {activeHistoryItem && isImageModelSelected && (
              <button
                onClick={() => onUseAsSource(activeHistoryItem.imageDataUrl)}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 self-start py-2 px-3 rounded-md hover:bg-indigo-500/10"
                aria-label={t('imageDisplay.result.useAsSourceAria')}
              >
                <ImageIcon className="w-4 h-4" />
                {t('imageDisplay.result.useAsSource')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
