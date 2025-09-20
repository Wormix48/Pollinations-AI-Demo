import React from 'react';
import { ImageIcon, LoadingSpinner, WarningIcon, ExternalLinkIcon } from './Icons';
import type { GenerationHistoryItem } from '../types';

interface ImageDisplayProps {
  activeHistoryItem: GenerationHistoryItem | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  lastRequestUrl: string | null;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  activeHistoryItem,
  isLoading,
  loadingMessage,
  error,
  lastRequestUrl
}) => {
  const generatedImageUrl = activeHistoryItem?.imageDataUrl;
  const generatedImageRequestUrl = activeHistoryItem?.requestUrl;
  const prompt = activeHistoryItem?.prompt ?? '';
  const translationUsedFallback = activeHistoryItem?.translationUsedFallback ?? false;
  const enhancementFailed = activeHistoryItem?.enhancementFailed ?? false;
  const sourceImageUrl = activeHistoryItem?.params?.image;

  const Placeholder = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-500">
      <ImageIcon className="w-24 h-24" />
      <h2 className="text-xl font-semibold text-gray-400">Your masterpiece awaits</h2>
      <p>Enter your idea, choose a model, and watch it come to life.</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-400 animate-fade-in">
        <div className="relative">
            <div className="w-32 h-32 border-4 border-dashed border-gray-600 rounded-lg animate-spin-slow"></div>
            <LoadingSpinner className="w-16 h-16 absolute top-1/2 left-1/2 -mt-8 -ml-8 text-indigo-500 animate-pulse-fast"/>
        </div>
        <h2 className="text-xl font-semibold text-indigo-400">{loadingMessage}</h2>
        <p className="max-w-md">Our AI is working its magic. This can take a moment, especially for complex creations.</p>
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
              <h2 className="text-xl font-semibold">Generation Failed</h2>
              <p className="break-words">{error}</p>
          </div>
          {lastRequestUrl && (
            <a
              href={lastRequestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 self-start py-2 px-3 rounded-md hover:bg-indigo-500/10"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Generated Link
            </a>
          )}
        </div>
      ) : generatedImageUrl ? (
        <div className="w-full max-w-3xl animate-fade-in flex flex-col gap-4">
          <div className="aspect-square bg-black rounded-lg overflow-hidden shadow-2xl shadow-indigo-900/20">
            <img src={generatedImageUrl} alt={prompt} className="w-full h-full object-contain" />
          </div>
          {sourceImageUrl && (
            <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
              <p className="text-sm font-semibold text-gray-200 mb-2">Source Image:</p>
              <img src={sourceImageUrl} alt="Source for image-to-image generation" className="max-h-24 rounded-md" />
            </div>
          )}
          <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-300 break-words"><strong className="font-semibold text-gray-200">Prompt:</strong> {prompt}</p>
            {(translationUsedFallback || enhancementFailed) && (
              <div className="mt-3 pt-3 border-t border-gray-700/60 text-xs text-yellow-400/90 space-y-1">
                {translationUsedFallback && <p><strong>Note:</strong> Auto-translation to English failed; the original text was used.</p>}
                {enhancementFailed && <p><strong>Note:</strong> Prompt auto-enhancement failed; the original prompt was used.</p>}
              </div>
            )}
          </div>
          <a
            href={generatedImageRequestUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors duration-200 self-start py-2 px-3 rounded-md hover:bg-indigo-500/10"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            Open Full Image
          </a>
        </div>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};