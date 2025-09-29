// Константы приложения
export const APP_CONFIG = {
  MAP_CENTER: [68.787, 38.5358] as [number, number],
  DEFAULT_ZOOM: 12,
  SUPPORTED_FORMATS: ['.json', '.geojson', '.kml', '.kmz'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  DEFAULT_COLOR: '#667eea',
} as const;

// Свойства OpenLayers, которые нужно исключить из отображения
export const OPENLAYERS_PROPS = [
  'geometry', 'disposed', 'eventTarget_', 'pendingRemovals_', 'dispatching_',
  'listeners_', 'revision_', 'ol_uid', 'values_', 'extent_', 'extentRevision_',
  'simplifiedGeometryMaxMinSquaredTolerance', 'simplifiedGeometryRevision',
  'simplifyTransformedInternal', 'layout', 'stride', 'flatCoordinates',
  'on', 'once', 'un', 'get', 'set', 'getKeys', 'getValues', 'forEach'
] as const;

// Правила валидации файлов
export const FILE_VALIDATION_RULES = {
  REQUIRED_FIELDS: {
    GEOJSON: ['type'],
    FEATURE_COLLECTION: ['type', 'features'],
    FEATURE: ['type', 'geometry']
  },
  ERROR_MESSAGES: {
    INVALID_STRUCTURE: 'Неверная структура GeoJSON файла',
    MISSING_FEATURES: 'FeatureCollection должен содержать массив features',
    MISSING_GEOMETRY: 'Feature должен содержать geometry',
    UNSUPPORTED_FORMAT: 'Неподдерживаемый формат файла',
    KML_NOT_FOUND: 'KML файл не найден в KMZ архиве',
    KML_PARSE_ERROR: 'Ошибка при парсинге KML файла',
    KMZ_EXTRACT_ERROR: 'Ошибка при распаковке KMZ файла'
  }
} as const;

