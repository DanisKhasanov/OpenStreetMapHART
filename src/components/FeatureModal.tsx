import { FeatureModalProps } from '../types/geo';
import { OPENLAYERS_PROPS } from '../utils/constants';
import styles from '../styles/FeatureModal.module.css';

const FeatureModal = ({ isOpen, onClose, featureData }: FeatureModalProps) => {
  if (!isOpen || !featureData) {
    return null;
  }

  // Фильтруем свойства OpenLayers и другие служебные поля
  const isUserProperty = (key: string, value: any): boolean => {
    // Исключаем функции и сложные объекты
    if (typeof value === 'function') {
      return false;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Проверяем, не является ли это OpenLayers объектом
      if (value.ol_uid || value.disposed !== undefined) {
        return false;
      }
    }

    return !(OPENLAYERS_PROPS as readonly string[]).includes(key);
  };

  //Рекурсивно отображаем свойства объекта в виде элементов.
  const renderProperties = (
    obj: Record<string, any>,
    prefix = ''
  ): React.ReactNode[] => {
    return Object.entries(obj)
      .filter(([key, value]) => isUserProperty(key, value))
      .map(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Рекурсивно обрабатываем только если это не OpenLayers объект
          if (!value.ol_uid && !value.disposed) {
            return (
              <div key={fullKey} className={styles.nestedProperty}>
                <strong>{fullKey}:</strong>
                {renderProperties(value, fullKey)}
              </div>
            );
          }
        }

        return (
          <div
            key={fullKey}
            className={`${styles.propertyItem} ${
              prefix ? styles.propertyItemNested : ''
            }`}
          >
            <strong className={styles.propertyKey}>{fullKey}:</strong>
            {key === 'color' ? (
              <div className={styles.colorDisplay}>
                <div
                  className={styles.colorSquare}
                  style={{ backgroundColor: value }}
                />
                <span>{String(value)}</span>
              </div>
            ) : (
              <span>
                {Array.isArray(value) ? JSON.stringify(value) : String(value)}
              </span>
            )}
          </div>
        );
      });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Метаданные фигуры</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.content}>{renderProperties(featureData)}</div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.footerButton}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureModal;
