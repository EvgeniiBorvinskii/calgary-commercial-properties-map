#!/usr/bin/env node

/**
 * Split GeoJSON Utility
 * 
 * Этот скрипт скачивает данные из Calgary Open Data API (Socrata)
 * и разделяет их на два файла:
 * 1. properties-light.json (~2-3 MB) — минимальные данные для рендеринга карты
 * 2. properties-heavy/ (~21k файлов) — полные данные для каждого объекта
 * 
 * Запуск: node scripts/split-geojson.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

const CALGARY_API_URL = 'https://data.calgary.ca/resource/vdjc-pybd.json';
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const LIGHT_OUTPUT = path.join(OUTPUT_DIR, 'properties-light.json');
const HEAVY_OUTPUT_DIR = path.join(OUTPUT_DIR, 'properties-heavy');

// Лимит запросов (Calgary Open Data поддерживает пагинацию)
const PAGE_SIZE = 5000;
const MAX_RECORDS = 50000;

// ============================================================================
// УТИЛИТЫ
// ============================================================================

/**
 * Нормализация статуса из Calgary Open Data
 * Calgary использует: "Licensed", "Renewal Licensed", "Pending Renewal", и т.д.
 * Мы упрощаем до: active, pending, in_progress
 */
function normalizeStatus(calgaryStatus) {
  const status = String(calgaryStatus || '').toLowerCase();
  
  if (status.includes('licensed') && !status.includes('pending')) {
    return 'active';
  }
  
  if (status.includes('pending') || status.includes('invoiced') || status.includes('notification')) {
    return 'pending';
  }
  
  if (status.includes('progress') || status.includes('move') || status.includes('close')) {
    return 'in_progress';
  }
  
  return 'active'; // По умолчанию
}

/**
 * Валидация координат
 * Calgary координаты: lng ~ -114.x, lat ~ 51.x
 */
function isValidCoordinates(lng, lat) {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -115 && lng <= -113 &&  // Границы Calgary (запад-восток)
    lat >= 50.5 && lat <= 51.5      // Границы Calgary (юг-север)
  );
}

/**
 * Создание уникального ID
 * Calgary использует getbusid, но может быть пустым
 */
function generateId(record, index) {
  return record.getbusid || `CL_${index}_${Date.now()}`;
}

/**
 * Логирование с временными метками
 */
function log(message, ...args) {
  console.log(`[${new Date().toISOString()}]`, message, ...args);
}

// ============================================================================
// ОСНОВНАЯ ЛОГИКА
// ============================================================================

async function fetchAllProperties() {
  log('🌐 Fetching data from Calgary Open Data...');
  
  let allRecords = [];
  let offset = 0;
  let datasetMetadata = null;
  
  // Fetch dataset metadata first to get last update time
  try {
    const metaResponse = await axios.get('https://data.calgary.ca/api/views/vdjc-pybd.json', {
      timeout: 30000
    });
    if (metaResponse.data) {
      datasetMetadata = {
        lastUpdated: metaResponse.data.rowsUpdatedAt ? new Date(metaResponse.data.rowsUpdatedAt * 1000).toISOString() : null,
        name: metaResponse.data.name || 'Calgary Business Licenses',
        description: metaResponse.data.description || ''
      };
      log(`   Dataset: ${datasetMetadata.name}`);
      if (datasetMetadata.lastUpdated) {
        log(`   Last Updated: ${new Date(datasetMetadata.lastUpdated).toLocaleString()}`);
      }
    }
  } catch (err) {
    log('   Warning: Could not fetch dataset metadata');
  }
  
  while (allRecords.length < MAX_RECORDS) {
    try {
      log(`   Fetching batch: offset=${offset}, limit=${PAGE_SIZE}`);
      
      const response = await axios.get(CALGARY_API_URL, {
        params: {
          $limit: PAGE_SIZE,
          $offset: offset,
          $order: 'first_iss_dt DESC'  // Сортировка по дате выдачи
        },
        timeout: 60000  // 60 секунд таймаут
      });
      
      const batch = response.data || [];
      
      if (batch.length === 0) {
        log('   No more records, stopping pagination.');
        break;
      }
      
      allRecords.push(...batch);
      log(`   Received ${batch.length} records. Total: ${allRecords.length}`);
      
      offset += PAGE_SIZE;
      
      // Задержка между запросами (чтобы не перегружать API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      log('❌ Error fetching data:', error.message);
      if (offset === 0) throw error;  // Если первый запрос провалился — прерываем
      break;  // Если провалился один из batch — используем то, что есть
    }
  }
  
  log(`✅ Fetched total: ${allRecords.length} records`);
  return { records: allRecords, metadata: datasetMetadata };
}

/**
 * Преобразование Calgary record в Light + Heavy форматы
 */
function transformRecord(record, index) {
  // Координаты
  const lng = record.point?.coordinates?.[0];
  const lat = record.point?.coordinates?.[1];
  
  if (!isValidCoordinates(lng, lat)) {
    return null;  // Пропускаем записи без валидных координат
  }
  
  const id = generateId(record, index);
  const status = normalizeStatus(record.jobstatusdesc);
  const type = (record.licencetypes?.split(',')[0] || 'Business').trim();
  const subType = record.licencetypes?.split('\n')[1]?.trim();
  const name = (record.tradename || 'Unnamed Business').trim();
  const community = (record.comdistnm || 'Unknown').trim();
  const expiryDate = record.exp_dt || null;
  
  // ======= LIGHT DATA (минимум для карты) =======
  const lightData = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: {
      id,
      name,
      type,
      status,
      community,
      expiryDate
    }
  };
  
  // ======= HEAVY DATA (все подробности) =======
  const heavyData = {
    id,
    fullDetails: {
      // Основная информация
      licenseNumber: record.licencenumber || record.getbusid || id,
      name,
      address: record.address || 'N/A',
      city: 'Calgary',
      province: 'AB',
      postalCode: record.postalcode || '',
      
      // Тип бизнеса
      type,
      subType,
      licenseTypes: record.licencetypes || '',
      
      // Статус и даты
      status,
      issuedDate: record.first_iss_dt || '',
      expiryDate: record.exp_dt || null,
      
      // Местоположение
      coordinates: [lng, lat],
      longitude: lng,
      latitude: lat,
      community,
      ward: record.comdistcd || '',
      
      // Контакты (обычно не предоставляются в Open Data)
      contacts: {},
      
      // Характеристики (если будут доступны в будущем)
      businessArea: null,
      estimatedRent: null,
      buildingType: null,
      
      // Анализ конкурентов (будет рассчитан позже)
      nearbyBusinesses: [],
      competitorCount: {
        radius500m: 0,
        radius1km: 0,
        radius2km: 0
      },
      
      // Дополнительно
      photos: [],
      notes: ''
    }
  };
  
  return { lightData, heavyData };
}

/**
 * Главная функция
 */
async function main() {
  try {
    log('🚀 Starting GeoJSON split process...');
    log('');
    
    // Создаём директории если их нет
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(HEAVY_OUTPUT_DIR)) {
      fs.mkdirSync(HEAVY_OUTPUT_DIR, { recursive: true });
    }
    
    // Шаг 1: Скачиваем данные
    const { records: rawRecords, metadata } = await fetchAllProperties();
    log('');
    
    // Шаг 2: Преобразуем данные
    log('🔄 Transforming records...');
    const lightFeatures = [];
    const heavyRecords = [];
    let skipped = 0;
    
    for (let i = 0; i < rawRecords.length; i++) {
      const result = transformRecord(rawRecords[i], i);
      
      if (!result) {
        skipped++;
        continue;
      }
      
      lightFeatures.push(result.lightData);
      heavyRecords.push(result.heavyData);
    }
    
    log(`   Transformed: ${lightFeatures.length} valid records`);
    log(`   Skipped: ${skipped} invalid records (bad coordinates)`);
    log('');
    
    // Шаг 3: Сохраняем Light GeoJSON
    log('💾 Writing Light GeoJSON...');
    const lightGeoJSON = {
      type: 'FeatureCollection',
      timestamp: new Date().toISOString(),
      datasetLastUpdated: metadata?.lastUpdated || null,
      datasetName: metadata?.name || 'Calgary Business Licenses',
      count: lightFeatures.length,
      features: lightFeatures
    };
    
    fs.writeFileSync(LIGHT_OUTPUT, JSON.stringify(lightGeoJSON, null, 2), 'utf-8');
    const lightSize = (fs.statSync(LIGHT_OUTPUT).size / 1024 / 1024).toFixed(2);
    log(`   ✅ Saved: ${LIGHT_OUTPUT}`);
    log(`   Size: ${lightSize} MB`);
    log('');
    
    // Шаг 4: Сохраняем Heavy данные (отдельные файлы)
    log('💾 Writing Heavy metadata files...');
    let heavyTotalSize = 0;
    
    for (const heavy of heavyRecords) {
      const heavyFilePath = path.join(HEAVY_OUTPUT_DIR, `${heavy.id}.json`);
      const heavyJSON = JSON.stringify(heavy, null, 2);
      fs.writeFileSync(heavyFilePath, heavyJSON, 'utf-8');
      heavyTotalSize += heavyJSON.length;
    }
    
    const heavySizeMB = (heavyTotalSize / 1024 / 1024).toFixed(2);
    log(`   ✅ Saved: ${heavyRecords.length} files in ${HEAVY_OUTPUT_DIR}`);
    log(`   Total size: ${heavySizeMB} MB`);
    log('');
    
    // Итоговая статистика
    log('📊 Summary:');
    log(`   Total records processed: ${rawRecords.length}`);
    log(`   Valid records: ${lightFeatures.length}`);
    log(`   Skipped (invalid): ${skipped}`);
    log(`   Light GeoJSON: ${lightSize} MB`);
    log(`   Heavy metadata: ${heavyRecords.length} files, ${heavySizeMB} MB`);
    log(`   Data size reduction: ${((1 - parseFloat(lightSize) / parseFloat(heavySizeMB)) * 100).toFixed(1)}%`);
    log('');
    log('✅ GeoJSON split completed successfully!');
    
  } catch (error) {
    log('❌ Fatal error:', error.message);
    log(error.stack);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = { main, normalizeStatus, isValidCoordinates };
