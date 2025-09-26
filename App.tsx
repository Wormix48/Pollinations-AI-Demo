import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PromptControls } from './components/PromptControls';
import { ImageDisplay } from './components/ImageDisplay';
import { HistoryGallery } from './components/HistoryGallery';
import { Lightbox } from './components/Lightbox';
import { ImageEditorModal } from './components/ImageEditorModal';
import { generateImage, fetchModels } from './services/pollinationsService';
import { enhancePrompt, translateToEnglishIfNeeded, checkGeminiApiKey } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { GenerationModel, PollinationsImageParams, Style, SelectedStyle, Preset, GenerationHistoryItem, UploadedImage } from './types';
import { ASPECT_RATIOS } from './constants';
import { uploadImageWithVerification, deleteImage } from './services/imageHostService';

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
  const [resolutionMultiplier, setResolutionMultiplier] = useState<number>(1);
  
  // Style state
  const [selectedStyles, setSelectedStyles] = useState<SelectedStyle[]>([{ id: Date.now(), style: null }]);

  // Generation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastRequestUrl, setLastRequestUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const controlsRef = useRef<HTMLElement>(null);
  
  // History state
  const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generation-history', []);
  const [activeHistoryItem, setActiveHistoryItem] = useState<GenerationHistoryItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  // Image-to-Image model source image(s) with optional delete hashes
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [imageToEditBeforeUpload, setImageToEditBeforeUpload] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{ index: number; url: string } | null>(null);


  // Hidden high quality toggle state
  const [showHighQuality, setShowHighQuality] = useState(false);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const keySequenceRef = useRef<string[]>([]);

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
  
  // Effect to reset multiplier when model changes
  useEffect(() => {
    if (selectedModel && selectedModel.name.toLowerCase() !== 'seedream') {
      setResolutionMultiplier(1);
    }
  }, [selectedModel]);

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
  }, []); // Run only once on mount

    // Konami code listener for hidden feature
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showHighQuality) return; // Already revealed

      keySequenceRef.current.push(event.key);
      // Keep the sequence buffer the same size as the code
      if (keySequenceRef.current.length > konamiCode.length) {
        keySequenceRef.current.shift();
      }
      
      if (keySequenceRef.current.join(',') === konamiCode.join(',')) {
        setShowHighQuality(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHighQuality]);

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
  
  const isImageModelSelected = selectedModel ? ['kontext', 'nanobanana', 'seedream'].includes(selectedModel.name.toLowerCase()) : false;

  // Model-specific logic effects
  useEffect(() => {
    // Clear image URL if model is changed from an image model to a non-image model
    if (!isImageModelSelected && uploadedImages.length > 0) {
      // Note: We don't delete from ImgBB here, as the user might switch back.
      // Deletion is handled by the user explicitly removing the image.
      setUploadedImages([]);
    }
  }, [selectedModel, isImageModelSelected, uploadedImages.length]);


  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true);
        const modelIds = await fetchModels();
        
        const uniqueModels: GenerationModel[] = [];
        let seedreamAdded = false;

        for (const id of modelIds) {
          let name = id.charAt(0).toUpperCase() + id.slice(1);
          if (id.toLowerCase() === 'turbo') {
            name = 'Turbo (nsfw)';
          }

          if (id.toLowerCase().startsWith('seedream-')) {
            if (!seedreamAdded) {
              // Add the first seedream model we find, rename it, and set a flag.
              uniqueModels.push({ id, name: 'Seedream' });
              seedreamAdded = true;
            }
            // Skip any other seedream models to prevent duplication.
          } else {
            uniqueModels.push({ id, name });
          }
        }

        setModels(uniqueModels);
        
        if (uniqueModels.length > 0) {
          // Default to nanobanana, then seedream, then flux, then the first model
          const defaultModel = uniqueModels.find(m => m.name.toLowerCase() === 'nanobanana') || uniqueModels.find(m => m.name.toLowerCase() === 'seedream') || uniqueModels.find(m => m.id.toLowerCase() === 'flux') || uniqueModels[0];
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
      const multiplier = selectedModel?.name.toLowerCase() === 'seedream' ? resolutionMultiplier : 1;
      setWidth(String(selectedRatio.width * multiplier));
      setHeight(String(selectedRatio.height * multiplier));
    }
  }, [selectedModel, resolutionMultiplier]);
  
  const handleDimensionChange = useCallback((newWidth: string, newHeight: string) => {
      setWidth(newWidth);
      setHeight(newHeight);
      
      const multiplier = selectedModel?.name.toLowerCase() === 'seedream' ? resolutionMultiplier : 1;
      const baseWidth = Number(newWidth) / multiplier;
      const baseHeight = Number(newHeight) / multiplier;

      const matchingRatio = ASPECT_RATIOS.find(r => r.width === baseWidth && r.height === baseHeight);
      setAspectRatio(matchingRatio ? matchingRatio.value : '');
  }, [selectedModel, resolutionMultiplier]);
  
  const handleCheckAndSaveApiKey = async (key: string): Promise<boolean> => {
    // FIX: Corrected typo from setIsCheckingKey to setIsCheckingGeminiKey
    setIsCheckingGeminiKey(true);
    setIsGeminiKeyValid(null);
    const isValid = await checkGeminiApiKey(key);
    setIsGeminiKeyValid(isValid);
    if (isValid) {
      setGeminiApiKey(key);
    }
    // FIX: Corrected typo from setIsCheckingKey to setIsCheckingGeminiKey
    setIsCheckingGeminiKey(false);
    return isValid;
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  
  const handleUseAsSource = useCallback(async (imageDataUrl: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Uploading source image...');
    
    // Make a copy of the old images to delete them after the new one is set.
    const oldImagesToDelete = [...uploadedImages];

    try {
        const res = await fetch(imageDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `source-${Date.now()}.png`, { type: blob.type });

        const newUploadedImage = await uploadImageWithVerification(file);
        setUploadedImages([newUploadedImage]); // Update UI with new image first

        // Attempt to delete the old source image(s) in the background.
        for (const oldImage of oldImagesToDelete) {
          if (oldImage.deleteUrl) {
            deleteImage(oldImage).catch(err => {
              // Deletion failure should not block the user.
              console.warn('Failed to delete old source image, continuing anyway:', err);
            });
          }
        }

        // Scroll to controls for immediate feedback
        if (controlsRef.current) {
            controlsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown upload error.';
        setError(`Failed to set source image: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [uploadedImages, setUploadedImages]);

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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setLastRequestUrl(null);

    let translationUsedFallbackForUI = false;
    let enhancementFailedForUI = false;
    
    try {
      let workingPrompt = basePrompt;
      if (isTranslateEnabled && basePrompt) {
          setLoadingMessage('Translating prompt...');
          const { translatedText, usedFallback } = await translateToEnglishIfNeeded(basePrompt, geminiApiKey);
          workingPrompt = translatedText;
          if (usedFallback && geminiApiKey) {
            translationUsedFallbackForUI = true;
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
      let usePollinationsEnhance = false;

      const isEnhancementDisabled = isImageModelSelected && uploadedImages.length > 0;

      // Logic for enhancement:
      if (isEnhanceEnabled && !isEnhancementDisabled) {
        // Use Gemini for enhancement if a valid key exists.
        if (isGeminiKeyValid && geminiApiKey) {
          setLoadingMessage('Enhancing prompt...');
          const combinedStylePrompt = activeStyles.map(style => style.prompt).join(', ');
          const { enhancedPrompt, enhancementFailed } = await enhancePrompt(promptWithStyle, selectedModel.id, geminiApiKey, combinedStylePrompt);
          promptToUse = enhancedPrompt;
          enhancementFailedForUI = enhancementFailed;
          usePollinationsEnhance = false; 
        } else {
          // Otherwise, use Pollinations' built-in enhancer.
          usePollinationsEnhance = true;
        }
      } else {
        usePollinationsEnhance = false;
      }
      
      setLoadingMessage('Generating your masterpiece...');
      
      let finalSeed = seed;
      if (seedMode === 'random') {
        finalSeed = String(Math.floor(Math.random() * 100000));
        setSeed(finalSeed);
      }

      const roundToMultipleOf8 = (num: number) => Math.round(num / 8) * 8;
      // The multiplier is now accounted for in the width/height state directly.
      const finalWidth = roundToMultipleOf8(Number(width) || 1024);
      const finalHeight = roundToMultipleOf8(Number(height) || 1024);

      const params: PollinationsImageParams = {
        prompt: promptToUse,
        model: selectedModel.id,
        width: finalWidth,
        height: finalHeight,
        seed: finalSeed ? Number(finalSeed) : undefined,
        enhance: usePollinationsEnhance,
        nologo,
        nofeed,
        private: isPrivate,
        safe: isSafeMode,
        negative_prompt: '',
        quality: isHighQuality ? 'high' : undefined,
      };

      if (isImageModelSelected && uploadedImages.length > 0) {
        const imageUrls = uploadedImages.map(img => img.url);
        const invalidUrl = imageUrls.find(url => !url.startsWith('http'));
        if (invalidUrl) {
            setError("Please provide a valid public URL for all images. Upload images if you don't have a URL.");
            setIsLoading(false);
            return;
        }
        params.image = imageUrls;
      }
      
      const onRetryCallback = (attempt: number, maxRetries: number) => {
        setLoadingMessage(`Generation is slow... Retrying (attempt ${attempt}/${maxRetries}).`);
      };

      const { blob, requestUrl } = await generateImage(params, controller.signal, onRetryCallback);
      const imageDataUrl = await blobToDataURL(blob);

      const newHistoryItem: GenerationHistoryItem = {
        id: Date.now(),
        imageDataUrl,
        requestUrl,
        prompt: promptToUse,
        params,
        translationUsedFallback: translationUsedFallbackForUI,
        enhancementFailed: enhancementFailedForUI,
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setActiveHistoryItem(newHistoryItem);

    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Generation cancelled by user.');
      } else {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred during generation: ${errorMessage}. Please check the console for details.`);
        if (e && typeof (e as any).requestUrl === 'string') {
          setLastRequestUrl((e as any).requestUrl);
        }
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      abortControllerRef.current = null;
    }
  }, [prompt, selectedModel, selectedStyles, width, height, seed, seedMode, isEnhanceEnabled, isTranslateEnabled, nologo, nofeed, isPrivate, isSafeMode, setHistory, geminiApiKey, isGeminiKeyValid, uploadedImages, isImageModelSelected, isHighQuality, resolutionMultiplier]);
  
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
      isPrivate,
      images: isImageModelSelected ? uploadedImages : undefined,
      resolutionMultiplier: selectedModel?.name.toLowerCase() === 'seedream' ? resolutionMultiplier : undefined,
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
    setUploadedImages(preset.images || []);

    if (model?.name.toLowerCase() === 'seedream' && preset.resolutionMultiplier) {
      setResolutionMultiplier(preset.resolutionMultiplier);
    } else {
      setResolutionMultiplier(1);
    }
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
  
  const handleAddNewImage = (url: string) => {
    setImageToEditBeforeUpload(url);
  };

  const handleEditImage = (index: number) => {
    if (uploadedImages[index]) {
      setEditingImage({ index, url: uploadedImages[index].url });
    }
  };

  const handleSaveAndUpload = async (imageBlob: Blob) => {
    const isSingleImageModel = selectedModel?.name.toLowerCase() === 'kontext';
    const oldImagesToDelete = (isSingleImageModel && uploadedImages.length > 0) ? [...uploadedImages] : [];

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Uploading image...');

    try {
        const extension = imageBlob.type.split('/')[1] || 'png';
        const file = new File([imageBlob], `source-${Date.now()}.${extension}`, { type: imageBlob.type });

        const newUploadedImage = await uploadImageWithVerification(file);

        if (isSingleImageModel) {
            setUploadedImages([newUploadedImage]);
        } else {
            setUploadedImages(prev => [...prev, newUploadedImage]);
        }
        
        for (const oldImage of oldImagesToDelete) {
          if (oldImage.deleteUrl) {
            deleteImage(oldImage).catch(err => {
              console.warn('Failed to delete old source image after adding new one:', err);
            });
          }
        }
        // Close modal on success
        setImageToEditBeforeUpload(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown upload error.';
        // On error, do not close the modal, show an alert instead.
        alert(`Failed to save and upload image: ${errorMessage}`);
        setError(`Failed to save and upload image: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const handleEditorSave = async (imageBlob: Blob) => {
    if (!editingImage) return;

    const originalIndex = editingImage.index;
    const oldImageToDelete = uploadedImages[originalIndex];

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Uploading edited image...');

    try {
        const extension = imageBlob.type.split('/')[1] || 'png';
        const file = new File([imageBlob], `edited-${Date.now()}.${extension}`, { type: imageBlob.type });

        const newUploadedImage = await uploadImageWithVerification(file);

        setUploadedImages(prev => {
            const updated = [...prev];
            updated[originalIndex] = newUploadedImage;
            return updated;
        });

        // Delete the old image in the background, don't wait for it
        if (oldImageToDelete?.deleteUrl) {
            deleteImage(oldImageToDelete).catch(err => {
                console.warn('Failed to delete old source image after edit, continuing anyway:', err);
            });
        }
        // Close modal on success
        setEditingImage(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown upload error.';
        // On error, do not close the modal, show an alert instead.
        alert(`Failed to save edited image: ${errorMessage}`);
        setError(`Failed to save edited image: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
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

  const isEditingNew = !!imageToEditBeforeUpload;
  const editorImageUrl = imageToEditBeforeUpload || editingImage?.url;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-8">
        <aside ref={controlsRef} className="lg:w-5/12 xl:w-1/3 flex flex-col gap-6">
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
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
            onAddNewImage={handleAddNewImage}
            onEditImage={handleEditImage}
            showHighQuality={showHighQuality}
            isHighQuality={isHighQuality}
            setIsHighQuality={setIsHighQuality}
            resolutionMultiplier={resolutionMultiplier}
            setResolutionMultiplier={setResolutionMultiplier}
          />
        </aside>
        <section className="flex-grow lg:w-7/12 xl:w-2/3">
          <ImageDisplay
            activeHistoryItem={activeHistoryItem}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
            lastRequestUrl={lastRequestUrl}
            onRetry={error ? handleGenerate : undefined}
            onCancel={isLoading ? handleCancelGeneration : undefined}
            isImageModelSelected={isImageModelSelected}
            onUseAsSource={handleUseAsSource}
          />
           <HistoryGallery
            history={history}
            activeItemId={activeHistoryItem?.id ?? null}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onDownload={handleDownload}
            onView={handleViewHistoryItem}
            isImageModelSelected={isImageModelSelected}
            onUseAsSource={handleUseAsSource}
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
      {editorImageUrl && (
        <ImageEditorModal
          isOpen={true}
          onClose={() => {
            setImageToEditBeforeUpload(null);
            setEditingImage(null);
          }}
          imageUrl={editorImageUrl}
          onSave={isEditingNew ? handleSaveAndUpload : handleEditorSave}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default App;