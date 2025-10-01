import React, { useState, useRef, useEffect } from 'react';
import type { GenerationModel, Style, SelectedStyle, Preset, UploadedImage } from '../types';
import { GenerateIcon, LoadingSpinner, AddTextIcon, DeleteIcon, UpdateIcon, UploadIcon, CloseIcon, CheckIcon, WarningIcon, EditIcon, ChevronDownIcon, CoffeeIcon } from './Icons';
import { ASPECT_RATIO_GROUPS, ASPECT_RATIOS } from '../constants';
import { STYLES } from '../styles';
import { deleteImage } from '../services/imageHostService';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isOpen, onToggle }) => {
  const uniqueId = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <h3 id={`collapsible-header-${uniqueId}`} className="text-base font-semibold text-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-700/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-expanded={isOpen}
          aria-controls={`collapsible-panel-${uniqueId}`}
        >
          <span>{title}</span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      {isOpen && (
        <div 
          id={`collapsible-panel-${uniqueId}`}
          role="region"
          aria-labelledby={`collapsible-header-${uniqueId}`}
          className="px-4 pb-4 animate-fade-in-down"
        >
          {children}
        </div>
      )}
    </div>
  );
};

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
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  onAddNewImage: (url: string) => void;
  onEditImage: (index: number) => void;
  showHighQuality: boolean;
  isHighQuality: boolean;
  setIsHighQuality: (enabled: boolean) => void;
  resolutionMultiplier: number;
  setResolutionMultiplier: (multiplier: number) => void;
}

interface MultiImageUploaderProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDimensionChange: (width: string, height: string) => void;
  selectedModel: GenerationModel | null;
  onEdit: (index: number) => void;
  onAddNewImage: (url: string) => void;
}


const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ uploadedImages, setUploadedImages, onAspectRatioChange, onDimensionChange, selectedModel, onEdit, onAddNewImage }) => {
  const [urlInput, setUrlInput] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const isKontext = selectedModel?.id.toLowerCase() === 'kontext';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploaderRef.current && !uploaderRef.current.contains(event.target as Node)) {
        setActiveImageIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Set aspect ratio based on the *first* image added
    if (uploadedImages.length === 1 && (uploadedImages[0].url.startsWith('http') || uploadedImages[0].url.startsWith('data:image'))) {
        const img = new Image();
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
                // The onAspectRatioChange in App.tsx will now handle the multiplier, so we don't need to call onDimensionChange here
            }
        };
        img.onerror = () => {
            console.warn("Could not load image to determine aspect ratio. This could be due to a CORS policy or an invalid URL.");
        };
        img.src = uploadedImages[0].url;
    }
  }, [uploadedImages, onAspectRatioChange, onDimensionChange]);
    
  const handleRemoveImage = async (indexToRemove: number) => {
    const imageToDelete = uploadedImages[indexToRemove];
    
    // Optimistically update the UI first for a responsive feel.
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));

    // Then, attempt to delete the image from the hosting service in the background.
    if (imageToDelete?.deleteUrl) {
      try {
        await deleteImage(imageToDelete);
      } catch (error) {
        // If deletion fails, log it, but don't bother the user as the image is already gone from the UI.
        console.error("Failed to delete source image from ImgBB, but it has been removed from the UI:", error);
      }
    }
  };


  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const validFile = Array.from(files).find(file => file instanceof File);
    if (!validFile) return;

    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            onAddNewImage(reader.result);
        }
    };
    reader.onerror = (error) => {
        console.error("File reading failed:", error);
        alert('Failed to read the selected file.');
    };
    reader.readAsDataURL(validFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
    // Reset file input to allow uploading the same file again
    if(e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if(url.startsWith('http')) {
        onAddNewImage(url);
        setUrlInput('');
    } else {
        alert('Please enter a valid URL starting with http/https.');
    }
  };
  
  return (
    <div ref={uploaderRef} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-300">Source Image{isKontext ? '' : '(s)'} (URL or Upload)</label>
      
      {uploadedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((image, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square"
                  onClick={() => setActiveImageIndex(prev => prev === index ? null : index)}
                >
                    <img src={image.url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md cursor-pointer"/>
                    <div 
                      className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-2 ${activeImageIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => onEdit(index)}
                        className="p-2 bg-gray-900/70 text-gray-200 hover:text-white rounded-full transition-colors"
                        title="Edit image"
                        aria-label="Edit image"
                      >
                          <EditIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-gray-900/70 text-red-400 hover:text-red-300 rounded-full transition-colors"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                          <CloseIcon className="w-5 h-5" />
                      </button>
                    </div>
                </div>
            ))}
          </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste an image URL..."
          className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          aria-label="Source image URL for image-to-image models"
        />
        <button 
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-3 py-2 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      <div 
        className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple={false}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
            <UploadIcon className="w-8 h-8 text-gray-500" />
            <p className="text-sm text-gray-400">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Image will open in editor before use</p>
        </div>
      </div>
      <p className="text-xs text-yellow-400/80 text-center mt-1 px-4">
        <span className="uppercase font-semibold block">Images are uploaded to ImgBB for processing. Do not upload confidential data.</span>
        <span className="block mt-1">Clicking '×' on an image permanently deletes it from ImgBB.</span>
      </p>
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
  uploadedImages,
  setUploadedImages,
  onAddNewImage,
  onEditImage,
  showHighQuality,
  isHighQuality,
  setIsHighQuality,
  resolutionMultiplier,
  setResolutionMultiplier,
}) => {
  const oneToOneRatio = ASPECT_RATIO_GROUPS.landscape.find(r => r.value === '1:1');
  const landscapeRatios = ASPECT_RATIO_GROUPS.landscape.filter(r => r.value !== '1:1');
  const portraitRatios = ASPECT_RATIO_GROUPS.portrait;
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [localApiKey, setLocalApiKey] = useState(geminiApiKey);
  const prevMultiplierRef = useRef(resolutionMultiplier);

  interface PanelState {
    idea: boolean;
    styles: boolean;
    model: boolean;
    presets: boolean;
    gemini: boolean;
    advanced: boolean;
  }
  const [panelsOpen, setPanelsOpen] = useLocalStorage<PanelState>('prompt-panels-open', {
    idea: true,
    styles: true,
    model: true,
    presets: true,
    gemini: true,
    advanced: true,
  });

  const togglePanel = (panel: keyof PanelState) => {
    setPanelsOpen(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  useEffect(() => {
    prevMultiplierRef.current = resolutionMultiplier;
  }, [resolutionMultiplier]);

  useEffect(() => {
    setLocalApiKey(geminiApiKey);
  }, [geminiApiKey]);

  const handleApiKeySave = () => {
    onCheckAndSaveApiKey(localApiKey);
  };
  
  const handleMultiplierChange = (newMultiplier: number) => {
    const prevMultiplier = prevMultiplierRef.current || 1;
    const currentWidth = Number(width);
    const currentHeight = Number(height);

    const baseWidth = currentWidth / prevMultiplier;
    const baseHeight = currentHeight / prevMultiplier;
    
    const newWidth = String(Math.round(baseWidth * newMultiplier));
    const newHeight = String(Math.round(baseHeight * newMultiplier));

    onDimensionChange(newWidth, newHeight);
    setResolutionMultiplier(newMultiplier);
  };

  const isImageModelSelected = selectedModel ? ['kontext', 'nanobanana', 'seedream'].includes(selectedModel.name.toLowerCase()) : false;
  
  const promptPlaceholder =
    isImageModelSelected
      ? 'Describe what you want to create, or what to change in the uploaded image(s)'
      : 'e.g., A majestic lion wearing a crown in a futuristic city';

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
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 flex flex-col h-full overflow-hidden">
      <div className="flex-grow overflow-y-auto">
        <CollapsibleSection title="1. Enter Your Idea" isOpen={panelsOpen.idea} onToggle={() => togglePanel('idea')}>
          <div className="flex flex-col gap-4">
            <div>
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
            {isImageModelSelected && (
              <MultiImageUploader 
                uploadedImages={uploadedImages} 
                setUploadedImages={setUploadedImages}
                onAspectRatioChange={onAspectRatioChange}
                onDimensionChange={onDimensionChange}
                selectedModel={selectedModel}
                onEdit={onEditImage}
                onAddNewImage={onAddNewImage}
              />
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="2. Choose Style(s)" isOpen={panelsOpen.styles} onToggle={() => togglePanel('styles')}>
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
        </CollapsibleSection>

        <CollapsibleSection title="3. Choose a Model" isOpen={panelsOpen.model} onToggle={() => togglePanel('model')}>
          <div className="flex items-center gap-2">
            <select
              id="model"
              value={selectedModel?.id || ''}
              onChange={(e) => {
                const model = models.find(m => m.id === e.target.value);
                if (model) setSelectedModel(model);
              }}
              disabled={modelsLoading || !!modelsError}
              className="flex-grow w-full bg-gray-900/80 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
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
            {selectedModel?.name.toLowerCase() === 'seedream' && (
              <select
                value={resolutionMultiplier}
                onChange={(e) => handleMultiplierChange(Number(e.target.value))}
                className="bg-gray-900/80 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                aria-label="Select resolution multiplier"
              >
                <option value={1}>1k</option>
                <option value={2}>2k</option>
                <option value={4}>4k</option>
              </select>
            )}
          </div>
          {modelsError && <p className="text-xs text-red-400 mt-1">{modelsError}</p>}
        </CollapsibleSection>

        <CollapsibleSection title="4. Presets" isOpen={panelsOpen.presets} onToggle={() => togglePanel('presets')}>
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
        </CollapsibleSection>
        
        <CollapsibleSection title="Gemini API Key" isOpen={panelsOpen.gemini} onToggle={() => togglePanel('gemini')}>
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
                Provide your own Gemini API key to enable faster, higher-quality prompt enhancement and translation.
            </p>
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full bg-gray-900/80 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                    aria-label="Gemini API Key"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isCheckingGeminiKey ? (
                    <LoadingSpinner className="w-5 h-5 text-gray-400" />
                    ) : isGeminiKeyValid === true ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                    ) : isGeminiKeyValid === false && geminiApiKey ? (
                    <WarningIcon className="w-5 h-5 text-red-400" />
                    ) : null}
                </div>
                </div>
                <button
                onClick={handleApiKeySave}
                disabled={isCheckingGeminiKey || localApiKey === geminiApiKey}
                className="px-4 py-2 text-sm bg-indigo-600/50 hover:bg-indigo-600/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isCheckingGeminiKey ? 'Checking...' : 'Save'}
                </button>
            </div>
            {isGeminiKeyValid === false && geminiApiKey && !isCheckingGeminiKey && (
                <p className="text-xs text-red-400 mt-2">The provided API key is invalid.</p>
            )}
            {isGeminiKeyValid === true && (
                <p className="text-xs text-green-400 mt-2">Gemini API key is valid and saved.</p>
            )}
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Advanced Settings" isOpen={panelsOpen.advanced} onToggle={() => togglePanel('advanced')}>
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
                disabled={isImageModelSelected && uploadedImages.length > 0}
                tooltip={
                  (isImageModelSelected && uploadedImages.length > 0)
                    ? "Enhancement is disabled when a source image is provided for an image model."
                    : "Enhances prompt for better results. Uses Gemini API if a key is provided, otherwise uses Pollinations' built-in enhancer."
                }
              />
              <Toggle label="Safe Mode" id="safe-mode-toggle" checked={isSafeMode} onChange={setIsSafeMode} />
              <Toggle label="No Logo" id="nologo-toggle" checked={nologo} onChange={setNologo} />
              <Toggle label="Exclude from Feed" id="nofeed-toggle" checked={nofeed} onChange={setNofeed} />
              <Toggle label="Private Image" id="private-toggle" checked={isPrivate} onChange={setIsPrivate} />
              {showHighQuality && (
                <Toggle label="High Quality" id="high-quality-toggle" checked={isHighQuality} onChange={setIsHighQuality} />
              )}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className="mt-auto p-6 border-t border-gray-700/50 flex-shrink-0">
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
        <a
          href="https://boosty.to/ko16aska"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
        >
          <CoffeeIcon className="w-4 h-4" />
          <span>Buy me a coffee</span>
        </a>
      </div>
    </div>
  );
};