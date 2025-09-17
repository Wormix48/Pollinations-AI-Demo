
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptControls } from './components/PromptControls';
import { ImageDisplay } from './components/ImageDisplay';
import { HistoryGallery } from './components/HistoryGallery';
import { Lightbox } from './components/Lightbox';
import { generateImage, fetchModels } from './services/pollinationsService';
import { enhancePrompt, translateToEnglishIfNeeded, checkGeminiApiKey } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { GenerationModel, PollinationsImageParams, Style, SelectedStyle, Preset, GenerationHistoryItem } from './types';
import { ASPECT_RATIOS } from './constants';

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  
  // Model state
  const [models, setModels] = useState<GenerationModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<GenerationModel | null>(null);
  const [modelsLoading, setModelsLoading] = useState<boolean>(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Gemini API Key State
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage<string>('gemini-api-key', '');
  const [isGeminiKeyValid, setIsGeminiKeyValid] = useState<boolean | null>(null);
  const [isCheckingGeminiKey, setIsCheckingGeminiKey] = useState<boolean>(false);
  
  // Style state
  const [selectedStyles, setSelectedStyles] = useState<SelectedStyle[]>([{ id: Date.now(), style: null }]);

  // Generation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastRequestUrl, setLastRequestUrl] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generation-history', []);
  const [activeHistoryItem, setActiveHistoryItem] = useState<GenerationHistoryItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Effect to sync active item with history from local storage
  useEffect(() => {
    if (history.length > 0) {
      // If there's no active item, or the active item is no longer in history, select the first one.
      if (!activeHistoryItem || !history.find(item => item.id === activeHistoryItem.id)) {
        setActiveHistoryItem(history[0]);
      }
    } else {
      // If history is empty, clear the active item.
      setActiveHistoryItem(null);
    }
  }, [history, activeHistoryItem]);

  // State for Pollinations params
  const [seed, setSeed] = useState<string>('');
  const [seedMode, setSeedMode] = useState<'random' | 'manual'>('random');
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [width, setWidth] = useState<string>(String(ASPECT_RATIOS[0].width));
  const [height, setHeight] = useState<string>(String(ASPECT_RATIOS[0].height));
  const [isEnhanceEnabled, setIsEnhanceEnabled] = useState<boolean>(true);
  const [isTranslateEnabled, setIsTranslateEnabled] = useState<boolean>(false);
  const [nologo, setNologo] = useState<boolean>(true);
  const [nofeed, setNofeed] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isSafeMode, setIsSafeMode] = useState<boolean>(false);

  // Presets State
  const [presets, setPresets] = useLocalStorage<Preset[]>('generation-presets', []);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Check Gemini API key on initial load
  useEffect(() => {
    const validateKeyOnLoad = async () => {
      if (geminiApiKey) {
        setIsCheckingGeminiKey(true);
        const isValid = await checkGeminiApiKey(geminiApiKey);
        setIsGeminiKeyValid(isValid);
        setIsCheckingGeminiKey(false);
      } else {
        setIsGeminiKeyValid(false);
      }
    };
    validateKeyOnLoad();
  }, [geminiApiKey]);


  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true);
        const modelIds = await fetchModels();
        const availableModels = modelIds.map(id => {
          let name = id.charAt(0).toUpperCase() + id.slice(1);
          if (id.toLowerCase() === 'turbo') {
            name = 'Turbo (nsfw)';
          }
          return { id, name };
        });

        setModels(availableModels);
        if (availableModels.length > 0) {
          // Default to first available model, or 'flux' if available
          const defaultModel = availableModels.find(m => m.id === 'flux') || availableModels[0];
          setSelectedModel(defaultModel);
        }
      } catch (err) {
        setModelsError(err instanceof Error ? err.message : 'Could not fetch models.');
        console.error(err);
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  const handleAspectRatioChange = useCallback((ratioValue: string) => {
    const selectedRatio = ASPECT_RATIOS.find(r => r.value === ratioValue);
    if (selectedRatio) {
      setAspectRatio(selectedRatio.value);
      setWidth(String(selectedRatio.width));
      setHeight(String(selectedRatio.height));
    }
  }, []);
  
  const handleDimensionChange = useCallback((newWidth: string, newHeight: string) => {
      setWidth(newWidth);
      setHeight(newHeight);
      const matchingRatio = ASPECT_RATIOS.find(r => r.width === Number(newWidth) && r.height === Number(newHeight));
      setAspectRatio(matchingRatio ? matchingRatio.value : '');
  }, []);


  const handleGenerate = useCallback(async () => {
    const basePrompt = prompt.trim();
    const activeStyles = selectedStyles.map(s => s.style).filter((style): style is Style => style !== null);

    if (!basePrompt && activeStyles.length === 0) {
      setError('Please enter a prompt or select a style.');
      return;
    }
    if (!selectedModel) {
      setError('Please select a model.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastRequestUrl(null);

    let translationUsedFallback = false;
    let enhancementFailed = false;

    try {
      let workingPrompt = basePrompt;
      if (isTranslateEnabled && basePrompt) {
          setLoadingMessage('Translating prompt...');
          const { translatedText, usedFallback } = await translateToEnglishIfNeeded(basePrompt, geminiApiKey);
          workingPrompt = translatedText;
          if (usedFallback) {
            translationUsedFallback = true;
          }
      }

      const stylePrompts = activeStyles.map(style => style.prompt).join(', ');
      
      let promptWithStyle = workingPrompt;
      if (stylePrompts) {
          promptWithStyle = workingPrompt ? `${workingPrompt}, ${stylePrompts}` : stylePrompts;
      }

      promptWithStyle = promptWithStyle.split(',').map(s => s.trim()).filter(Boolean).join(', ');

      if (!promptWithStyle) {
        setError('Prompt became empty after processing. Please check your input.');
        setIsLoading(false);
        return;
      }

      let promptToUse = promptWithStyle;
      if (isEnhanceEnabled && isGeminiKeyValid) {
        setLoadingMessage('Enhancing prompt...');
        const combinedStylePrompt = activeStyles.map(style => style.prompt).join(', ');
        const { enhancedPrompt, enhancementFailed: didFail } = await enhancePrompt(promptWithStyle, selectedModel.id, geminiApiKey, combinedStylePrompt);
        promptToUse = enhancedPrompt;
        if (didFail) {
            enhancementFailed = true;
        }
      }
      
      setLoadingMessage('Generating your masterpiece...');
      
      let finalSeed = seed;
      if (seedMode === 'random') {
        finalSeed = String(Math.floor(Math.random() * 100000));
        setSeed(finalSeed);
      }

      const roundToMultipleOf8 = (num: number) => Math.round(num / 8) * 8;
      const finalWidth = roundToMultipleOf8(Number(width) || 1024);
      const finalHeight = roundToMultipleOf8(Number(height) || 1024);

      const params: PollinationsImageParams = {
        prompt: promptToUse,
        model: selectedModel.id,
        width: finalWidth,
        height: finalHeight,
        seed: finalSeed ? Number(finalSeed) : undefined,
        enhance: false,
        nologo,
        nofeed,
        private: isPrivate,
        safe: isSafeMode,
      };
      
      const { blob, requestUrl } = await generateImage(params);
      const imageDataUrl = await blobToDataURL(blob);

      const newHistoryItem: GenerationHistoryItem = {
        id: Date.now(),
        imageDataUrl,
        requestUrl,
        prompt: promptToUse,
        params,
        translationUsedFallback,
        enhancementFailed,
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setActiveHistoryItem(newHistoryItem);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred during generation: ${errorMessage}. Please check the console for details.`);
      if (e && typeof (e as any).requestUrl === 'string') {
        setLastRequestUrl((e as any).requestUrl);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, selectedModel, selectedStyles, width, height, seed, seedMode, isEnhanceEnabled, isTranslateEnabled, nologo, nofeed, isPrivate, isSafeMode, setHistory, geminiApiKey, isGeminiKeyValid]);
  
  // Preset Handlers
  const handleSavePreset = (name: string) => {
    if (!name.trim()) {
      alert("Please enter a name for the preset.");
      return;
    }
    const newPreset: Preset = {
      name: name.trim(),
      modelId: selectedModel?.id || '',
      styles: selectedStyles.map(s => s.style).filter((s): s is Style => s !== null),
      aspectRatio,
      width,
      height,
      seed,
      seedMode,
      isEnhanceEnabled,
      isTranslateEnabled,
      isSafeMode,
      nologo,
      nofeed,
      isPrivate
    };

    setPresets(prev => {
      const existingIndex = prev.findIndex(p => p.name === newPreset.name);
      if (existingIndex > -1) {
        const updatedPresets = [...prev];
        updatedPresets[existingIndex] = newPreset;
        return updatedPresets;
      }
      return [...prev, newPreset];
    });
    setSelectedPreset(newPreset.name);
  };

  const handleLoadPreset = (name: string) => {
    const preset = presets.find(p => p.name === name);
    if (!preset) {
      alert("Preset not found!");
      return;
    };
    
    const model = models.find(m => m.id === preset.modelId) || selectedModel;
    setSelectedModel(model);

    const stylesToLoad = preset.styles.map((style, index) => ({ id: Date.now() + index, style }));
    setSelectedStyles(stylesToLoad.length > 0 ? stylesToLoad : [{ id: Date.now(), style: null }]);

    setAspectRatio(preset.aspectRatio);
    setWidth(preset.width);
    setHeight(preset.height);
    setSeed(preset.seed);
    setSeedMode(preset.seedMode);
    setIsEnhanceEnabled(preset.isEnhanceEnabled);
    setIsTranslateEnabled(preset.isTranslateEnabled);
    setIsSafeMode(preset.isSafeMode);
    setNologo(preset.nologo);
    setNofeed(preset.nofeed);
    setIsPrivate(preset.isPrivate);
    setSelectedPreset(name);
  };

  const handleDeletePreset = (name: string) => {
    setPresets(prev => prev.filter(p => p.name !== name));
    if (selectedPreset === name) {
      setSelectedPreset('');
    }
  };

  // History Handlers
  const handleSelectHistoryItem = (id: number) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setActiveHistoryItem(item);
    }
  };

  const handleDeleteHistoryItem = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleDownload = (id: number) => {
    const item = history.find(h => h.id === id);
    if (item) {
      const link = document.createElement('a');
      link.href = item.imageDataUrl;
      const safePrompt = item.prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `pollinations_${safePrompt}_${item.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCheckAndSaveApiKey = async (key: string): Promise<boolean> => {
    setIsCheckingGeminiKey(true);
    setIsGeminiKeyValid(null);
    const isValid = await checkGeminiApiKey(key);
    setIsGeminiKeyValid(isValid);
    if (isValid) {
      setGeminiApiKey(key);
    }
    setIsCheckingGeminiKey(false);
    return isValid;
  };

  // Lightbox Handlers
  const handleViewHistoryItem = (id: number) => {
    const index = history.findIndex(item => item.id === id);
    if (index !== -1) {
      setLightboxIndex(index);
    }
  };
  
  const handleCloseLightbox = () => {
    setLightboxIndex(null);
  };

  const handleNextLightboxItem = () => {
    if (lightboxIndex !== null && lightboxIndex < history.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrevLightboxItem = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-5/12 xl:w-1/3 flex flex-col gap-6">
          <PromptControls
            prompt={prompt}
            setPrompt={setPrompt}
            models={models}
            modelsLoading={modelsLoading}
            modelsError={modelsError}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedStyles={selectedStyles}
            setSelectedStyles={setSelectedStyles}
            isEnhanceEnabled={isEnhanceEnabled}
            setIsEnhanceEnabled={setIsEnhanceEnabled}
            isTranslateEnabled={isTranslateEnabled}
            setIsTranslateEnabled={setIsTranslateEnabled}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            aspectRatio={aspectRatio}
            onAspectRatioChange={handleAspectRatioChange}
            width={width}
            height={height}
            onDimensionChange={handleDimensionChange}
            seed={seed}
            setSeed={setSeed}
            seedMode={seedMode}
            setSeedMode={setSeedMode}
            nologo={nologo}
            setNologo={setNologo}
            nofeed={nofeed}
            setNofeed={setNofeed}
            isPrivate={isPrivate}
            setIsPrivate={setIsPrivate}
            isSafeMode={isSafeMode}
            setIsSafeMode={setIsSafeMode}
            presets={presets}
            selectedPreset={selectedPreset}
            onSelectedPresetChange={setSelectedPreset}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
            geminiApiKey={geminiApiKey}
            isGeminiKeyValid={isGeminiKeyValid}
            isCheckingGeminiKey={isCheckingGeminiKey}
            onCheckAndSaveApiKey={handleCheckAndSaveApiKey}
          />
        </aside>
        <section className="flex-grow lg:w-7/12 xl:w-2/3">
          <ImageDisplay
            activeHistoryItem={activeHistoryItem}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
            lastRequestUrl={lastRequestUrl}
          />
           <HistoryGallery
            history={history}
            activeItemId={activeHistoryItem?.id ?? null}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onDownload={handleDownload}
            onView={handleViewHistoryItem}
          />
        </section>
      </main>
      {lightboxIndex !== null && (
        <Lightbox 
          item={history[lightboxIndex]}
          onClose={handleCloseLightbox}
          onNext={handleNextLightboxItem}
          onPrev={handlePrevLightboxItem}
          hasNext={lightboxIndex < history.length - 1}
          hasPrev={lightboxIndex > 0}
        />
      )}
    </div>
  );
};

export default App;
