import React, { useRef, useState } from "react";
import JSZip from "jszip";
import { KML, GeoJSON } from "ol/format";
import { FileUploadProps, GeoData } from "../types/geo";
import { useCustomSnackbar } from "../hooks/useCustomSnackbar";
import styles from "../styles/FileUpload.module.css";

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
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

        // Определяем тип файла и парсим соответственно
        if (file.name.endsWith(".json") || file.name.endsWith(".geojson")) {
          geoData = JSON.parse(content);
        } else if (file.name.endsWith(".kml")) {
          // Для KML файлов используем встроенный парсер OpenLayers
          geoData = parseKMLWithOpenLayers(content);
        } else if (file.name.endsWith(".kmz")) {
          // KMZ файлы - это сжатые KML файлы
          geoData = await parseKMZ(file);
        } else {
          showSnackbar("Неподдерживаемый формат файла", { variant: "error" });
          return;
        }

        // Валидация GeoJSON структуры
        if (!geoData || !geoData.type) {
          throw new Error("Неверная структура GeoJSON файла");
        }

        if (geoData.type === "FeatureCollection" && !geoData.features) {
          throw new Error("FeatureCollection должен содержать массив features");
        }

        if (geoData.type === "Feature" && !geoData.geometry) {
          throw new Error("Feature должен содержать geometry");
        }

        onFileUpload(geoData);

        // Показываем успешное уведомление
        const featureCount =
          geoData.type === "FeatureCollection"
            ? geoData.features?.length || 0
            : 1;
        showSnackbar(
          `Файл успешно загружен! Найдено объектов: ${featureCount}`,
          { variant: "success" }
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Ошибка при парсинге файла:", error);
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
        throw new Error("KML файл не найден в KMZ архиве");
      }

      const kmlContent = await kmlFile.async("text");
      return parseKMLWithOpenLayers(kmlContent);
    } catch (error) {
      throw new Error(
        `Ошибка при распаковке KMZ файла: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
    }
  };

  // Парсер KML с использованием встроенного парсера OpenLayers
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

        // Удаляем служебные свойства OpenLayers, но сохраняем color
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
      throw new Error(
        `Ошибка при парсинге KML файла: ${
          error instanceof Error ? error.message : "Неизвестная ошибка"
        }`
      );
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
        accept=".json,.geojson,.kml,.kmz"
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
