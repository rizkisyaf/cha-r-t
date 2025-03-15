import axios from 'axios';
import * as dbService from './dbService';

// Fallback to backend API if configured
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Fetch historical financial data for a symbol and timeframe
 * @param {string} symbol - The trading symbol (e.g., 'BTCUSDT', 'AAPL')
 * @param {string} timeframe - The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
 * @param {number} limit - The number of candles to fetch
 * @param {number} timestamp - Optional timestamp to force cache bypass
 * @param {string} randomParam - Optional random parameter to force cache bypass
 * @param {boolean} forceBypass - Optional flag to explicitly force cache bypass
 * @param {AbortSignal} signal - Optional abort signal for request cancellation
 * @returns {Promise<Array>} - Array of OHLCV data
 */
export const fetchHistoricalData = async (symbol, timeframe, limit = 500, timestamp = null, randomParam = null, forceBypass = false, signal = null) => {
  try {
    console.log(`Fetching historical data for ${symbol} on ${timeframe} timeframe, limit: ${limit}`);
    
    // For daily timeframes, ensure we get enough historical data
    const tf = timeframe.toLowerCase();
    if (tf === '1d' || tf === 'd' || tf === 'daily') {
      console.log('Daily timeframe detected, ensuring we get enough historical data');
      // Ensure limit is at least 365 for daily timeframe to get a year of data
      limit = Math.max(limit, 365);
    }
    
    // Skip cache if timestamp is provided (force refresh) or forceBypass is true
    if (!timestamp && !forceBypass) {
      // Check if we have cached data in IndexedDB
      const cachedData = await dbService.getChartData(symbol, timeframe, limit);
      if (cachedData && cachedData.length > 0) {
        console.log(`Using cached data for ${symbol} on ${timeframe} timeframe, ${cachedData.length} candles`);
        return cachedData;
      }
    } else {
      console.log(`Cache bypass requested for ${symbol} on ${timeframe} timeframe`);
    }
    
    // For crypto symbols, try direct Binance API proxy first
    if (isCryptoSymbol(symbol) && API_URL) {
      try {
        console.log(`Trying Binance API proxy for ${symbol}`);
        // Format symbol for Binance
        const binanceSymbol = formatSymbolForBinance(symbol);
        // Map timeframe to Binance interval
        const interval = mapTimeframeToBinanceInterval(timeframe);
        
        // Add a unique cache-busting parameter if timestamp is provided
        const params = {
          symbol: binanceSymbol,
          interval,
          limit
        };
        
        if (timestamp) {
          params._ = timestamp;
          console.log(`Adding timestamp ${timestamp} to force cache bypass`);
        }
        
        if (randomParam) {
          params.random = randomParam;
          console.log(`Adding random parameter ${randomParam} to force cache bypass`);
        }
        
        if (forceBypass) {
          params.force_bypass = true;
          console.log(`Adding force_bypass=true to explicitly force cache bypass`);
        }
        
        console.log(`Making request to ${API_URL}/api/proxy/binance/klines with params:`, params);
        
        // Create request config with abort signal if provided
        const requestConfig = { params };
        if (signal) {
          requestConfig.signal = signal;
        }
        
        const response = await axios.get(`${API_URL}/api/proxy/binance/klines`, requestConfig);
        
        if (response.data && response.data.success && response.data.data) {
          console.log(`Successfully fetched data from Binance API proxy, got ${response.data.data.length} candles`);
          
          // Process the data to ensure proper format
          const processedData = response.data.data.map(candle => {
            // Ensure time is in seconds
            let time = candle.time;
            if (typeof time === 'number' && time > 10000000000) { // If time is in milliseconds
              time = Math.floor(time / 1000);
            }
            
            return {
              time,
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
              volume: parseFloat(candle.volume)
            };
          });
          
          // Validate the data
          const validData = processedData.filter(candle => 
            candle && 
            typeof candle.time === 'number' && 
            typeof candle.open === 'number' && 
            typeof candle.high === 'number' && 
            typeof candle.low === 'number' && 
            typeof candle.close === 'number' && 
            typeof candle.volume === 'number'
          );
          
          console.log(`After validation, we have ${validData.length} valid candles`);
          
          // Sort the data by time (ascending)
          validData.sort((a, b) => a.time - b.time);
          
          // Log the first and last candle
          if (validData.length > 0) {
            console.log(`First candle: ${JSON.stringify(validData[0])}`);
            console.log(`Last candle: ${JSON.stringify(validData[validData.length - 1])}`);
            console.log(`Time range: ${new Date(validData[0].time * 1000).toISOString()} to ${new Date(validData[validData.length - 1].time * 1000).toISOString()}`);
          }
          
          // Save to IndexedDB
          await dbService.saveChartData(symbol, timeframe, limit, validData);
          
          return validData;
        } else {
          console.warn('Binance API proxy returned invalid data format:', response.data);
          throw new Error('Invalid data format from Binance API proxy');
        }
      } catch (binanceError) {
        console.warn('Error fetching data from Binance API proxy:', binanceError);
        // Try our backend API next
      }
    }
    
    // Try our backend API which uses Binance for crypto
    if (API_URL) {
      try {
        console.log(`Trying backend API at ${API_URL}/api/financial-data`);
        
        // Add a unique cache-busting parameter if timestamp is provided
        const params = {
          symbol,
          timeframe,
          limit
        };
        
        if (timestamp) {
          params._ = timestamp;
          console.log(`Adding timestamp ${timestamp} to force cache bypass for backend API`);
        }
        
        if (randomParam) {
          params.random = randomParam;
          console.log(`Adding random parameter ${randomParam} to force cache bypass for backend API`);
        }
        
        if (forceBypass) {
          params.force_bypass = true;
          console.log(`Adding force_bypass=true to explicitly force cache bypass for backend API`);
        }
        
        // Create request config with abort signal if provided
        const requestConfig = { params };
        if (signal) {
          requestConfig.signal = signal;
        }
        
        const response = await axios.get(`${API_URL}/api/financial-data`, requestConfig);
        
        if (response.data && response.data.success && response.data.data) {
          console.log(`Successfully fetched data from backend API, got ${response.data.data.length} candles`);
          
          // Process the data to ensure proper format
          const processedData = response.data.data.map(candle => {
            // Ensure time is in seconds
            let time = candle.time;
            if (typeof time === 'number' && time > 10000000000) { // If time is in milliseconds
              time = Math.floor(time / 1000);
            }
            
            return {
              time,
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
              volume: parseFloat(candle.volume)
            };
          });
          
          // Sort the data by time (ascending)
          processedData.sort((a, b) => a.time - b.time);
          
          // Log the first and last candle
          if (processedData.length > 0) {
            console.log(`First candle: ${JSON.stringify(processedData[0])}`);
            console.log(`Last candle: ${JSON.stringify(processedData[processedData.length - 1])}`);
            console.log(`Time range: ${new Date(processedData[0].time * 1000).toISOString()} to ${new Date(processedData[processedData.length - 1].time * 1000).toISOString()}`);
          }
          
          // Save to IndexedDB
          await dbService.saveChartData(symbol, timeframe, limit, processedData);
          
          return processedData;
        } else {
          console.warn('Backend API returned invalid data format:', response.data);
          throw new Error('Invalid data format from backend API');
        }
      } catch (backendError) {
        console.warn('Error fetching data from backend API:', backendError);
        throw new Error(`Failed to fetch data: ${backendError.message}`);
      }
    }
    
    // If we get here, throw an error
    throw new Error(`No data source available for symbol: ${symbol}`);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error; // Propagate the error instead of returning mock data
  }
};

/**
 * Format symbol for Binance API
 * @param {string} symbol - The trading symbol
 * @returns {string} - Formatted symbol for Binance
 */
const formatSymbolForBinance = (symbol) => {
  // Remove any spaces or special characters
  symbol = symbol.replace('-', '').replace('/', '').replace(' ', '');
  
  // Ensure USDT pairs are properly formatted
  if (!symbol.toUpperCase().includes('USDT') && symbol.toUpperCase().includes('BTC')) {
    return symbol.toUpperCase();
  } else if (!symbol.toUpperCase().includes('USDT')) {
    return symbol.toUpperCase() + 'USDT';
  }
  
  return symbol.toUpperCase();
};

/**
 * Map timeframe to Binance interval
 * @param {string} timeframe - The timeframe
 * @returns {string} - Binance interval
 */
const mapTimeframeToBinanceInterval = (timeframe) => {
  const tf = timeframe.toLowerCase();
  
  // Direct mappings
  if (['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'].includes(tf)) {
    return tf;
  }
  
  // Other common formats
  if (tf === '1min') return '1m';
  if (tf === '5min') return '5m';
  if (tf === '15min') return '15m';
  if (tf === '30min') return '30m';
  if (tf === '60min' || tf === 'h') return '1h';
  if (tf === 'd' || tf === 'daily') return '1d';
  if (tf === 'w' || tf === 'weekly') return '1w';
  if (tf === 'm' || tf === 'monthly') return '1M';
  
  // Default to 1 hour
  return '1h';
};

/**
 * Check if a symbol is a cryptocurrency
 * @param {string} symbol - The trading symbol
 * @returns {boolean} - True if the symbol is a cryptocurrency
 */
const isCryptoSymbol = (symbol) => {
  const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE', 'USDT'];
  const upperSymbol = symbol.toUpperCase();
  
  // Check if the symbol contains any known crypto symbol
  return cryptoSymbols.some(crypto => upperSymbol.includes(crypto)) || 
         upperSymbol.endsWith('USDT') || 
         upperSymbol.endsWith('BTC') || 
         upperSymbol.endsWith('ETH');
};

/**
 * Fetch real-time data for a symbol
 * @param {string} symbol - The trading symbol
 * @returns {Promise<Object>} - Latest candle data
 */
export const fetchRealTimeData = async (symbol) => {
  try {
    // For crypto symbols, try Binance first
    if (isCryptoSymbol(symbol) && API_URL) {
      try {
        // Format symbol for Binance
        const binanceSymbol = formatSymbolForBinance(symbol);
        
        // Get the latest data point from Binance (using 1m timeframe)
        const response = await axios.get(`${API_URL}/api/proxy/binance/klines`, {
          params: {
            symbol: binanceSymbol,
            interval: '1m',
            limit: 1
          }
        });
        
        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
          return response.data.data[0];
        }
        
        throw new Error('No real-time data available from Binance');
      } catch (binanceError) {
        console.warn('Error fetching real-time data from Binance:', binanceError);
        throw binanceError;
      }
    }
    
    // Fallback to backend API if available
    if (API_URL) {
      try {
        const response = await axios.get(`${API_URL}/api/financial-data/realtime`, {
          params: { symbol }
        });
        
        if (response.data && response.data.success && response.data.latest_data) {
          return formatCandle(response.data.latest_data);
        }
        
        throw new Error('Invalid data format from backend API');
      } catch (backendError) {
        console.error('Error fetching real-time data from backend:', backendError);
        throw new Error(`Failed to fetch real-time data: ${backendError.message}`);
      }
    }
    
    throw new Error('No data source available for real-time data');
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    throw error;
  }
};

/**
 * Format raw data for Lightweight Charts
 * @param {Array|Object} data - Raw data from API
 * @returns {Array} - Formatted data for Lightweight Charts
 */
export const formatChartData = (data) => {
  if (!data) return [];
  
  // Handle different data formats
  let candles = [];
  
  if (Array.isArray(data)) {
    candles = data;
  } else if (data.candles && Array.isArray(data.candles)) {
    candles = data.candles;
  } else if (data.data && Array.isArray(data.data)) {
    candles = data.data;
  }
  
  // Format each candle for Lightweight Charts
  return candles.map(formatCandle);
};

/**
 * Format a single candle for Lightweight Charts
 * @param {Object} candle - Raw candle data
 * @returns {Object} - Formatted candle for Lightweight Charts
 */
export const formatCandle = (candle) => {
  if (!candle) return null;
  
  // Ensure time is in seconds (not milliseconds)
  let time = candle.time;
  if (typeof time === 'string') {
    time = new Date(time).getTime() / 1000;
  } else if (time && time.toString().length > 10) {
    time = Math.floor(time / 1000);
  }
  
  return {
    time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  };
};

/**
 * Subscribe to real-time updates for a symbol
 * @param {string} symbol - The trading symbol
 * @param {function} callback - Callback function to handle new data
 * @returns {Promise<Object>} - Subscription object with unsubscribe method
 */
// Keep track of active WebSocket connections
const activeWebSockets = {};

export const subscribeToRealTimeUpdates = async (symbol, callback) => {
  try {
    // Format symbol for Binance
    const binanceSymbol = formatSymbolForBinance(symbol);
    const wsKey = `${binanceSymbol.toLowerCase()}_kline_1m`;
    
    // Check if we already have an active connection for this symbol
    if (activeWebSockets[wsKey]) {
      console.log(`Reusing existing WebSocket connection for ${binanceSymbol}`);
      
      // Add the new callback to the existing connection
      const existingCallbacks = activeWebSockets[wsKey].callbacks || [];
      activeWebSockets[wsKey].callbacks = [...existingCallbacks, callback];
      
      // Return an unsubscribe function that removes only this callback
      return {
        unsubscribe: () => {
          console.log(`Removing callback for ${binanceSymbol}`);
          if (activeWebSockets[wsKey]) {
            activeWebSockets[wsKey].callbacks = activeWebSockets[wsKey].callbacks.filter(cb => cb !== callback);
            
            // If no callbacks remain, close the WebSocket
            if (activeWebSockets[wsKey].callbacks.length === 0) {
              console.log(`No callbacks remain for ${binanceSymbol}, closing WebSocket`);
              if (activeWebSockets[wsKey].ws && activeWebSockets[wsKey].ws.readyState === WebSocket.OPEN) {
                activeWebSockets[wsKey].ws.close();
              }
              delete activeWebSockets[wsKey];
            }
          }
        }
      };
    }
    
    // Get WebSocket connection details from backend
    let wsUrl;
    
    if (API_URL) {
      try {
        // Get WebSocket details from our backend proxy
        const response = await axios.get(`${API_URL}/api/websocket/binance`, {
          params: {
            symbol: binanceSymbol.toLowerCase(),
            stream_type: 'kline_1m'
          }
        });
        
        if (response.data && response.data.success && response.data.websocket_url) {
          wsUrl = response.data.websocket_url;
          console.log(`Using WebSocket URL from backend: ${wsUrl}`);
        } else {
          throw new Error('Invalid WebSocket details from backend');
        }
      } catch (error) {
        console.warn('Error getting WebSocket details from backend:', error);
        // Fall back to direct connection
        wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_1m`;
      }
    } else {
      // Direct connection to Binance WebSocket
      wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_1m`;
    }
    
    // Create WebSocket connection
    console.log(`Creating WebSocket connection to: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    
    // Track the last candle to avoid duplicate updates
    let lastCandle = null;
    
    // Store the WebSocket and callbacks in our cache
    activeWebSockets[wsKey] = {
      ws,
      callbacks: [callback],
      lastCandle
    };
    
    // Handle WebSocket open event
    ws.onopen = () => {
      console.log(`WebSocket connection opened for ${binanceSymbol}`);
    };
    
    // Handle WebSocket messages
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Ensure we have kline data
        if (data && data.k) {
          const kline = data.k;
          
          // Only process completed candles or significant updates
          if (kline.x || !activeWebSockets[wsKey].lastCandle) { // x = is this kline closed?
            const candle = {
              time: Math.floor(kline.t / 1000), // Convert from ms to seconds
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v)
            };
            
            // Update last candle reference
            activeWebSockets[wsKey].lastCandle = candle;
            
            // Call all callbacks with the new candle
            activeWebSockets[wsKey].callbacks.forEach(cb => {
              try {
                cb(candle);
              } catch (callbackError) {
                console.error('Error in WebSocket callback:', callbackError);
              }
            });
          } else if (activeWebSockets[wsKey].lastCandle) {
            // Update the current candle with latest data
            const lastCandle = activeWebSockets[wsKey].lastCandle;
            const updatedCandle = {
              ...lastCandle,
              high: Math.max(lastCandle.high, parseFloat(kline.h)),
              low: Math.min(lastCandle.low, parseFloat(kline.l)),
              close: parseFloat(kline.c),
              volume: parseFloat(kline.v)
            };
            
            // Update last candle reference
            activeWebSockets[wsKey].lastCandle = updatedCandle;
            
            // Call all callbacks with the updated candle
            activeWebSockets[wsKey].callbacks.forEach(cb => {
              try {
                cb(updatedCandle);
              } catch (callbackError) {
                console.error('Error in WebSocket callback:', callbackError);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error(`WebSocket error for ${binanceSymbol}:`, error);
      
      // Remove from active connections
      delete activeWebSockets[wsKey];
      
      // Fall back to polling if WebSocket fails
      const intervalId = fallbackToPolling(symbol, callback);
      
      return {
        unsubscribe: () => {
          clearInterval(intervalId);
        }
      };
    };
    
    // Handle WebSocket close
    ws.onclose = () => {
      console.log(`WebSocket connection closed for ${binanceSymbol}`);
      
      // Remove from active connections if this specific connection
      if (activeWebSockets[wsKey] && activeWebSockets[wsKey].ws === ws) {
        delete activeWebSockets[wsKey];
      }
    };
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from WebSocket for ${binanceSymbol}`);
        if (activeWebSockets[wsKey]) {
          // Remove this callback
          activeWebSockets[wsKey].callbacks = activeWebSockets[wsKey].callbacks.filter(cb => cb !== callback);
          
          // If no callbacks remain, close the WebSocket
          if (activeWebSockets[wsKey].callbacks.length === 0) {
            console.log(`No callbacks remain for ${binanceSymbol}, closing WebSocket`);
            if (activeWebSockets[wsKey].ws && activeWebSockets[wsKey].ws.readyState === WebSocket.OPEN) {
              activeWebSockets[wsKey].ws.close();
            }
            delete activeWebSockets[wsKey];
          }
        }
      }
    };
  } catch (error) {
    console.error('Error setting up WebSocket connection:', error);
    
    // Fall back to polling if WebSocket setup fails
    const intervalId = fallbackToPolling(symbol, callback);
    
    return {
      unsubscribe: () => {
        clearInterval(intervalId);
      }
    };
  }
};

/**
 * Fallback to polling if WebSocket fails
 * @param {string} symbol - The trading symbol
 * @param {function} callback - Callback function to handle new data
 * @returns {number} - Interval ID for the polling
 */
const fallbackToPolling = (symbol, callback) => {
  console.warn(`Falling back to polling for ${symbol}`);
  
  // Poll every 10 seconds as a fallback
  return setInterval(async () => {
    try {
      const latestData = await fetchRealTimeData(symbol);
      callback(latestData);
    } catch (error) {
      console.error('Error in fallback polling update:', error);
    }
  }, 10000); // Poll every 10 seconds
}; 