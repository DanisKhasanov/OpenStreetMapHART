import React, { useEffect, useRef, useState } from "react";
import { Map as OlMap, View } from "ol";
import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";
import { MapProps } from "../types/geo";
import { APP_CONFIG } from "../utils/constants";
import {
  processGeoData,
  removeDataLayers,
  createVectorLayer,
} from "../utils/mapUtils";
import { handleFeatureClick, handlePointerMove } from "../utils/eventUtils";
import styles from "../styles/Map.module.css";

const Map = ({ onFeatureClick, uploadedFeatures }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const hoveredFeatureRef = useRef<any>(null);
  const [map, setMap] = useState<OlMap | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(
    APP_CONFIG.DEFAULT_ZOOM
  );

  // Обработчики кнопок зума
  const handleZoomIn = () => {
    if (map) {
      const view = map.getView();
      const currentZoom = view.getZoom() || 0;
      view.animate({ zoom: currentZoom + 1, duration: 300 });
      setCurrentZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const view = map.getView();
      const currentZoom = view.getZoom() || 0;
      view.animate({ zoom: currentZoom - 1, duration: 300 });
      setCurrentZoom(currentZoom - 1);
    }
  };

  const handleResetZoom = () => {
    if (map) {
      const view = map.getView();
      const dushanbeCenter = fromLonLat(APP_CONFIG.MAP_CENTER);
      view.animate({
        center: dushanbeCenter,
        zoom: APP_CONFIG.DEFAULT_ZOOM,
        duration: 500,
      });
      setCurrentZoom(APP_CONFIG.DEFAULT_ZOOM);
    }
  };

  // Инициализация карты
  useEffect(() => {
    const dushanbeCenter = fromLonLat(APP_CONFIG.MAP_CENTER);

    const newMap = new OlMap({
      target: mapRef.current!,
      controls: defaultControls({
        zoom: false, // Отключаем  кнопки зума
        attribution: false, // отключаем атрибуцию
        rotate: false, // Отключаем поворот
      }),
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
      map.on("click", (event: any) =>
        handleFeatureClick(event, map, onFeatureClick)
      );
      map.on("pointermove", (event: any) =>
        handlePointerMove(event, map, hoveredFeatureRef)
      );
    }
  }, [map, uploadedFeatures, onFeatureClick]);

  // Отслеживание изменений зума
  useEffect(() => {
    if (map) {
      const view = map.getView();

      const handleZoomChange = () => {
        const zoom = view.getZoom() || 0;
        setCurrentZoom(Math.round(zoom));
      };

      view.on("change:resolution", handleZoomChange);

      return () => {
        view.un("change:resolution", handleZoomChange);
      };
    }
  }, [map]);

  return (
    <div ref={mapRef} className={styles.mapContainer}>
      {/* Кнопки управления масштабом */}
      <div className={styles.zoomControls}>
        <div className={styles.zoomControlsGroup}>
          <button
            className={`${styles.zoomButton} ${styles.zoomInIcon}`}
            onClick={handleZoomIn}
            title="Увеличить масштаб"
            disabled={currentZoom >= 18}
          />
          <button
            className={`${styles.zoomButton} ${styles.zoomOutIcon}`}
            onClick={handleZoomOut}
            title="Уменьшить масштаб"
            disabled={currentZoom <= 1}
          />
        </div>
        <div className={styles.zoomControlsGroup}>
          <button
            className={`${styles.zoomButton} ${styles.resetZoomButton} ${styles.resetZoomIcon}`}
            onClick={handleResetZoom}
            title="Сбросить масштаб"
          />
        </div>
      </div>
    </div>
  );
};

export default Map;
