export interface GenerationModel {
  id: string;
  name: string;
}

export interface PollinationsImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  nologo?: boolean;
  nofeed?: boolean;
  private?: boolean;
  safe?: boolean;
}

export interface GenerationResult {
  blob: Blob;
  requestUrl: string;
}

export interface Style {
  name: string;
  prompt: string;
}

export interface SelectedStyle {
  id: number;
  style: Style | null;
}

export interface Preset {
  name: string;
  modelId: string;
  styles: Style[];
  aspectRatio: string;
  width: string;
  height: string;
  seed: string;
  seedMode: 'random' | 'manual';
  isEnhanceEnabled: boolean;
  isTranslateEnabled: boolean;
  isSafeMode: boolean;
  nologo: boolean;
  nofeed: boolean;
  isPrivate: boolean;
}

// FIX: Add missing SavedPrompt interface
export interface SavedPrompt {
  id: number;
  name: string;
  text: string;
}

export interface GenerationHistoryItem {
  id: number;
  imageDataUrl: string;
  requestUrl: string;
  prompt: string;
  params: PollinationsImageParams;
  translationUsedFallback: boolean;
  enhancementFailed: boolean;
}
