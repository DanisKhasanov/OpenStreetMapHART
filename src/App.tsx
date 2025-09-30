import { useState } from 'react';
import { SnackbarProvider } from 'notistack';
import Map from './components/Map';
import FileUpload from './components/FileUpload';
import FeatureModal from './components/FeatureModal';
import { GeoData } from './types/geo';
import './styles/App.css';

const App = () => {
  const [uploadedFeatures, setUploadedFeatures] = useState<GeoData[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Record<
    string,
    any
  > | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileUpload = (geoData: GeoData) => {
    setUploadedFeatures([geoData]);
  };

  const handleFeatureClick = (featureData: Record<string, any>) => {
    setSelectedFeature(featureData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFeature(null);
  };

  return (
    <SnackbarProvider maxSnack={3}>
      <div>
        <FileUpload onFileUpload={handleFileUpload} />
        <Map
          onFeatureClick={handleFeatureClick}
          uploadedFeatures={uploadedFeatures}
        />
        <FeatureModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          featureData={selectedFeature}
        />
      </div>
    </SnackbarProvider>
  );
};

export default App;
