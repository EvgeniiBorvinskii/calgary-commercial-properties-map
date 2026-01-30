// Property Light — минимальные данные для быстрого рендеринга карты
export interface PropertyLight {
  id: string;                    // Уникальный идентификатор лицензии (например "BL123456")
  name: string;                  // Название бизнеса
  type: string;                  // Тип бизнеса (WHOLESALE, RETAIL, и т.д.)
  status: 'active' | 'pending' | 'in_progress';  // Статус лицензии
  community: string;             // Район (например "Downtown")
  expiryDate?: string;           // Дата истечения лицензии (ISO format, опционально)
}

// GeoJSON Feature для light данных
export interface PropertyLightFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];  // [longitude, latitude]
  };
  properties: PropertyLight;
}

// Полный GeoJSON для light данных
export interface PropertyLightGeoJSON {
  type: 'FeatureCollection';
  timestamp: string;               // ISO timestamp последнего обновления
  datasetLastUpdated?: string;     // Дата последнего обновления данных Calgary Open Data
  datasetName?: string;            // Название датасета
  count: number;                   // Общее количество объектов
  features: PropertyLightFeature[];
}
