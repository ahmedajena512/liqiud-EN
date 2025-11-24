import { PredictionInput, PredictionResponse } from '../types';

const API_BASE = '/api'; // Assumes proxy or same-origin in prod

export const api = {
  /**
   * Start a prediction process
   */
  startPrediction: async (input: PredictionInput): Promise<PredictionResponse> => {
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to start prediction');
    }
    return response.json();
  },

  /**
   * Get status of a prediction
   */
  getPredictionStatus: async (id: string): Promise<PredictionResponse> => {
    const response = await fetch(`${API_BASE}/prediction/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }
    return response.json();
  },

  /**
   * Edit image (Zoom/Aspect Ratio) using Gemini
   */
  editImage: async (image: string, zoom: number, aspectRatio: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, zoom, aspectRatio }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to edit image');
    }
    const data = await response.json();
    return data.output;
  }
};