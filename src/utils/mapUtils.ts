import { Map as OlMap } from 'ol';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { GeoJSON } from 'ol/format';
import { createGeometryStyle } from './styleUtils';

// Обработка загруженных геоданных
export const processGeoData = (uploadedFeatures: any[]): any[] => {
  const geoJsonFormat = new GeoJSON();

  return uploadedFeatures.flatMap(geoData => {
    try {
      if (geoData.type === 'FeatureCollection') {
        return geoJsonFormat.readFeatures(geoData, {
          featureProjection: 'EPSG:3857',
        });
      } else if (geoData.type === 'Feature') {
        return geoJsonFormat.readFeatures(
          {
            type: 'FeatureCollection',
            features: [geoData],
          },
          {
            featureProjection: 'EPSG:3857',
          }
        );
      }
      return [];
    } catch (error) {
      return [];
    }
  });
};

// Фильтрация пользовательских свойств
export const filterUserProperties = (
  allProperties: Record<string, any>
): Record<string, any> => {
  const userProperties: Record<string, any> = {};

  Object.entries(allProperties).forEach(([key, value]) => {
    // Исключаем служебные свойства OpenLayers
    if (
      key !== 'geometry' &&
      !key.startsWith('_') &&
      !key.endsWith('_') &&
      typeof value !== 'function' &&
      !(value && typeof value === 'object' && value.ol_uid)
    ) {
      userProperties[key] = value;
    }
  });

  return userProperties;
};

// Создание векторного слоя
export const createVectorLayer = (
  features: any[]
): VectorLayer<VectorSource> => {
  const vectorSource = new VectorSource({ features });
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: createGeometryStyle,
  });

  // Добавляем кастомное свойство для идентификации слоя
  (vectorLayer as any).set('name', 'uploaded-data');

  return vectorLayer;
};

// Удаление слоев с данными
export const removeDataLayers = (map: OlMap): void => {
  const layersToRemove = map
    .getLayers()
    .getArray()
    .filter(layer => layer.get('name') === 'uploaded-data');
  layersToRemove.forEach(layer => map.removeLayer(layer));
};
