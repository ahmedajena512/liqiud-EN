
export interface PredictionInput {
  image: string; // Data URI or URL
  scale: number; // 1-10
  face_enhance: boolean;
}

export interface PredictionMetrics {
  predict_time?: number;
}

export interface PredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | null;
  error?: string | null;
  metrics?: PredictionMetrics;
  logs?: string;
}

export interface AppState {
  inputImage: string | null;
  outputImage: string | null;
  inputDimensions: { width: number; height: number } | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  errorMsg: string | null;
  predictionId: string | null;
  estimatedTime: number;
}

export enum ScalePreset {
  Small = 2,
  Medium = 4,
  Large = 8
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalImage: string;
  enhancedImage: string;
  dimensions: { width: number; height: number };
  params: {
    scale: number;
    faceEnhance: boolean;
  };
}
