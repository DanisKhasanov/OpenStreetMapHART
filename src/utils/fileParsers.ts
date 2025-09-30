import JSZip from 'jszip';
import { KML, GeoJSON } from 'ol/format';
import { GeoData } from '../types/geo';
import { FILE_VALIDATION_RULES } from './constants';
import { getErrorMessage } from './validationUtils';

// Парсер KMZ файлов
export const parseKMZ = async (file: File): Promise<GeoData> => {
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    // Ищем KML файл в архиве
    let kmlFile: JSZip.JSZipObject | null = null;
    for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
      if (filename.toLowerCase().endsWith('.kml')) {
        kmlFile = zipEntry;
        break;
      }
    }

    if (!kmlFile) {
      throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.KML_NOT_FOUND);
    }

    const kmlContent = await kmlFile.async('text');
    return parseKMLWithOpenLayers(kmlContent);
  } catch (error) {
    throw new Error(
      getErrorMessage(
        FILE_VALIDATION_RULES.ERROR_MESSAGES.KMZ_EXTRACT_ERROR,
        error
      )
    );
  }
};

// Парсер KML файлов
export const parseKMLWithOpenLayers = (kmlContent: string): GeoData => {
  try {
    const kmlFormat = new KML();
    const features = kmlFormat.readFeatures(kmlContent, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326',
    });

    // Конвертируем features OpenLayers в GeoJSON формат
    const geoJsonFormat = new GeoJSON();
    const geoJsonFeatures = features.map(feature => {
      const properties = feature.getProperties();

      // Удаляем служебные свойства OpenLayers
      const cleanProperties: Record<string, any> = {};
      Object.entries(properties).forEach(([key, value]) => {
        if (
          key !== 'geometry' &&
          !key.startsWith('_') &&
          !key.endsWith('_') &&
          typeof value !== 'function' &&
          !(value && typeof value === 'object' && value.ol_uid)
        ) {
          cleanProperties[key] = value;
        }
      });

      // Убеждаемся, что поле color передается корректно
      if (properties.color) {
        cleanProperties.color = properties.color;
      }

      // Конвертируем feature в GeoJSON используя встроенный форматтер
      const geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
        featureProjection: 'EPSG:4326',
        dataProjection: 'EPSG:4326',
      });

      return {
        ...geoJsonFeature,
        properties: cleanProperties,
        geometry: geoJsonFeature.geometry as any,
      };
    });

    return {
      type: 'FeatureCollection',
      features: geoJsonFeatures,
    };
  } catch (error) {
    throw new Error(
      getErrorMessage(
        FILE_VALIDATION_RULES.ERROR_MESSAGES.KML_PARSE_ERROR,
        error
      )
    );
  }
};
