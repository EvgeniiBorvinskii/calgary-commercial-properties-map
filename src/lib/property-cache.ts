/**
 * Property Details Cache (LRU)
 * 
 * Кэш с автоматическим удалением редко используемых элементов.
 * Используется для хранения подробных данных объектов в памяти.
 */

import { PropertyHeavy } from '@/types/property-heavy';

class PropertyDetailsCache {
  private cache = new Map<string, { data: PropertyHeavy; timestamp: number }>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 50, ttlMinutes = 30) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Добавить или обновить элемент в кэше
   */
  set(id: string, data: PropertyHeavy): void {
    // Если кэш переполнен, удаляем самый старый элемент
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        console.log('[Cache] Evicted oldest entry:', firstKey);
      }
    }

    this.cache.set(id, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Получить элемент из кэша
   */
  get(id: string): PropertyHeavy | null {
    const entry = this.cache.get(id);
    
    if (!entry) {
      return null;
    }

    // Проверяем, не истёк ли TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(id);
      console.log('[Cache] Entry expired:', id);
      return null;
    }

    return entry.data;
  }

  /**
   * Удалить элемент из кэша
   */
  delete(id: string): boolean {
    return this.cache.delete(id);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Получить текущий размер кэша
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Получить информацию о кэше (для отладки)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const propertyDetailsCache = new PropertyDetailsCache(50, 30);
