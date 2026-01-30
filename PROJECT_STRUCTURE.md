calgary.ypilo.com/
├── 📁 .github/
│   └── workflows/
│       └── update-data.yml          # GitHub Actions для автообновления
│
├── 📁 public/                       # Статические файлы (добавьте логотипы здесь)
│
├── 📁 scripts/
│   └── update-properties.js         # Скрипт обновления данных
│
├── 📁 src/
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── 📁 api/                  # API Routes
│   │   │   ├── properties/
│   │   │   │   └── route.ts         # GET /api/properties
│   │   │   └── update/
│   │   │       └── route.ts         # POST /api/update
│   │   ├── layout.tsx               # Root layout (meta, fonts)
│   │   ├── page.tsx                 # Главная страница 🏠
│   │   └── globals.css              # Глобальные стили + оптимизации
│   │
│   ├── 📁 components/               # React компоненты
│   │   ├── Header.tsx               # Заголовок с логотипом Calgary
│   │   ├── MapComponent.tsx         # Mapbox карта с маркерами
│   │   ├── SearchBar.tsx            # Поиск с автодополнением
│   │   ├── FilterPanel.tsx          # Фильтры (тип, статус, район)
│   │   └── StatsCard.tsx            # Статистика
│   │
│   ├── 📁 lib/                      # Утилиты и API
│   │   ├── calgaryApi.ts            # Calgary Open Data API client
│   │   └── utils.ts                 # Хелперы (фильтрация, debounce)
│   │
│   └── 📁 types/
│       └── property.ts              # TypeScript типы
│
├── 📄 .env.local                    # Переменные окружения (НЕ коммитить!)
├── 📄 .env.local.example            # Пример .env файла
├── 📄 .gitignore                    # Игнорируемые файлы
├── 📄 next.config.js                # Next.js конфигурация
├── 📄 package.json                  # Зависимости и скрипты
├── 📄 postcss.config.mjs            # PostCSS для Tailwind
├── 📄 tailwind.config.ts            # Tailwind настройки (цвета Calgary)
├── 📄 tsconfig.json                 # TypeScript конфигурация
├── 📄 vercel.json                   # Vercel деплой (cron jobs)
│
├── 📄 README.md                     # Полная документация
├── 📄 QUICKSTART.md                 # Быстрый старт
└── 📄 MAPBOX_SETUP.md               # Инструкция по Mapbox токену

## 🎯 Ключевые файлы для кастомизации

### Дизайн и стили
- `tailwind.config.ts` - Цветовая схема Calgary
- `src/app/globals.css` - Глобальные стили и анимации
- `src/components/Header.tsx` - Логотип и заголовок

### Бизнес-логика
- `src/lib/calgaryApi.ts` - API запросы к Calgary Open Data
- `src/lib/utils.ts` - Фильтрация и трансформация данных
- `src/types/property.ts` - Структуры данных

### Компоненты карты
- `src/components/MapComponent.tsx` - Mapbox интеграция
- Маркеры, popup, навигация

### API endpoints
- `src/app/api/properties/route.ts` - Получение недвижимостей
- `src/app/api/update/route.ts` - Обновление данных

## 📊 Потоки данных

```
Calgary Open Data API
         ↓
  calgaryApi.ts (fetch)
         ↓
  /api/properties (transform)
         ↓
     page.tsx (SWR cache)
         ↓
  MapComponent (render)
```

## 🔄 Автообновление

### Локально
```bash
npm run update-data
```

### Vercel (автоматически)
- `vercel.json` - cron каждый час
- POST /api/update

### GitHub Actions
- `.github/workflows/update-data.yml`
- Каждый час

## 🎨 UI Компоненты

1. **Header** - Логотип, статистика, последнее обновление
2. **Sidebar** - Поиск, фильтры, статистика
3. **Map** - Интерактивная карта с маркерами
4. **Markers** - Цветные пины (зеленый/красный/желтый)
5. **Popup** - Информация о недвижимости при hover

## 🚀 Оптимизации

- ✅ Dynamic import для Mapbox (SSR safe)
- ✅ SWR кеширование с revalidation
- ✅ Debounced search
- ✅ Memoized filters
- ✅ Hardware acceleration (transform3d)
- ✅ Optimized Mapbox config
- ✅ Minimal re-renders

## 📱 Responsive

- Desktop: Sidebar + Map
- Tablet: Collapsible sidebar
- Mobile: Full-screen map, drawer
