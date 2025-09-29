import { Style, Fill, Stroke, Circle as CircleStyle, RegularShape } from 'ol/style';
import { APP_CONFIG } from './constants';

// Утилиты для работы с цветами
export const isWhiteOrLight = (color: string): boolean => {
  return color === '#ffffff' || 
         color === '#fff' || 
         color === 'white' ||
         color.toLowerCase() === '#ffffff' ||
         color.toLowerCase() === '#fff' ||
         color.toLowerCase() === 'white';
};

// Создание стилей для точек
export const createPointStyle = (properties: any, color: string): Style => {
  const pointType = properties.type || properties.category || 'default';
  const isWhite = isWhiteOrLight(color);
  let imageStyle;
  
  if (pointType === 'landmark' || pointType === 'important') {
    // Звезда для важных точек
    imageStyle = new RegularShape({
      points: 5,
      radius: 10,
      radius2: 5,
      angle: 0,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 4 : 3,
      }),
    });
  } else if (pointType === 'transport' || pointType === 'station') {
    // Квадрат для транспортных точек
    imageStyle = new RegularShape({
      points: 4,
      radius: 8,
      angle: Math.PI / 4,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 4 : 3,
      }),
    });
  } else {
    // Круг для обычных точек
    imageStyle = new CircleStyle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 4 : 3,
      }),
    });
  }
  
  return new Style({ image: imageStyle });
};

// Создание стилей для линий
export const createLineStyle = (properties: any, color: string): Style => {
  const lineType = properties.type || properties.category || 'default';
  let lineDash;
  
  if (lineType === 'route' || lineType === 'path') {
    lineDash = [10, 5]; // Пунктирная линия для маршрутов
  } else if (lineType === 'border' || lineType === 'boundary') {
    lineDash = [15, 5, 5, 5]; // Двойная пунктирная линия для границ
  }
  
  return new Style({
    stroke: new Stroke({
      color,
      width: 4,
      lineCap: 'round',
      lineJoin: 'round',
      lineDash,
    }),
  });
};

// Создание стилей для полигонов
export const createPolygonStyle = (properties: any, color: string): Style => {
  const polygonType = properties.type || properties.category || 'default';
  const isWhite = isWhiteOrLight(color);
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
      color: isWhite ? '#000000' : color,
      width: isWhite ? strokeWidth + 1 : strokeWidth,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
};

// Создание стиля для геометрии
export const createGeometryStyle = (feature: any): Style => {
  const properties = feature.getProperties();
  const color = properties.color || APP_CONFIG.DEFAULT_COLOR;
  const geometry = feature.getGeometry();
  const geometryType = geometry?.getType();
  
  if (geometryType === 'Point') {
    return createPointStyle(properties, color);
  } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
    return createLineStyle(properties, color);
  } else {
    return createPolygonStyle(properties, color);
  }
};

// Создание hover стилей для точек
export const createPointHoverStyle = (properties: any, color: string): Style => {
  const pointType = properties.type || properties.category || 'default';
  const isWhite = isWhiteOrLight(color);
  let imageStyle;
  
  if (pointType === 'landmark' || pointType === 'important') {
    // Увеличенная звезда для hover
    imageStyle = new RegularShape({
      points: 5,
      radius: 14,
      radius2: 7,
      angle: 0,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 5 : 4,
      }),
    });
  } else if (pointType === 'transport' || pointType === 'station') {
    // Увеличенный квадрат для hover
    imageStyle = new RegularShape({
      points: 4,
      radius: 12,
      angle: Math.PI / 4,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 5 : 4,
      }),
    });
  } else {
    // Увеличенный круг для hover
    imageStyle = new CircleStyle({
      radius: 12,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isWhite ? '#000000' : '#ffffff',
        width: isWhite ? 5 : 4,
      }),
    });
  }
  
  return new Style({ image: imageStyle });
};

// Создание hover стилей для линий
export const createLineHoverStyle = (properties: any, color: string): Style => {
  return new Style({
    stroke: new Stroke({
      color,
      width: 6, // Увеличиваем толщину при hover
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
};

// Создание hover стилей для полигонов
export const createPolygonHoverStyle = (properties: any, color: string): Style => {
  const isWhite = isWhiteOrLight(color);
  
  return new Style({
    fill: new Fill({
      color: `${color}60`, // Менее прозрачный при hover
    }),
    stroke: new Stroke({
      color: isWhite ? '#000000' : color,
      width: isWhite ? 6 : 5, // Увеличиваем толщину при hover
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
};

// Создание hover стиля для геометрии
export const createHoverStyle = (feature: any): Style => {
  const properties = feature.getProperties();
  const color = properties.color || APP_CONFIG.DEFAULT_COLOR;
  const geometry = feature.getGeometry();
  const geometryType = geometry?.getType();
  
  if (geometryType === 'Point') {
    return createPointHoverStyle(properties, color);
  } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
    return createLineHoverStyle(properties, color);
  } else {
    return createPolygonHoverStyle(properties, color);
  }
};
