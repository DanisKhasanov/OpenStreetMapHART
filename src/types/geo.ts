export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type GeoData = GeoJSONFeature | GeoJSONCollection;

export interface MapProps {
  onFeatureClick: (featureData: Record<string, any>) => void;
  uploadedFeatures: GeoData[];
}

export interface FileUploadProps {
  onFileUpload: (geoData: GeoData) => void;
}

export interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureData: Record<string, any> | null;
}

