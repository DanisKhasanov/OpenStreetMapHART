import React, { useEffect, useRef, useState } from 'react';
import { Map as OlMap, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { MapProps } from '../types/geo';
import { APP_CONFIG } from '../utils/constants';
import { processGeoData, removeDataLayers, createVectorLayer } from '../utils/mapUtils';
import { handleFeatureClick, handlePointerMove } from '../utils/eventUtils';
import styles from '../styles/Map.module.css';

const Map = ({ onFeatureClick, uploadedFeatures }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const hoveredFeatureRef = useRef<any>(null);
  const [map, setMap] = useState<OlMap | null>(null);

  // Инициализация карты
  useEffect(() => {
    const dushanbeCenter = fromLonLat(APP_CONFIG.MAP_CENTER);

    const newMap = new OlMap({
      target: mapRef.current!,
      layers: [
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
      removeDataLayers(map);

      // Обрабатываем геоданные и создаем векторный слой
      const features = processGeoData(uploadedFeatures);
      const vectorLayer = createVectorLayer(features);
      
      // Добавляем слой на карту
      map.addLayer(vectorLayer);

      // Добавляем обработчики событий
      map.on('click', (event: any) => handleFeatureClick(event, map, onFeatureClick));
      map.on('pointermove', (event: any) => handlePointerMove(event, map, hoveredFeatureRef));
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
