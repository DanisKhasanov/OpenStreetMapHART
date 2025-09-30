import { useRef, useState } from "react";
import { FileUploadProps, GeoData } from "../types/geo";
import { useCustomSnackbar } from "../hooks/useCustomSnackbar";
import { APP_CONFIG, FILE_VALIDATION_RULES } from "../utils/constants";
import { validateGeoData, isSupportedFormat } from "../utils/validationUtils";
import { parseKMZ, parseKMLWithOpenLayers } from "../utils/fileParsers";
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
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
