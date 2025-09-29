import { Map as OlMap } from 'ol';
import { filterUserProperties } from './mapUtils';
import { createHoverStyle } from './styleUtils';

// Обработчик клика на фигуры
export const handleFeatureClick = (
  event: any, 
  map: OlMap, 
  onFeatureClick: (properties: any) => void
): void => {
  const features = map.getFeaturesAtPixel(event.pixel);
  if (features.length > 0) {
    const feature = features[0];
    const allProperties = feature.getProperties();
    const userProperties = filterUserProperties(allProperties);
    onFeatureClick(userProperties);
  }
};

// Обработчик hover эффектов
export const handlePointerMove = (
  event: any, 
  map: OlMap, 
  hoveredFeatureRef: React.MutableRefObject<any>
): void => {
  const features = map.getFeaturesAtPixel(event.pixel);
  const target = map.getTarget() as HTMLElement;
  
  if (target) {
    target.style.cursor = features.length > 0 ? 'pointer' : '';
  }
  
  // Убираем предыдущий hover эффект
  if (hoveredFeatureRef.current) {
    hoveredFeatureRef.current.setStyle(undefined);
    hoveredFeatureRef.current = null;
  }
  
  // Добавляем hover эффект к текущей фигуре
  if (features.length > 0) {
    hoveredFeatureRef.current = features[0];
    const hoverStyle = createHoverStyle(features[0]);
    hoveredFeatureRef.current.setStyle(hoverStyle);
  }
};
