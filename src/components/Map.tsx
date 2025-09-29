import React, { useEffect, useRef, useState } from 'react';
import { Map as OlMap, View } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke, Circle as CircleStyle, RegularShape } from 'ol/style';
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
          const color = properties.color || APP_CONFIG.DEFAULT_COLOR; // Используем цвет из данных или синий по умолчанию
          const geometry = feature.getGeometry();
          const geometryType = geometry?.getType();
          
          // Проверяем, является ли цвет белым или очень светлым
          const isWhiteOrLight = color === '#ffffff' || 
                                color === '#fff' || 
                                color === 'white' ||
                                color.toLowerCase() === '#ffffff' ||
                                color.toLowerCase() === '#fff' ||
                                color.toLowerCase() === 'white';
          
          // Создаем стили в зависимости от типа геометрии
          if (geometryType === 'Point') {
            // Стили для точек - используем разные формы в зависимости от свойств
            const pointType = properties.type || properties.category || 'default';
            let imageStyle;
            
            if (pointType === 'landmark' || pointType === 'important') {
              // Звезда для важных точек
              imageStyle = new RegularShape({
                points: 5,
                radius: 10,
                radius2: 5,
                angle: 0,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 4 : 3,
                }),
              });
            } else if (pointType === 'transport' || pointType === 'station') {
              // Квадрат для транспортных точек
              imageStyle = new RegularShape({
                points: 4,
                radius: 8,
                angle: Math.PI / 4,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 4 : 3,
                }),
              });
            } else {
              // Круг для обычных точек
              imageStyle = new CircleStyle({
                radius: 8,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 4 : 3,
                }),
              });
            }
            
            return new Style({
              image: imageStyle,
            });
          } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            // Стили для линий - используем разные стили в зависимости от типа
            const lineType = properties.type || properties.category || 'default';
            let lineDash;
            
            if (lineType === 'route' || lineType === 'path') {
              // Пунктирная линия для маршрутов
              lineDash = [10, 5];
            } else if (lineType === 'border' || lineType === 'boundary') {
              // Двойная пунктирная линия для границ
              lineDash = [15, 5, 5, 5];
            } else {
              // Сплошная линия для обычных линий
              lineDash = undefined;
            }
            
            return new Style({
              stroke: new Stroke({
                color: color,
                width: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineDash: lineDash,
              }),
            });
          } else {
            // Стили для полигонов (Polygon, MultiPolygon)
            const polygonType = properties.type || properties.category || 'default';
            let fillOpacity = '80'; // 50% прозрачность по умолчанию
            let strokeWidth = 3;
            
            if (polygonType === 'important' || polygonType === 'highlight') {
              fillOpacity = '60'; // Менее прозрачный для важных областей
              strokeWidth = 4;
            } else if (polygonType === 'area' || polygonType === 'zone') {
              fillOpacity = '40'; // Более прозрачный для зон
              strokeWidth = 2;
            }
            
            return new Style({
              fill: new Fill({
                color: `${color}${fillOpacity}`,
              }),
              stroke: new Stroke({
                color: isWhiteOrLight ? '#000000' : color,
                width: isWhiteOrLight ? strokeWidth + 1 : strokeWidth,
                lineCap: 'round',
                lineJoin: 'round',
              }),
            });
          }
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

      // Добавляем hover эффекты
      let hoveredFeature: any = null;
      
      map.on('pointermove', (event: any) => {
        const features = map.getFeaturesAtPixel(event.pixel);
        const target = map.getTarget() as HTMLElement;
        
        if (target) {
          target.style.cursor = features.length > 0 ? 'pointer' : '';
        }
        
        // Убираем предыдущий hover эффект
        if (hoveredFeature) {
          hoveredFeature.setStyle(undefined);
          hoveredFeature = null;
        }
        
          // Добавляем hover эффект к текущей фигуре
          if (features.length > 0) {
            hoveredFeature = features[0];
            const properties = hoveredFeature.getProperties();
            const color = properties.color || '#667eea';
            const geometry = hoveredFeature.getGeometry();
            const geometryType = geometry?.getType();
            
            // Проверяем, является ли цвет белым или очень светлым
            const isWhiteOrLight = color === '#ffffff' || 
                                  color === '#fff' || 
                                  color === 'white' ||
                                  color.toLowerCase() === '#ffffff' ||
                                  color.toLowerCase() === '#fff' ||
                                  color.toLowerCase() === 'white';
          
          // Создаем hover стили
          let hoverStyle;
          if (geometryType === 'Point') {
            const pointType = properties.type || properties.category || 'default';
            let imageStyle;
            
            if (pointType === 'landmark' || pointType === 'important') {
              // Увеличенная звезда для hover
              imageStyle = new RegularShape({
                points: 5,
                radius: 14,
                radius2: 7,
                angle: 0,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 5 : 4,
                }),
              });
            } else if (pointType === 'transport' || pointType === 'station') {
              // Увеличенный квадрат для hover
              imageStyle = new RegularShape({
                points: 4,
                radius: 12,
                angle: Math.PI / 4,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 5 : 4,
                }),
              });
            } else {
              // Увеличенный круг для hover
              imageStyle = new CircleStyle({
                radius: 12,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: isWhiteOrLight ? '#000000' : '#ffffff',
                  width: isWhiteOrLight ? 5 : 4,
                }),
              });
            }
            
            hoverStyle = new Style({
              image: imageStyle,
            });
          } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            hoverStyle = new Style({
              stroke: new Stroke({
                color: color,
                width: 6, // Увеличиваем толщину при hover
                lineCap: 'round',
                lineJoin: 'round',
              }),
            });
          } else {
            hoverStyle = new Style({
              fill: new Fill({
                color: `${color}60`, // Менее прозрачный при hover
              }),
              stroke: new Stroke({
                color: isWhiteOrLight ? '#000000' : color,
                width: isWhiteOrLight ? 6 : 5, // Увеличиваем толщину при hover
                lineCap: 'round',
                lineJoin: 'round',
              }),
            });
          }
          
          hoveredFeature.setStyle(hoverStyle);
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
