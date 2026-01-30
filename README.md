# 🏙️ Calgary Commercial Properties

Интерактивная веб-платформа для визуализации коммерческих недвижимостей города Calgary с использованием открытых данных City of Calgary Open Data.

## ✨ Возможности

- 🗺️ **Интерактивная карта** - Плавная карта Calgary с маркерами всех коммерческих недвижимостей
- 📍 **Детальная информация** - Hover на маркер для просмотра информации о недвижимости
- 🔍 **Мощный поиск** - Поиск по названию, адресу или типу бизнеса
- 🎯 **Продвинутые фильтры** - Фильтрация по типу бизнеса, статусу, району
- 🔄 **Автообновление** - Данные обновляются каждый час из Calgary Open Data API
- ⚡ **Оптимизированная производительность** - 60+ FPS, плавные анимации
- 📱 **Адаптивный дизайн** - Работает на всех устройствах
- 🎨 **Современный UI** - Строгий и функциональный дизайн

## 🛠️ Технологии

- **Next.js 14** - React framework с App Router
- **TypeScript** - Типобезопасность
- **Mapbox GL JS** - Интерактивная карта
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - Data fetching и кеширование
- **Calgary Open Data API** - Источник данных

## 📦 Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd calgary.ypilo.com
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**

Создайте файл `.env.local` и добавьте:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Получение Mapbox токена:**
1. Зарегистрируйтесь на [mapbox.com](https://account.mapbox.com/)
2. Перейдите в Account → Tokens
3. Создайте новый token или используйте default public token
4. Скопируйте токен в `.env.local`

4. **Запустите сервер разработки:**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 🚀 Деплой

### Vercel (Рекомендуется)

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Деплой:
```bash
vercel
```

3. Добавьте переменные окружения в Vercel Dashboard

### Docker

```bash
docker build -t calgary-properties .
docker run -p 3000:3000 -e NEXT_PUBLIC_MAPBOX_TOKEN=your_token calgary-properties
```

## ⏰ Автообновление данных

### Локально (каждый час)

Используйте cron или Windows Task Scheduler:

**Windows (PowerShell):**
```powershell
# Создайте задачу в Task Scheduler
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/update-properties.js"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Calgary Properties Update"
```

**Linux/Mac (Crontab):**
```bash
# Добавьте в crontab
0 * * * * cd /path/to/calgary.ypilo.com && node scripts/update-properties.js
```

### На продакшене

#### Vercel Cron Jobs

Создайте `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/update",
    "schedule": "0 * * * *"
  }]
}
```

#### GitHub Actions

Создайте `.github/workflows/update-data.yml`:
```yaml
name: Update Calgary Data
on:
  schedule:
    - cron: '0 * * * *'  # Каждый час
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Update
        run: curl -X POST https://your-site.com/api/update
```

## 📊 API Endpoints

### GET /api/properties
Получить все недвижимости

**Query параметры:**
- `address` - Поиск по адресу
- `type` - Фильтр по типу бизнеса
- `status` - Фильтр по статусу

**Пример:**
```bash
curl "http://localhost:3000/api/properties?status=active&type=Restaurant"
```

### POST /api/update
Обновить данные из Calgary Open Data

```bash
curl -X POST http://localhost:3000/api/update
```

## 📁 Структура проекта

```
calgary.ypilo.com/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── properties/    # API для получения недвижимостей
│   │   │   └── update/        # API для обновления данных
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Главная страница
│   │   └── globals.css        # Глобальные стили
│   ├── components/
│   │   ├── MapComponent.tsx   # Компонент карты
│   │   ├── SearchBar.tsx      # Поиск
│   │   ├── FilterPanel.tsx    # Фильтры
│   │   └── Header.tsx         # Заголовок
│   ├── lib/
│   │   ├── calgaryApi.ts      # Calgary Open Data API клиент
│   │   └── utils.ts           # Утилиты
│   └── types/
│       └── property.ts        # TypeScript типы
├── scripts/
│   └── update-properties.js   # Скрипт обновления
├── public/                    # Статические файлы
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Кастомизация

### Изменение цветов

Отредактируйте `tailwind.config.ts`:

```typescript
colors: {
  calgary: {
    red: '#D32F2F',    // Красный Calgary
    blue: '#0066B3',   // Синий Calgary
    gray: '#4A5568',   // Серый
    lightGray: '#F7FAFC',
  },
}
```

### Центр карты и зум

Измените константы в `src/components/MapComponent.tsx`:

```typescript
const CALGARY_CENTER: [number, number] = [-114.0719, 51.0447];
const CALGARY_ZOOM = 11;
```

## 🔧 Оптимизация производительности

Проект оптимизирован для достижения 60+ FPS:

- ✅ Hardware acceleration для анимаций
- ✅ Dynamic imports для Mapbox
- ✅ Debouncing для поиска
- ✅ SWR caching для API запросов
- ✅ Мемоизация фильтрации
- ✅ Оптимизированные рендеры с React.memo

## 📱 Браузеры

Поддерживаемые браузеры:
- Chrome/Edge (последние 2 версии)
- Firefox (последние 2 версии)
- Safari (последние 2 версии)

## 📝 Лицензия

MIT License

## 🤝 Вклад

Contributions приветствуются! Пожалуйста, создайте issue или pull request.

## 📞 Поддержка

Для вопросов и поддержки:
- 📧 Email: support@example.com
- 🐛 Issues: GitHub Issues
- 📚 Docs: [Calgary Open Data Portal](https://data.calgary.ca/)

## 🙏 Благодарности

- City of Calgary за Open Data
- Mapbox за картографию
- Next.js команду за фреймворк

---

Сделано с ❤️ для города Calgary
