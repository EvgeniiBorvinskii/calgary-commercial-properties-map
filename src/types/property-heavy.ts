// Property Heavy — полные подробные данные (загружаются по требованию)
export interface PropertyHeavy {
  id: string;
  fullDetails: {
    // Основная информация
    licenseNumber: string;
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    
    // Тип бизнеса
    type: string;
    subType?: string;
    licenseTypes: string;
    
    // Статус и даты
    status: 'active' | 'pending' | 'in_progress';
    issuedDate: string;
    expiryDate?: string;
    
    // История изменений (для анализа стабильности бизнеса)
    renewalHistory?: Array<{
      date: string;
      status: string;
      action: 'Issued' | 'Renewed' | 'Pending' | 'Expired';
    }>;
    
    // Местоположение
    coordinates: [number, number];  // [lng, lat]
    longitude: number;
    latitude: number;
    community: string;
    ward: string;
    approvalStatus?: string;
    
    // Контакты (если доступно)
    contacts?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    
    // Характеристики недвижимости
    businessArea?: number;          // Площадь в кв. футах
    estimatedRent?: number;         // Расчётная аренда (CAD/месяц)
    buildingType?: string;          // Тип здания
    
    // Анализ конкурентов
    nearbyBusinesses?: string[];    // ID ближайших бизнесов того же типа
    competitorCount?: {
      radius500m: number;
      radius1km: number;
      radius2km: number;
    };
    
    // Дополнительно
    photos?: string[];              // Массив URL фотографий
    notes?: string;                 // Примечания
  };
}

// API Response для получения heavy данных
export interface PropertyHeavyResponse {
  success: boolean;
  data?: PropertyHeavy;
  error?: string;
  timestamp: string;
}
