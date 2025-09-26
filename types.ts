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
  image?: string | string[];
  negative_prompt?: string;
  quality?: string;
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

export interface UploadedImage {
  url: string;
  deleteUrl?: string;
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
  images?: UploadedImage[];
  resolutionMultiplier?: number;
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

// --- Image Editor Types ---

export type Tool = 'brush' | 'eraser' | 'move' | 'crop' | 'text' | 'rectangle';

export type InteractionType =
  | 'draw'
  | 'move'
  | 'transform-tl' | 'transform-t' | 'transform-tr'
  | 'transform-l' | 'transform-r'
  | 'transform-bl' | 'transform-b' | 'transform-br'
  | 'crop-move'
  | 'crop-t'
  | 'crop-b'
  | 'crop-l'
  | 'crop-r'
  | 'crop-tl'
  | 'crop-tr'
  | 'crop-bl'
  | 'crop-br'
  | 'pan'
  | 'pinch'
  | 'draw-rect';

export interface Layer {
  id: number;
  name: string;
  canvas: HTMLCanvasElement;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteractionState {
  type: InteractionType;
  layerId?: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  original: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  strokeBounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  initialPinch?: {
    dist: number;
    zoom: number;
  };
  snapshot?: ImageData;
  snapshotCanvas?: HTMLCanvasElement;
  strokePoints?: { x: number; y: number }[];
}

export interface TextPromptState {
  visible: boolean;
  value: string;
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}