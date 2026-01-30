# Calgary Commercial Properties Map - Полное Руководство по Развертыванию

## 📋 Описание Проекта

Интерактивная карта коммерческих объектов Калгари с более чем 21,000 бизнес-лицензий.
- **Технологии:** Next.js 14, TypeScript, Mapbox GL JS, Tailwind CSS
- **Производительность:** Оптимизирован для работы с большими датасетами
- **Фильтрация:** Реал-тайм фильтры по типам бизнеса, статусу, дате истечения лицензии
- **Данные:** Автоматическая загрузка из Calgary Open Data API

## 🌟 Основные Возможности

- ✅ 21,871 бизнес-лицензий на карте
- ✅ Кластеризация маркеров для производительности
- ✅ Живые фильтры без перезагрузки страницы
- ✅ Фильтр по дате истечения лицензии (неделя, месяц, квартал, год, истекшие)
- ✅ Детальная информация о каждом бизнесе
- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Темная/светлая тема
- ✅ Экспорт данных в JSON

## 📦 Структура Проекта

```
calgary.ypilo.com/
├── src/
│   ├── app/              # Next.js 14 App Router
│   │   ├── api/          # API endpoints
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React компоненты
│   │   ├── AdvancedFilters.tsx         # Панель фильтров
│   │   ├── MapComponentOptimized.tsx   # Mapbox карта
│   │   └── PropertyDetails.tsx         # Детали объекта
│   └── types/            # TypeScript типы
│       └── property-light.ts
├── public/
│   └── data/
│       ├── properties-light.json       # Легкий датасет (8.91 MB)
│       └── properties-heavy/           # Полные данные (split by ID)
├── scripts/
│   └── split-geojson.js  # Скрипт генерации данных
├── .next/                # Production build
├── package.json          # Dependencies
└── ecosystem.config.js   # PM2 configuration

```

## 🚀 Быстрое Развертывание на Новом Сервере

### Шаг 1: Установка Зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка версий
node --version  # должно быть v20.x
npm --version   # должно быть v10.x

# Установка PM2 глобально
npm install -g pm2

# Установка Nginx
apt install -y nginx

# Установка Git
apt install -y git
```

### Шаг 2: Клонирование Репозитория

```bash
# Создание директории проекта
mkdir -p /srv
cd /srv

# Клонирование из GitHub
git clone https://github.com/EvgeniiBorvinskii/calgary-commercial-properties-map.git calgary.ypilo.com
cd calgary.ypilo.com

# Проверка что все файлы на месте
ls -la
```

### Шаг 3: Настройка Окружения

```bash
# Создание .env.local из примера
cp .env.local.example .env.local

# Редактирование переменных окружения
nano .env.local
```

Добавьте в `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=ваш_токен_mapbox
NEXT_PUBLIC_API_URL=https://calgary.ypilo.com
```

### Шаг 4: Установка Зависимостей и Сборка

```bash
# Установка npm пакетов
npm install

# Сборка production версии
npm run build

# Проверка что .next создан
ls -la .next
```

### Шаг 5: Настройка Nginx

```bash
# Создание конфигурации Nginx
nano /etc/nginx/sites-available/calgary.ypilo.com
```

Добавьте конфигурацию:
```nginx
server {
    listen 80;
    server_name calgary.ypilo.com www.calgary.ypilo.com;

    location / {
        proxy_pass http://localhost:3052;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 20M;
}
```

Активируйте конфигурацию:
```bash
ln -s /etc/nginx/sites-available/calgary.ypilo.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 6: Запуск с PM2

```bash
cd /srv/calgary.ypilo.com

# Запуск приложения
pm2 start ecosystem.config.js

# Проверка статуса
pm2 status

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Просмотр логов
pm2 logs calgary-app
```

### Шаг 7: Настройка SSL (опционально)

```bash
# Установка Certbot
apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
certbot --nginx -d calgary.ypilo.com -d www.calgary.ypilo.com

# Автообновление сертификата
certbot renew --dry-run
```

## 🔄 Регенерация Данных

Для обновления данных с Calgary Open Data:

```bash
cd /srv/calgary.ypilo.com
npm run split-data
```

Это:
1. Скачает актуальные данные из Calgary Open Data API
2. Создаст properties-light.json (легкий датасет)
3. Создаст properties-heavy/*.json (полные детали)
4. Добавит metadata (дата обновления, количество записей)

## 📊 Управление PM2

```bash
# Статус приложения
pm2 status

# Перезапуск
pm2 restart calgary-app

# Остановка
pm2 stop calgary-app

# Просмотр логов (последние 100 строк)
pm2 logs calgary-app --lines 100

# Мониторинг в реальном времени
pm2 monit

# Информация о процессе
pm2 show calgary-app
```

## 🔧 Troubleshooting

### Проблема: Сайт не открывается

```bash
# Проверка Nginx
systemctl status nginx
nginx -t

# Проверка PM2
pm2 status
pm2 logs calgary-app

# Проверка порта
netstat -tulpn | grep 3052
```

### Проблема: Данные не загружаются

```bash
# Проверка файлов данных
ls -lh public/data/
cat public/data/properties-light.json | head -20

# Регенерация данных
npm run split-data
```

### Проблема: Ошибки при сборке

```bash
# Очистка и пересборка
rm -rf .next node_modules
npm install
npm run build
```

### Проблема: PM2 не запускается

```bash
# Проверка Node.js
which node
node --version

# Ручной запуск для отладки
cd /srv/calgary.ypilo.com
node .next/standalone/server.js
```

## 📝 Скрипты package.json

```json
{
  "dev": "next dev -p 3052",           // Разработка
  "build": "next build",               // Сборка production
  "start": "next start -p 3052",       // Запуск production
  "split-data": "node scripts/split-geojson.js"  // Генерация данных
}
```

## 🌐 API Endpoints

- `GET /api/properties/[id]` - Получить детали объекта
- Данные из: `public/data/properties-heavy/[id].json`

## 📁 Важные Файлы

### ecosystem.config.js
PM2 конфигурация для автозапуска и управления процессами

### scripts/split-geojson.js
Скрипт для загрузки и обработки данных из Calgary Open Data:
- Скачивает GeoJSON с 21,000+ записей
- Создает легкий файл для карты (properties-light.json)
- Разбивает детали по отдельным файлам (properties-heavy/)
- Добавляет metadata (timestamp, dataset info)

### src/types/property-light.ts
TypeScript типы для данных объектов

## 🔐 Переменные Окружения

Обязательные:
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Токен Mapbox GL JS

Опциональные:
- `NEXT_PUBLIC_API_URL` - Base URL для API
- `PORT` - Порт приложения (по умолчанию: 3052)

## 📱 Требования к Серверу

### Минимальные
- CPU: 1 core
- RAM: 2 GB
- Disk: 20 GB
- OS: Ubuntu 20.04+

### Рекомендуемые
- CPU: 2 cores
- RAM: 4 GB
- Disk: 40 GB
- OS: Ubuntu 22.04 LTS

## 🚀 Production Checklist

- [ ] Ubuntu установлен и обновлен
- [ ] Node.js 20.x установлен
- [ ] Проект склонирован из GitHub
- [ ] npm install выполнен
- [ ] .env.local настроен
- [ ] npm run build успешен
- [ ] Nginx установлен и настроен
- [ ] PM2 запущен и автостарт настроен
- [ ] SSL сертификат установлен
- [ ] Firewall настроен (порты 80, 443)
- [ ] Данные загружены (properties-light.json существует)
- [ ] Сайт открывается в браузере
- [ ] Фильтры работают
- [ ] Детали объектов загружаются

## 📧 Поддержка

При проблемах проверьте:
1. PM2 логи: `pm2 logs calgary-app`
2. Nginx логи: `/var/log/nginx/error.log`
3. System logs: `journalctl -xe`

## 🔄 Обновление Проекта

```bash
cd /srv/calgary.ypilo.com

# Получить последние изменения
git pull origin main

# Установить новые зависимости
npm install

# Пересобрать
npm run build

# Перезапустить PM2
pm2 restart calgary-app
```

## 📊 Версии

- Next.js: 14.2.16
- React: 18.3.1
- Mapbox GL JS: 3.9.2
- TypeScript: 5.7.2
- Node.js: 20.x (рекомендуется)

## 🎯 Производительность

- First Load JS: 94.7 kB
- Lighthouse Score: 90+
- Map Cluster Performance: 21,000+ маркеров
- Data Loading: Lazy loading для деталей

---

**Последнее обновление:** Январь 2026
**Версия документа:** 2.0.0
