import { GeoData } from '../types/geo';
import { FILE_VALIDATION_RULES } from './constants';

// Валидация GeoJSON структуры
export const validateGeoData = (geoData: GeoData): void => {
  if (!geoData || !geoData.type) {
    throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.INVALID_STRUCTURE);
  }

  if (geoData.type === "FeatureCollection" && !geoData.features) {
    throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.MISSING_FEATURES);
  }

  if (geoData.type === "Feature" && !geoData.geometry) {
    throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.MISSING_GEOMETRY);
  }
};

// Проверка поддерживаемого формата файла
export const isSupportedFormat = (filename: string): boolean => {
  const supportedExtensions = ['.json', '.geojson', '.kml', '.kmz'];
  return supportedExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Получение сообщения об ошибке с контекстом
export const getErrorMessage = (baseMessage: string, error: unknown): string => {
  return `${baseMessage}: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`;
};
