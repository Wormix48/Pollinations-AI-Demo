import React, { useState, useRef, useEffect } from 'react';
import type { GenerationModel, Style, SelectedStyle, Preset } from '../types';
import { GenerateIcon, LoadingSpinner, AddTextIcon, DeleteIcon, UpdateIcon, UploadIcon, CloseIcon } from './Icons';
import { ASPECT_RATIO_GROUPS, ASPECT_RATIOS } from '../constants';
import { STYLES } from '../styles';

interface PromptControlsProps {
  prompt: string;
  setPrompt: (prompt: string | ((prevPrompt: string) => string)) => void;
  models: GenerationModel[];
  modelsLoading: boolean;
  modelsError: string | null;
  selectedModel: GenerationModel | null;
  setSelectedModel: (model: GenerationModel) => void;
  selectedStyles: SelectedStyle[];
  setSelectedStyles: (styles: SelectedStyle[]) => void;
  isEnhanceEnabled: boolean;
  setIsEnhanceEnabled: (enabled: boolean) => void;
  isTranslateEnabled: boolean;
  setIsTranslateEnabled: (enabled: boolean) => void;
  isLoading: boolean;
  onGenerate: () => void;
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  width: string;
  height: string;
  onDimensionChange: (width: string, height: string) => void;
  seed: string;
  setSeed: (seed: string) => void;
  seedMode: 'random' | 'manual';
  setSeedMode: (mode: 'random' | 'manual') => void;
  nologo: boolean;
  setNologo: (enabled: boolean) => void;
  nofeed: boolean;
  setNofeed: (enabled: boolean) => void;
  isPrivate: boolean;
  setIsPrivate: (enabled: boolean) => void;
  isSafeMode: boolean;
  setIsSafeMode: (enabled: boolean) => void;
  presets: Preset[];
  selectedPreset: string;
  onSelectedPresetChange: (name: string) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  geminiApiKey: string;
  isGeminiKeyValid: boolean | null;
  isCheckingGeminiKey: boolean;
  onCheckAndSaveApiKey: (key: string) => Promise<boolean>;
  imageUrl: string;
  setImageUrl: (url: string) => void;
}

const KontextImageUploader: React.FC<{
  imageUrl: string;
  setImageUrl: (url: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDimensionChange: (width: string, height: string) => void;
}> = ({ imageUrl, setImageUrl, onAspectRatioChange, onDimensionChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))) {
        const img = new Image();
        // Attempt to avoid CORS issues for getting dimensions from external URLs
        img.crossOrigin = "Anonymous"; 
        
        img.onload = () => {
            const { naturalWidth, naturalHeight } = img;
            if (naturalWidth > 0 && naturalHeight > 0) {
                const imageRatio = naturalWidth / naturalHeight;
                let bestMatch = ASPECT_RATIOS[0];
                let minDiff = Infinity;

                ASPECT_RATIOS.forEach(ratioOption => {
                    const optionRatio = ratioOption.width / ratioOption.height;
                    const diff = Math.abs(imageRatio - optionRatio);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestMatch = ratioOption;
                    }
                });

                onAspectRatioChange(bestMatch.value);
                onDimensionChange(String(bestMatch.width), String(bestMatch.height));
            }
        };
        img.onerror = () => {
            console.warn("Could not load image to determine aspect ratio. This could be due to a CORS policy or an invalid URL.");
        };
        img.src = imageUrl;
    }
  }, [imageUrl, onAspectRatioChange, onDimensionChange]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }

    const MAX_FILE_SIZE_MB = 10;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(`File is too large. Please select an image under ${MAX_FILE_SIZE_MB}MB.`);
        return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', file);
    const IMGUR_CLIENT_ID = '546c25a59c58ad7';

    try {
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImageUrl(data.data.link);
      } else {
        const errorMessage = data?.data?.error || `HTTP error ${response.status}`;
        throw new Error(`Upload failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       if (errorMessage.toLowerCase().includes('failed to fetch')) {
          setUploadError('Upload failed: Could not connect to the image host. This can be a network issue, CORS block, or the service may be down.');
      } else {
          setUploadError(`Upload failed: ${errorMessage}`);
      }
      setImageUrl('');
    } finally {
      setIsUploading(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">Kontext Image (URL or Upload)</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://... or upload an image"
          className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Kontext source image URL"
        />
        {imageUrl && (
            <button 
              onClick={() => setImageUrl('')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Clear image"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
        )}
      </div>

      <div 
        className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
                <LoadingSpinner className="w-8 h-8 text-indigo-400" />
                <p className="text-sm text-gray-400">Uploading to Imgur...</p>
            </div>
        ) : imageUrl ? (
            <img src={imageUrl} alt="Preview" className="max-h-32 mx-auto rounded-md" />
        ) : (
            <div className="flex flex-col items-center justify-center gap-2">
                <UploadIcon className="w-8 h-8 text-gray-500" />
                <p className="text-sm text-gray-400">
                    <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF (Max 10MB)</p>
            </div>
        )}
      </div>
      <p className="text-xs text-yellow-400/80 uppercase font-semibold text-center mt-2 px-4">
        Your image will be uploaded to Imgur for the model to process. Please do not upload confidential data.
      </p>
      {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
    </div>
  );
};


const DragHandleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zM13 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
  </svg>
);

const StyleSelector: React.FC<{
  item: SelectedStyle;
  onSelect: (style: Style | null) => void;
  onRemove: () => void;
  onCopyToPrompt: () => void;
  canRemove: boolean;
  isDraggable: boolean;
  dndProps: any;
}> = ({ item, onSelect, onRemove, onCopyToPrompt, canRemove, isDraggable, dndProps }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredStyles = STYLES.filter(style => style.name.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2" {...dndProps}>
      {isDraggable && <DragHandleIcon className="w-5 h-5 text-gray-500 cursor-grab active:cursor-grabbing" />}
      <div className="relative flex-grow min-w-0" ref={dropdownRef}>
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-3 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-left flex justify-between items-center"
            aria-haspopup="listbox" aria-expanded={isOpen}
          >
            <span className="">{item.style ? item.style.name : 'Select a style...'}</span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
        {isOpen && (
           <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg">
              <div className="p-2">
                  <input type="text" placeholder="Search styles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <ul className="max-h-60 overflow-y-auto" role="listbox">
                  <li className="px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600 hover:text-white cursor-pointer" onClick={() => { onSelect(null); setIsOpen(false); setSearchTerm(''); }} role="option">None</li>
                  {filteredStyles.map(style => (
                    <li key={style.name} className="px-4 py-2 text-sm text-gray-300 hover:bg-indigo-600 hover:text-white cursor-pointer truncate" onClick={() => { onSelect(style); setIsOpen(false); setSearchTerm(''); }} role="option" aria-selected={item.style?.name === style.name} title={style.name}>
                      {style.name}
                    </li>
                  ))}
              </ul>
            </div>
        )}
      </div>
      {item.style && (
        <button
          onClick={onCopyToPrompt}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Add style to prompt text"
          aria-label="Add style to prompt text"
        >
          <AddTextIcon className="w-5 h-5" />
        </button>
      )}
      {canRemove && <button onClick={onRemove} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">&ndash;</button>}
    </div>
  );
};


const Toggle: React.FC<{
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: string;
}> = ({ label, id, checked, onChange, disabled = false, tooltip }) => (
  <div className="flex items-center justify-between" title={tooltip}>
    <label htmlFor={id} className={`text-sm font-medium transition-colors ${disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 cursor-pointer'}`}>
      {label}
    </label>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
        disabled
          ? 'bg-gray-700 cursor-not-allowed'
          : checked
          ? 'bg-indigo-600'
          : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        } ${disabled ? 'bg-gray-400' : 'bg-white'}`}
      />
    </button>
  </div>
);

const AspectRatioButton: React.FC<{
    ratio: { label: string; value: string };
    currentRatio: string;
    onClick: (value: string) => void;
}> = ({ ratio, currentRatio, onClick }) => (
    <button 
      key={ratio.value} 
      onClick={() => onClick(ratio.value)}
      className={`text-xs w-full font-semibold p-2 rounded-md transition-colors duration-200 border ${
        currentRatio === ratio.value 
          ? 'bg-indigo-600 border-indigo-500 text-white' 
          : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
      }`}
      aria-label={`Set aspect ratio to ${ratio.label}`}
    >
      {ratio.label}
    </button>
);


export const PromptControls: React.FC<PromptControlsProps> = ({
  prompt,
  setPrompt,
  models,
  modelsLoading,
  modelsError,
  selectedModel,
  setSelectedModel,
  selectedStyles,
  setSelectedStyles,
  isEnhanceEnabled,
  setIsEnhanceEnabled,
  isTranslateEnabled,
  setIsTranslateEnabled,
  isLoading,
  onGenerate,
  aspectRatio,
  onAspectRatioChange,
  width,
  height,
  onDimensionChange,
  seed,
  setSeed,
  seedMode,
  setSeedMode,
  nologo,
  setNologo,
  nofeed,
  setNofeed,
  isPrivate,
  setIsPrivate,
  isSafeMode,
  setIsSafeMode,
  presets,
  selectedPreset,
  onSelectedPresetChange,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  geminiApiKey,
  isGeminiKeyValid,
  isCheckingGeminiKey,
  onCheckAndSaveApiKey,
  imageUrl,
  setImageUrl,
}) => {
  const oneToOneRatio = ASPECT_RATIO_GROUPS.landscape.find(r => r.value === '1:1');
  const landscapeRatios = ASPECT_RATIO_GROUPS.landscape.filter(r => r.value !== '1:1');
  const portraitRatios = ASPECT_RATIO_GROUPS.portrait;
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  const promptPlaceholder =
    selectedModel?.id === 'kontext'
      ? 'Describe what you want to CHANGE in the uploaded image, e.g., "make the cat blue"'
      : 'e.g., A majestic lion wearing a crown in a futuristic city';

  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const handleApiKeyCheck = async () => {
    await onCheckAndSaveApiKey(apiKeyInput);
  };
  
  const getApiKeyStatus = () => {
    if (isCheckingGeminiKey) return { text: "Checking...", color: "text-yellow-400" };
    if (isGeminiKeyValid === true) return { text: "Key is valid and saved.", color: "text-green-400" };
    if (isGeminiKeyValid === false) {
      if (geminiApiKey || apiKeyInput) {
        return { text: "Key is invalid or failed check.", color: "text-red-400" };
      }
      return { text: "A valid Gemini API Key is required for enhancement/translation.", color: "text-gray-400" };
    }
    return { text: "Key status is unknown.", color: "text-gray-400" };
  };
  const apiKeyStatus = getApiKeyStatus();


  const handleAddStyle = () => {
    if (selectedStyles.length < 3) {
      setSelectedStyles([...selectedStyles, { id: Date.now(), style: null }]);
    }
  };

  const handleRemoveStyle = (id: number) => {
    const newStyles = selectedStyles.filter(item => item.id !== id);
    if (newStyles.length === 0) {
      // Always keep at least one selector, just reset it
      setSelectedStyles([{ id: Date.now(), style: null }]);
    } else {
      setSelectedStyles(newStyles);
    }
  };
  
  const handleSelectStyle = (id: number, style: Style | null) => {
    setSelectedStyles(selectedStyles.map(item => item.id === id ? { ...item, style } : item));
  };

  const handleCopyStyleToPrompt = (id: number, styleToCopy: Style) => {
    setPrompt(currentPrompt => {
      const trimmedPrompt = currentPrompt.trim();
      if (trimmedPrompt) {
        // Avoid adding comma if prompt ends with one, then add the style prompt
        return `${trimmedPrompt.replace(/,$/, '')}, ${styleToCopy.prompt}`;
      }
      return styleToCopy.prompt;
    });

    // Reset or remove the style selector after copying
    if (selectedStyles.length <= 1) {
      setSelectedStyles([{ id: Date.now(), style: null }]);
    } else {
      setSelectedStyles(selectedStyles.filter(item => item.id !== id));
    }
  };

  const handleDragSort = () => {
      if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
      };
      const newStyles = [...selectedStyles];
      const draggedItemContent = newStyles.splice(dragItem.current, 1)[0];
      newStyles.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setSelectedStyles(newStyles);
  };
  
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col gap-4 h-full">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            1. Enter Your Idea
          </label>
          <div className="relative">
            <textarea
              id="prompt"
              rows={5}
              className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none placeholder-gray-500"
              placeholder={promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              aria-label="Image generation prompt"
            />
          </div>
        </div>
        
        {selectedModel?.id === 'kontext' && (
          <KontextImageUploader 
            imageUrl={imageUrl} 
            setImageUrl={setImageUrl}
            onAspectRatioChange={onAspectRatioChange}
            onDimensionChange={onDimensionChange}
          />
        )}

        <div>
           <label className="block text-sm font-medium text-gray-300 mb-2">
            2. Choose Style(s) (Optional)
          </label>
          <div className="flex flex-col gap-3">
            {selectedStyles.map((item, index) => (
               <StyleSelector
                  key={item.id}
                  item={item}
                  onSelect={(style) => handleSelectStyle(item.id, style)}
                  onRemove={() => handleRemoveStyle(item.id)}
                  onCopyToPrompt={() => {
                    if (item.style) {
                      handleCopyStyleToPrompt(item.id, item.style);
                    }
                  }}
                  canRemove={selectedStyles.length > 0}
                  isDraggable={selectedStyles.length > 1}
                  dndProps={{
                    draggable: selectedStyles.length > 1,
                    onDragStart: () => (dragItem.current = index),
                    onDragEnter: () => (dragOverItem.current = index),
                    onDragEnd: handleDragSort,
                    onDragOver: (e: React.DragEvent) => e.preventDefault(),
                  }}
                />
            ))}
             {selectedStyles.length < 3 && (
              <button onClick={handleAddStyle} className="w-full text-sm text-indigo-300 hover:text-indigo-200 p-2 rounded-md hover:bg-indigo-500/10 transition-colors">
                + Add Style
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
            3. Choose a Model
          </label>
          <select
            id="model"
            value={selectedModel?.id || ''}
            onChange={(e) => {
              const model = models.find(m => m.id === e.target.value);
              if (model) setSelectedModel(model);
            }}
            disabled={modelsLoading || !!modelsError}
            className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
            aria-label="Select generation model"
          >
            {modelsLoading ? (
              <option>Loading models...</option>
            ) : modelsError ? (
              <option>Error loading models</option>
            ) : (
              models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))
            )}
          </select>
          {modelsError && <p className="text-xs text-red-400 mt-1">{modelsError}</p>}
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            4. Presets (Save/Load Settings)
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <select
                value={selectedPreset}
                onChange={(e) => onSelectedPresetChange(e.target.value)}
                className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="Select a preset to load"
                disabled={presets.length === 0}
              >
                <option value="">{presets.length > 0 ? 'Select a preset...' : 'No presets saved'}</option>
                {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <button
                onClick={() => onLoadPreset(selectedPreset)}
                disabled={!selectedPreset}
                className="px-3 py-2 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md transition-colors disabled:opacity-50 disabled:bg-indigo-600/20 disabled:cursor-not-allowed"
                title="Load selected preset"
              >
                Load
              </button>
              <button
                onClick={() => onSavePreset(selectedPreset)}
                disabled={!selectedPreset}
                className="p-2 text-gray-400 hover:text-white hover:bg-indigo-500/20 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title="Update selected preset with current settings"
              >
                <UpdateIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDeletePreset(selectedPreset)}
                disabled={!selectedPreset}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                title="Delete selected preset"
              >
                <DeleteIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="New preset name..."
                className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button 
                onClick={() => { onSavePreset(newPresetName); setNewPresetName(''); }}
                className="px-4 py-2 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Gemini API Key</h3>
        <p className="text-xs text-gray-400 mb-3">Required for prompt enhancement and translation features.</p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter your Gemini API Key"
            className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Gemini API Key"
          />
          <button
            onClick={handleApiKeyCheck}
            disabled={isCheckingGeminiKey || !apiKeyInput}
            className="px-3 py-2 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md transition-colors disabled:opacity-50 disabled:bg-indigo-600/20 disabled:cursor-not-allowed"
          >
            {isCheckingGeminiKey ? <LoadingSpinner className="w-5 h-5" /> : 'Check'}
          </button>
        </div>
        <p className={`text-xs mt-2 ${apiKeyStatus.color}`}>{apiKeyStatus.text}</p>
      </div>

      <div className="px-6 py-4 border-t border-b border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Advanced Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Aspect Ratio</label>
            <div className="flex flex-col gap-3 mb-3">
              {oneToOneRatio && (
                 <AspectRatioButton 
                    ratio={oneToOneRatio} 
                    currentRatio={aspectRatio} 
                    onClick={onAspectRatioChange} 
                  />
              )}
              <div className="grid grid-cols-5 gap-2">
                {landscapeRatios.map((landscapeRatio, index) => {
                  const portraitRatio = portraitRatios[index];
                  return (
                    <div key={landscapeRatio.value} className="flex flex-col gap-2">
                      <AspectRatioButton 
                        ratio={landscapeRatio} 
                        currentRatio={aspectRatio} 
                        onClick={onAspectRatioChange} 
                      />
                      {portraitRatio && (
                        <AspectRatioButton 
                          ratio={portraitRatio} 
                          currentRatio={aspectRatio} 
                          onClick={onAspectRatioChange} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                     <input 
                        type="number" 
                        id="width" 
                        value={width} 
                        onChange={(e) => onDimensionChange(e.target.value, height)} 
                        placeholder="Width"
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Image width"
                      />
                </div>
                 <div>
                     <input 
                        type="number" 
                        id="height" 
                        value={height} 
                        onChange={(e) => onDimensionChange(width, e.target.value)} 
                        placeholder="Height"
                        className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Image height"
                      />
                </div>
            </div>
          </div>
          <div>
            <label htmlFor="seed" className="block text-xs font-medium text-gray-400 mb-1">Seed</label>
            <div className="flex items-center gap-2">
               <div className="flex items-center rounded-md bg-gray-900/80 border border-gray-600">
                  <button onClick={() => setSeedMode('random')} className={`px-2 py-1.5 text-xs rounded-l-md ${seedMode === 'random' ? 'bg-indigo-600 text-white' : 'bg-gray-700/50'}`}>Random</button>
                  <button onClick={() => setSeedMode('manual')} className={`px-2 py-1.5 text-xs rounded-r-md ${seedMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-700/50'}`}>Manual</button>
               </div>
              <input 
                type="text" 
                id="seed" 
                value={seed} 
                onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))} 
                disabled={seedMode === 'random'} 
                placeholder={seedMode === 'random' ? 'Randomly generated' : 'Enter a number'}
                className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-800/70 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <Toggle 
              label="Translate prompt to English" 
              id="translate-toggle" 
              checked={isTranslateEnabled} 
              onChange={setIsTranslateEnabled}
              tooltip={!isGeminiKeyValid ? "Uses a public translation service when Gemini API key is not set." : "Uses Gemini API for translation."}
            />
            <Toggle 
              label="Auto-enhance prompt" 
              id="enhance-prompt-toggle" 
              checked={isEnhanceEnabled} 
              onChange={setIsEnhanceEnabled}
              disabled={selectedModel?.id === 'kontext'}
              tooltip={
                selectedModel?.id === 'kontext' 
                  ? "Enhancement is not available for the Kontext model."
                  : "Enhances prompt for better results. Uses Gemini API if a key is provided, otherwise uses Pollinations' built-in enhancer."
              }
            />
            <Toggle label="Safe Mode" id="safe-mode-toggle" checked={isSafeMode} onChange={setIsSafeMode} />
            <Toggle label="No Logo" id="nologo-toggle" checked={nologo} onChange={setNologo} />
            <Toggle label="Exclude from Feed" id="nofeed-toggle" checked={nofeed} onChange={setNofeed} />
            <Toggle label="Private Image" id="private-toggle" checked={isPrivate} onChange={setIsPrivate} />
          </div>
        </div>
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={onGenerate}
          disabled={isLoading || modelsLoading || (!prompt.trim() && selectedStyles.every(item => item.style === null)) || !selectedModel}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5" />
              <span>Generating...</span>
            </>
          ) : (
             <>
              <GenerateIcon className="w-5 h-5" />
              <span>Generate Image</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};