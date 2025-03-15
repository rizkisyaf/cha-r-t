/**
 * Database service for caching chart data using IndexedDB
 */

// Database configuration
const DB_NAME = 'chartDataDB';
const DB_VERSION = 1;
const CHART_STORE = 'chartData';
const CACHE_EXPIRY_STORE = 'cacheExpiry';

// Cache expiry times (in milliseconds)
const CACHE_DURATION = {
  '1m': 5 * 60 * 1000, // 5 minutes
  '5m': 15 * 60 * 1000, // 15 minutes
  '15m': 30 * 60 * 1000, // 30 minutes
  '30m': 60 * 60 * 1000, // 1 hour
  '1h': 2 * 60 * 60 * 1000, // 2 hours
  '4h': 4 * 60 * 60 * 1000, // 4 hours
  '1d': 24 * 60 * 60 * 1000, // 24 hours
  '1w': 7 * 24 * 60 * 60 * 1000, // 7 days
  'default': 60 * 60 * 1000 // 1 hour default
};

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>} - The database instance
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('Your browser doesn\'t support IndexedDB');
      reject('IndexedDB not supported');
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('Database upgrade needed');

      // Create object stores
      if (!db.objectStoreNames.contains(CHART_STORE)) {
        const chartStore = db.createObjectStore(CHART_STORE, { keyPath: 'id' });
        chartStore.createIndex('symbol', 'symbol', { unique: false });
        chartStore.createIndex('timeframe', 'timeframe', { unique: false });
        console.log('Chart data store created');
      }

      if (!db.objectStoreNames.contains(CACHE_EXPIRY_STORE)) {
        const expiryStore = db.createObjectStore(CACHE_EXPIRY_STORE, { keyPath: 'id' });
        console.log('Cache expiry store created');
      }
    };
  });
};

/**
 * Get chart data from the database
 * @param {string} symbol - The trading symbol
 * @param {string} timeframe - The timeframe
 * @param {number} limit - The number of candles
 * @returns {Promise<Array|null>} - The chart data or null if not found or expired
 */
export const getChartData = async (symbol, timeframe, limit) => {
  try {
    const db = await initDB();
    const id = `${symbol}_${timeframe}_${limit}`;

    // Check if cache is expired
    const expiryData = await new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_EXPIRY_STORE, 'readonly');
      const store = transaction.objectStore(CACHE_EXPIRY_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => {
        console.error('Error getting cache expiry:', event.target.error);
        reject(event.target.error);
      };
    });

    const now = Date.now();
    if (!expiryData || now > expiryData.expiry) {
      console.log(`Cache expired or not found for ${symbol} on ${timeframe} timeframe`);
      return null;
    }

    // Get chart data
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHART_STORE, 'readonly');
      const store = transaction.objectStore(CHART_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Retrieved ${request.result.data.length} candles from cache for ${symbol} on ${timeframe} timeframe`);
          resolve(request.result.data);
        } else {
          console.log(`No cached data found for ${symbol} on ${timeframe} timeframe`);
          resolve(null);
        }
      };

      request.onerror = (event) => {
        console.error('Error getting chart data:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error in getChartData:', error);
    return null;
  }
};

/**
 * Save chart data to the database
 * @param {string} symbol - The trading symbol
 * @param {string} timeframe - The timeframe
 * @param {number} limit - The number of candles
 * @param {Array} data - The chart data to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveChartData = async (symbol, timeframe, limit, data) => {
  try {
    const db = await initDB();
    const id = `${symbol}_${timeframe}_${limit}`;

    // Save chart data
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(CHART_STORE, 'readwrite');
      const store = transaction.objectStore(CHART_STORE);
      const request = store.put({
        id,
        symbol,
        timeframe,
        limit,
        data,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        console.log(`Saved ${data.length} candles to cache for ${symbol} on ${timeframe} timeframe`);
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error saving chart data:', event.target.error);
        reject(event.target.error);
      };
    });

    // Save cache expiry
    const duration = CACHE_DURATION[timeframe] || CACHE_DURATION.default;
    const expiry = Date.now() + duration;

    await new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_EXPIRY_STORE, 'readwrite');
      const store = transaction.objectStore(CACHE_EXPIRY_STORE);
      const request = store.put({
        id,
        expiry
      });

      request.onsuccess = () => {
        console.log(`Set cache expiry for ${symbol} on ${timeframe} timeframe to ${new Date(expiry).toLocaleString()}`);
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error saving cache expiry:', event.target.error);
        reject(event.target.error);
      };
    });

    return true;
  } catch (error) {
    console.error('Error in saveChartData:', error);
    return false;
  }
};

/**
 * Clear all chart data from the database
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearAllChartData = async () => {
  try {
    const db = await initDB();

    // Clear chart data
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(CHART_STORE, 'readwrite');
      const store = transaction.objectStore(CHART_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Cleared all chart data from cache');
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error clearing chart data:', event.target.error);
        reject(event.target.error);
      };
    });

    // Clear cache expiry
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(CACHE_EXPIRY_STORE, 'readwrite');
      const store = transaction.objectStore(CACHE_EXPIRY_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Cleared all cache expiry data');
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error clearing cache expiry:', event.target.error);
        reject(event.target.error);
      };
    });

    return true;
  } catch (error) {
    console.error('Error in clearAllChartData:', error);
    return false;
  }
};

/**
 * Clear chart data for a specific symbol and timeframe
 * @param {string} symbol - The trading symbol
 * @param {string} timeframe - The timeframe
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearChartData = async (symbol, timeframe) => {
  try {
    const db = await initDB();

    // Get all keys for the symbol and timeframe
    const keys = await new Promise((resolve, reject) => {
      const transaction = db.transaction(CHART_STORE, 'readonly');
      const store = transaction.objectStore(CHART_STORE);
      const index = store.index('symbol');
      const request = index.getAllKeys(symbol);

      request.onsuccess = () => {
        const allKeys = request.result;
        const filteredKeys = allKeys.filter(key => key.includes(`${symbol}_${timeframe}`));
        resolve(filteredKeys);
      };

      request.onerror = (event) => {
        console.error('Error getting keys:', event.target.error);
        reject(event.target.error);
      };
    });

    // Delete chart data
    for (const key of keys) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(CHART_STORE, 'readwrite');
        const store = transaction.objectStore(CHART_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error deleting chart data:', event.target.error);
          reject(event.target.error);
        };
      });

      // Delete cache expiry
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(CACHE_EXPIRY_STORE, 'readwrite');
        const store = transaction.objectStore(CACHE_EXPIRY_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error deleting cache expiry:', event.target.error);
          reject(event.target.error);
        };
      });
    }

    console.log(`Cleared cache for ${symbol} on ${timeframe} timeframe`);
    return true;
  } catch (error) {
    console.error('Error in clearChartData:', error);
    return false;
  }
};

export default {
  initDB,
  getChartData,
  saveChartData,
  clearChartData,
  clearAllChartData
}; 