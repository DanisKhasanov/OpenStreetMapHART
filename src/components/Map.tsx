import React, { useEffect, useRef, useState } from 'react';
import { Map as OlMap, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { MapProps } from '../types/geo';
import { APP_CONFIG } from '../utils/constants';
import styles from '../styles/Map.module.css';

const Map: React.FC<MapProps> = ({ onFeatureClick, uploadedFeatures }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<OlMap | null>(null);

  useEffect(() => {
    // Координаты центра Душанбе
    const dushanbeCenter = fromLonLat(APP_CONFIG.MAP_CENTER);

    // Создание карты
    const newMap = new OlMap({
      target: mapRef.current!,
      layers: [
        // Базовый слой OpenStreetMap
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: dushanbeCenter,
        zoom: APP_CONFIG.DEFAULT_ZOOM,
      }),
    });

    setMap(newMap);


    return () => {
      if (newMap) {
        newMap.setTarget(undefined);
      }
    };
  }, []);

  // Обработка загруженных геоданных
  useEffect(() => {
    if (map && uploadedFeatures.length > 0) {
      // Удаляем предыдущие слои с данными
      const layersToRemove = map.getLayers().getArray().filter(layer => 
        layer.get('name') === 'uploaded-data'
      );
      layersToRemove.forEach(layer => map.removeLayer(layer));

      // Создаем новый слой с загруженными данными
      const geoJsonFormat = new GeoJSON();
      const features = uploadedFeatures.flatMap(geoData => {
        try {
          if (geoData.type === 'FeatureCollection') {
            return geoJsonFormat.readFeatures(geoData, {
              featureProjection: 'EPSG:3857'
            });
          } else if (geoData.type === 'Feature') {
            return geoJsonFormat.readFeatures({
              type: 'FeatureCollection',
              features: [geoData]
            }, {
              featureProjection: 'EPSG:3857'
            });
          }
          return [];
        } catch (error) {
          return [];
        }
      });

      const vectorSource = new VectorSource({
        features: features
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          const properties = feature.getProperties();
          const color = properties.color || '#ff0000'; // Используем цвет из данных или красный по умолчанию
          
          return new Style({
            fill: new Fill({
              color: `${color}4D`, // Добавляем прозрачность
            }),
            stroke: new Stroke({
              color: '#000000', // Черная обводка для лучшей видимости
              width: 2,
            }),
            image: new CircleStyle({
              radius: 15,
              fill: new Fill({
                color: color,
              }),
              stroke: new Stroke({
                color: '#000000', // Черная обводка для точек
                width: 2,
              }),
            }),
          });
        }
      });
      
      // Добавляем кастомное свойство для идентификации слоя
      (vectorLayer as any).set('name', 'uploaded-data');

      map.addLayer(vectorLayer);

      // Добавляем обработчик клика на фигуры
      map.on('click', (event: any) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features.length > 0) {
          const feature = features[0];
          const allProperties = feature.getProperties();
          
          // Фильтруем только пользовательские свойства
          const userProperties: Record<string, any> = {};
          Object.entries(allProperties).forEach(([key, value]) => {
            // Исключаем служебные свойства OpenLayers
            if (key !== 'geometry' && 
                !key.startsWith('_') && 
                !key.endsWith('_') &&
                typeof value !== 'function' &&
                !(value && typeof value === 'object' && value.ol_uid)) {
              userProperties[key] = value;
            }
          });
          
          onFeatureClick(userProperties);
        }
      });

      // Изменяем курсор при наведении на фигуры
      map.on('pointermove', (event: any) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        const target = map.getTarget() as HTMLElement;
        if (target) {
          target.style.cursor = features.length > 0 ? 'pointer' : '';
        }
      });
    }
  }, [map, uploadedFeatures, onFeatureClick]);

  return (
    <div 
      ref={mapRef} 
      className={styles.mapContainer}
    />
  );
};

export default Map;
