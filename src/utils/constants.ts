// Константы приложения
export const APP_CONFIG = {
  MAP_CENTER: [68.787, 38.5358] as [number, number],
  DEFAULT_ZOOM: 12,
  SUPPORTED_FORMATS: ['.json', '.geojson', '.kml', '.kmz'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_COLOR: '#667eea',
} as const;

