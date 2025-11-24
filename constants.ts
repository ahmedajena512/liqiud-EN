export const APP_CONSTANTS = {
  MODEL_NAME: "nightmareai/real-esrgan",
  DEFAULT_SCALE: 4,
  MIN_SCALE: 1,
  MAX_SCALE: 10,
  MAX_FILE_SIZE_MB: 15,
  RECOMMENDED_MAX_RES: 1440, // 1440p
  POLL_INTERVAL_MS: 1500,
  MAX_OUTPUT_PIXELS: 2096704, // User defined limit
};

export const STATUS_MESSAGES = {
  idle: "Ready to enhance",
  uploading: "Uploading image...",
  processing: "Enhancing...",
  completed: "Completed!",
  error: "Error",
};