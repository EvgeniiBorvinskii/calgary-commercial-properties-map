#!/usr/bin/env node

/**
 * Update Properties (Optimized)
 * 
 * Cron-скрипт для автоматического обновления данных каждые 12 часов.
 * Запускается в 00:00 и 12:00 через PM2 или crontab.
 * 
 * Использование:
 * - PM2: добавить в ecosystem.config.js с cron_restart: '0 0,12 * * *'
 * - Crontab: 0 0,12 * * * cd /srv/calgary.ypilo.com && node scripts/update-properties-optimized.js
 */

const { main: splitGeoJSON } = require('./split-geojson');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../logs/update-properties.log');
const LOG_DIR = path.dirname(LOG_FILE);

// Создаём директорию для логов
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message} ${args.join(' ')}\n`;
  
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage, 'utf-8');
}

async function update() {
  log('========================================');
  log('🚀 Starting automated property update');
  log('========================================');
  
  try {
    // Запускаем split-geojson
    await splitGeoJSON();
    
    log('');
    log('✅ Property update completed successfully!');
    log('Next update scheduled in 12 hours.');
    log('========================================');
    
    process.exit(0);
    
  } catch (error) {
    log('❌ Property update failed!');
    log('Error:', error.message);
    log(error.stack);
    log('========================================');
    
    // TODO: Отправить уведомление (email/Slack) об ошибке
    
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  update();
}

module.exports = { update };
