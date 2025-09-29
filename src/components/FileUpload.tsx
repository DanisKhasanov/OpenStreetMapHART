import { useRef, useState } from "react";
import JSZip from "jszip";
import { KML, GeoJSON } from "ol/format";
import { FileUploadProps, GeoData } from "../types/geo";
import { useCustomSnackbar } from "../hooks/useCustomSnackbar";
import { APP_CONFIG, FILE_VALIDATION_RULES } from "../utils/constants";
import { validateGeoData, isSupportedFormat, getErrorMessage } from "../utils/validationUtils";
import styles from "../styles/FileUpload.module.css";

const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSnackbar } = useCustomSnackbar();
  const [isDragOver, setIsDragOver] = useState(false);

  // Обработчики drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  // Функция обработки файла
  const processFile = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        let geoData: GeoData;

        // Проверяем поддерживаемый формат
        if (!isSupportedFormat(file.name)) {
          showSnackbar(FILE_VALIDATION_RULES.ERROR_MESSAGES.UNSUPPORTED_FORMAT, { variant: "error" });
          return;
        }

        // Определяем тип файла и парсим соответственно
        if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
          geoData = JSON.parse(content);
        } else if (file.name.endsWith(".kml")) {
          geoData = parseKMLWithOpenLayers(content);
        } else if (file.name.endsWith(".kmz")) {
          geoData = await parseKMZ(file);
        } else {
          throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.UNSUPPORTED_FORMAT);
        }

        // Валидация GeoJSON структуры
        validateGeoData(geoData);

        onFileUpload(geoData);

        // Показываем успешное уведомление
        const featureCount =
          geoData.type === "FeatureCollection"
            ? (geoData as any).features?.length || 0
            : 1;
        showSnackbar(
          `Файл успешно загружен! Найдено объектов: ${featureCount}`,
          { variant: "success" }
        );
      } catch (error) {
        showSnackbar(
          `Ошибка при чтении файла: ${
            error instanceof Error ? error.message : "Неизвестная ошибка"
          }`,
          { variant: "error" }
        );
      }
    };

    reader.readAsText(file);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Парсер KMZ файлов
  const parseKMZ = async (file: File): Promise<GeoData> => {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      // Ищем KML файл в архиве
      let kmlFile: JSZip.JSZipObject | null = null;
      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (filename.toLowerCase().endsWith(".kml")) {
          kmlFile = zipEntry;
          break;
        }
      }

      if (!kmlFile) {
        throw new Error(FILE_VALIDATION_RULES.ERROR_MESSAGES.KML_NOT_FOUND);
      }

      const kmlContent = await kmlFile.async("text");
      return parseKMLWithOpenLayers(kmlContent);
    } catch (error) {
      throw new Error(getErrorMessage(FILE_VALIDATION_RULES.ERROR_MESSAGES.KMZ_EXTRACT_ERROR, error));
    }
  };

  // Парсер KML 
  const parseKMLWithOpenLayers = (kmlContent: string): GeoData => {
    try {
      const kmlFormat = new KML();
      const features = kmlFormat.readFeatures(kmlContent, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:4326",
      });

      // Конвертируем features OpenLayers в GeoJSON формат
      const geoJsonFormat = new GeoJSON();
      const geoJsonFeatures = features.map((feature) => {
        const properties = feature.getProperties();

        // Удаляем служебные свойства OpenLayers
        const cleanProperties: Record<string, any> = {};
        Object.entries(properties).forEach(([key, value]) => {
          if (
            key !== "geometry" &&
            !key.startsWith("_") &&
            !key.endsWith("_") &&
            typeof value !== "function" &&
            !(value && typeof value === "object" && value.ol_uid)
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
          featureProjection: "EPSG:4326",
          dataProjection: "EPSG:4326",
        });

        return {
          ...geoJsonFeature,
          properties: cleanProperties,
          geometry: geoJsonFeature.geometry as any,
        };
      });

      return {
        type: "FeatureCollection",
        features: geoJsonFeatures,
      };
    } catch (error) {
      throw new Error(getErrorMessage(FILE_VALIDATION_RULES.ERROR_MESSAGES.KML_PARSE_ERROR, error));
    }
  };

  return (
    <div
      className={`${styles.uploadContainer} ${
        isDragOver ? styles.dragOver : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={APP_CONFIG.SUPPORTED_FORMATS.join(',')}
        onChange={handleFileChange}
        className={styles.fileInput}
      />
      <div className={styles.helpText}>
        {isDragOver
          ? "Отпустите файл для загрузки"
          : "Поддерживаемые форматы: JSON, GeoJSON, KML, KMZ"}
      </div>
    </div>
  );
};

export default FileUpload;
