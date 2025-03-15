import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import * as chartDataService from '../../services/chartDataService';
import dbService from '../../services/dbService'; // Import as default

const PaneContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || '100%'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PaneHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: var(--secondary-color);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-color);
  height: 24px;
`;

const PaneTitle = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const PaneValue = styled.div`
  margin-left: 8px;
  color: ${props => props.color || 'var(--text-color)'};
  font-weight: 500;
  background: transparent;
`;

const OHLCVInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  font-size: 11px;
`;

const OHLCVItem = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
`;

const OHLCVLabel = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-right: 4px;
  font-weight: 500;
`;

const OHLCVValue = styled.div`
  font-size: 11px;
  color: var(--text-color);
  font-weight: 500;
`;

const PriceChange = styled.div`
  color: ${props => props.$isPositive ? '#26A69A' : '#EF5350'};
  font-weight: 500;
`;

const PaneControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PaneButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--text-color);
  }
`;

const ChartCanvas = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  overflow: hidden;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  font-size: 14px;
  z-index: 10;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--error-color);
  font-size: 14px;
  z-index: 10;
  padding: 16px;
  text-align: center;
`;

const ErrorTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const ErrorMessage = styled.div`
  margin-bottom: 16px;
`;

const PriceScaleButtons = styled.div`
  position: absolute;
  right: 5px;
  bottom: 5px;
  display: flex;
  flex-direction: row;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 100;
`;

const ScaleButton = styled.button`
  background: ${props => props.$isActive ? '#363c4e' : '#2b2b43'};
  border: 1px solid #363c4e;
  color: ${props => props.$isActive ? '#4caf50' : '#d1d4dc'};
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  margin: 0;
  
  &:hover {
    background: #363c4e;
  }
`;

const PriceScaleOverlay = styled.div`
  position: absolute;
  right: 0;
  bottom: 25px; /* Position above the time scale */
  height: 100px;
  width: 35px;
  z-index: 99;
  cursor: default;
  
  &:hover ${PriceScaleButtons} {
    opacity: 1;
  }
`;

const ChartPane = ({
  symbol = 'BTCUSDT', 
  timeframe = '1d', 
  height,
  indicators = [],
  onCrosshairMove,
  onChartReady,
  onDataLoaded,
  onClose,
  onSettings,
  onFullscreen,
  isFullscreen = false,
  id = 'main'
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({
    main: null,
    volume: null,
    indicators: {}
  });
  const dataFetchedRef = useRef(false);
  
  const [chartData, setChartData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCandle, setLastCandle] = useState(null);
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 });
  const [subscription, setSubscription] = useState(null);
  const [chartKey, setChartKey] = useState(`${symbol}-${timeframe}-${Date.now()}`);
  const [isAutoScale, setIsAutoScale] = useState(true);
  const [isLogScale, setIsLogScale] = useState(true);
  
  // Format price with appropriate precision
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '';
    
    if (price < 0.1) {
      return price.toFixed(6);
    } else if (price < 1) {
      return price.toFixed(4);
    } else if (price < 10) {
      return price.toFixed(3);
    } else if (price < 1000) {
      return price.toFixed(2);
    } else {
      return price.toFixed(0);
    }
  };
  
  // Function to calculate visible range based on timeframe
  const calculateVisibleRange = (data, tf) => {
    if (!data || data.length === 0) return null;
    
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    const lastTimestamp = sortedData[sortedData.length - 1].time;
    
    // TradingView-style timeframe-based calculations
    let barsToShow;
    let barDuration;
    
    switch(tf) {
      case '1m':
        barsToShow = 240; // Show 4 hours of 1-minute bars
        barDuration = 60; // 60 seconds
        break;
      case '5m':
        barsToShow = 288; // Show 1 day of 5-minute bars
        barDuration = 300; // 300 seconds
        break;
      case '15m':
        barsToShow = 192; // Show 2 days of 15-minute bars
        barDuration = 900; // 900 seconds
        break;
      case '30m':
        barsToShow = 192; // Show 4 days of 30-minute bars
        barDuration = 1800; // 1800 seconds
        break;
      case '1h':
        barsToShow = 168; // Show 7 days of hourly bars
        barDuration = 3600; // 3600 seconds
        break;
      case '4h':
        barsToShow = 180; // Show 30 days of 4-hour bars
        barDuration = 14400; // 14400 seconds
        break;
      case '1d':
      case 'd':
      case 'daily':
        barsToShow = 365; // Show 1 year of daily bars
        barDuration = 86400; // 86400 seconds
        break;
      case '1w':
      case 'w':
        barsToShow = 156; // Show 3 years of weekly bars
        barDuration = 604800; // 604800 seconds
        break;
      default:
        barsToShow = 200;
        barDuration = 86400;
    }
    
    // Calculate range based on the actual data we have
    // Make sure we don't try to show more bars than we have data for
    const availableBars = sortedData.length;
    const barsToActuallyShow = Math.min(barsToShow, availableBars);
    
    // If we have enough data, show the most recent bars
    // Otherwise, show all available data
    let rangeStart;
    if (availableBars >= barsToShow) {
      rangeStart = lastTimestamp - (barsToActuallyShow * barDuration);
    } else {
      // If we don't have enough data, show all available data
      rangeStart = sortedData[0].time;
    }
    
    const rangeEnd = lastTimestamp + (2 * barDuration); // Add two bars of padding
    
    console.log(`Calculated range for ${tf}: From ${new Date(rangeStart * 1000).toISOString()} to ${new Date(rangeEnd * 1000).toISOString()}`);
    console.log(`Showing ${barsToActuallyShow} bars out of ${availableBars} available bars`);
    
    return { from: rangeStart, to: rangeEnd };
  };

  // Function to initialize chart
  const initializeChart = () => {
    if (!chartContainerRef.current) return;
    
    // Clear previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current.main = null;
      seriesRef.current.volume = null;
    }
    
    console.log('Initializing chart...');
    
    try {
      // Create a chart with proper options for v5.0.3
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { color: '#1e222d' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#2b2b43' },
          horzLines: { color: '#2b2b43' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
        },
        rightPriceScale: {
          mode: 2, // Logarithmic
          autoScale: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
          borderVisible: true,
          entireTextOnly: true,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: '#758696',
            style: 3,
          },
          horzLine: {
            width: 1,
            color: '#758696',
            style: 3,
          },
        },
      });
      
      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        priceScaleId: 'right',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });

      // Create volume series with proper scaling
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Configure volume scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
        visible: false,
        autoScale: true,
      });

      // Save references
      chartRef.current = chart;
      seriesRef.current.main = candlestickSeries;
      seriesRef.current.volume = volumeSeries;

      // Function to update volume colors
      const updateVolumeData = (data) => {
        if (!data || !Array.isArray(data)) return;
        
        const volumeData = data.map(candle => ({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open ? '#26a69a' : '#ef5350'
        }));
        
        volumeSeries.setData(volumeData);
      };

      // Subscribe to data updates
      const handleDataUpdate = (data) => {
        if (data && data.length > 0) {
          updateVolumeData(data);
        }
      };

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Add price scale controls
      const toggleAutoScale = () => {
        const newAutoScale = !isAutoScale;
        setIsAutoScale(newAutoScale);
        if (chartRef.current) {
          const priceScale = chartRef.current.priceScale('right');
          priceScale.applyOptions({
            autoScale: newAutoScale,
            entireTextOnly: true
          });
          if (newAutoScale) {
            // Use proper method to auto-scale
            chartRef.current.timeScale().fitContent();
          }
        }
      };

      const toggleLogScale = () => {
        const newLogScale = !isLogScale;
        setIsLogScale(newLogScale);
        if (chartRef.current) {
          chartRef.current.priceScale('right').applyOptions({
            mode: newLogScale ? 2 : 0
          });
        }
      };

      // Add the JSX for price scale buttons inside the ChartCanvas
      const priceScaleControls = (
        <PriceScaleOverlay>
          <PriceScaleButtons>
            <ScaleButton 
              onClick={() => {
                const newAutoScale = !isAutoScale;
                setIsAutoScale(newAutoScale);
                if (chartRef.current) {
                  const priceScale = chartRef.current.priceScale('right');
                  priceScale.applyOptions({
                    autoScale: newAutoScale,
                    entireTextOnly: true
                  });
                  if (newAutoScale) {
                    // Use proper method to auto-scale
                    chartRef.current.timeScale().fitContent();
                  }
                }
              }} 
              title="Auto Scale"
              $isActive={isAutoScale}
            >
              A
            </ScaleButton>
            <ScaleButton 
              onClick={() => {
                const newLogScale = !isLogScale;
                setIsLogScale(newLogScale);
                if (chartRef.current) {
                  chartRef.current.priceScale('right').applyOptions({
                    mode: newLogScale ? 2 : 0
                  });
                }
              }}
              title="Logarithmic Scale"
              $isActive={isLogScale}
            >
              L
            </ScaleButton>
          </PriceScaleButtons>
        </PriceScaleOverlay>
      );

      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current.main = null;
          seriesRef.current.volume = null;
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
      return () => {};
    }
  };

  // Function to fetch data
  const fetchData = async () => {
    if (!symbol || !timeframe) {
      console.log('Symbol or timeframe not provided, skipping data fetch');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Create an AbortController for this fetch operation
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    try {
      console.log(`Fetching data for ${symbol} on ${timeframe} timeframe`);
      
      // TradingView-style data limits
      let limit;
      switch(timeframe) {
        case '1m':
          limit = 1000; // Last ~16 hours
          break;
        case '5m':
          limit = 1000; // Last ~3.5 days
          break;
        case '15m':
          limit = 1000; // Last ~10 days
          break;
        case '30m':
          limit = 1000; // Last ~20 days
          break;
        case '1h':
          limit = 1000; // Last ~41 days
          break;
        case '4h':
          limit = 1000; // Last ~166 days
          break;
        case '1d':
        case 'd':
        case 'daily':
          limit = 1000; // Last ~3 years
          break;
        case '1w':
        case 'w':
          limit = 500; // Last ~10 years
          break;
        default:
          limit = 1000;
      }
      
      // Clear the backend cache first
      const API_URL = process.env.REACT_APP_API_URL || '';
      const clearCacheTimestamp = Date.now();
      
      console.log(`Clearing backend cache for ${symbol} on ${timeframe} timeframe`);
      
      try {
        // Make a request to clear the cache with the abort signal
        const clearCacheResponse = await fetch(
          `${API_URL}/api/clear-cache?symbol=${symbol}&timeframe=${timeframe}&_=${clearCacheTimestamp}`,
          { signal }
        );
        const clearCacheResult = await clearCacheResponse.json();
        
        console.log('Cache clear response:', clearCacheResult);
        
        if (clearCacheResult.success) {
          console.log('Successfully cleared cache:', clearCacheResult.message);
        } else {
          console.warn('Failed to clear cache:', clearCacheResult.error);
        }
      } catch (cacheError) {
        // If this is an abort error, rethrow it
        if (cacheError.name === 'AbortError') {
          throw cacheError;
        }
        console.warn('Error clearing cache:', cacheError);
      }
      
      // Always force a cache bypass when fetching data for a new timeframe
      const timestamp = Date.now();
      console.log(`Forcing cache bypass with timestamp: ${timestamp}`);
      
      // Generate a random parameter to ensure cache bypass
      const randomParam = Math.random().toString(36).substring(2, 15);
      
      // Fetch historical data with explicit cache bypass
      const historicalData = await chartDataService.fetchHistoricalData(
        symbol, 
        timeframe, 
        limit, 
        timestamp, 
        randomParam, 
        true, 
        signal
      );
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error(`No data returned for ${symbol} on ${timeframe} timeframe`);
      }
      
      console.log(`Fetched ${historicalData.length} candles for ${symbol} on ${timeframe} timeframe`);
      console.log(`First candle time: ${new Date(historicalData[0].time * 1000).toISOString()}`);
      console.log(`Last candle time: ${new Date(historicalData[historicalData.length - 1].time * 1000).toISOString()}`);
      
      // Process and set data
      const chartData = historicalData.map(candle => ({
        time: candle.time,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      }));
      
      const volumeData = historicalData.map(candle => ({
        time: candle.time,
        value: parseFloat(candle.volume),
        color: parseFloat(candle.close) >= parseFloat(candle.open) ? '#26a69a' : '#ef5350',
      }));
      
      // Set data to state and chart
      setChartData(chartData);
      setVolumeData(volumeData);
      
      if (seriesRef.current.main) {
        console.log('Setting data to candlestick series...');
        seriesRef.current.main.setData(chartData);
      }
      
      if (seriesRef.current.volume) {
        console.log('Setting data to volume series...');
        seriesRef.current.volume.setData(volumeData);
      }
      
      // Calculate and set visible range
      const visibleRange = calculateVisibleRange(chartData, timeframe);
      if (visibleRange && chartRef.current) {
        console.log(`Setting visible range for ${timeframe}: ${JSON.stringify(visibleRange)}`);
        chartRef.current.timeScale().setVisibleRange(visibleRange);
      }
      
      // Calculate price change
      if (chartData.length > 1) {
        const firstCandle = chartData[0];
        const lastCandle = chartData[chartData.length - 1];
        const change = lastCandle.close - firstCandle.close;
        const percentChange = (change / firstCandle.close) * 100;
        
        setPriceChange({
          value: change,
          percent: percentChange
        });
        
        setLastCandle(lastCandle);
      }
      
      // Mark data as fetched
      dataFetchedRef.current = true;
      
      // Setup WebSocket after data is loaded
      setupWebSocket();
      
    } catch (err) {
      // Skip if this was an abort error
      if (err.name === 'AbortError') {
        console.log('Data fetch aborted due to new request');
        return;
      }
      
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
    
    // Return the abort controller so the caller can cancel the request if needed
    return abortController;
  };

  // Function to setup WebSocket
  const setupWebSocket = () => {
    // Skip if already subscribed or no data fetched yet
    if (subscription || !dataFetchedRef.current) {
      return;
    }
    
    console.log(`Setting up WebSocket for ${symbol} on ${timeframe} timeframe`);
    
    // Setup WebSocket subscription for real-time updates
    chartDataService.subscribeToRealTimeUpdates(symbol, (newCandle) => {
      if (!seriesRef.current.main || !seriesRef.current.volume) {
        console.log('Chart series not available, skipping update');
        return;
      }
      
      try {
        // If we have a real candle, use it
        if (newCandle && newCandle.time && 
            typeof newCandle.open === 'number' && 
            typeof newCandle.high === 'number' && 
            typeof newCandle.low === 'number' && 
            typeof newCandle.close === 'number') {
          
          console.log(`Received real-time update for ${symbol}: ${JSON.stringify(newCandle)}`);
          
          // Update candlestick series with proper validation
          const candleData = {
            time: newCandle.time,
            open: Number(newCandle.open),
            high: Number(newCandle.high),
            low: Number(newCandle.low),
            close: Number(newCandle.close)
          };
          
          seriesRef.current.main.update(candleData);
          
          // Update volume series with proper validation
          if (typeof newCandle.volume === 'number') {
            const volumeData = {
              time: newCandle.time,
              value: Number(newCandle.volume),
              color: newCandle.close >= newCandle.open ? '#26a69a' : '#ef5350'
            };
            
            seriesRef.current.volume.update(volumeData);
          }
          
          // Update last candle
          setLastCandle(newCandle);
        } else {
          console.warn('Received invalid candle data:', newCandle);
        }
      } catch (e) {
        console.warn('Error updating chart with real-time data:', e);
      }
    }).then(sub => {
      console.log('WebSocket subscription established');
      setSubscription(sub);
    }).catch(err => {
      console.error('Error setting up WebSocket subscription:', err);
    });
  };

  // Effect to initialize chart and fetch data
  useEffect(() => {
    // Initialize database
    dbService.initDB().catch(err => {
      console.error('Error initializing database:', err);
    });
    
    // Initialize chart
    const chartCleanup = initializeChart();
    
    // Fetch data
    fetchData();
    
    return () => {
      // Cleanup chart
      if (chartCleanup && typeof chartCleanup === 'function') {
        chartCleanup();
      }
      
      // Cleanup WebSocket
      if (subscription) {
        console.log('Cleaning up WebSocket subscription');
        subscription.unsubscribe();
      }
    };
  }, []);

  // Effect to handle symbol or timeframe changes
  useEffect(() => {
    console.log(`TIMEFRAME CHANGED TO: ${timeframe} - REINITIALIZING CHART`);
    
    // Create an AbortController to cancel any in-flight requests
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    // Force a complete reset of the chart key to trigger a full rerender
    const newChartKey = `${symbol}-${timeframe}-${Date.now()}`;
    console.log(`Forcing chart key update: ${newChartKey}`);
    setChartKey(newChartKey);
    
    // Complete cleanup of previous chart and data
    if (subscription) {
      console.log('Cleaning up WebSocket subscription');
      subscription.unsubscribe();
      setSubscription(null);
    }
    
    if (chartRef.current) {
      console.log('Removing existing chart');
      chartRef.current.remove();
      chartRef.current = null;
    }
    
    // Reset all state
    seriesRef.current = {
      main: null,
      volume: null,
      indicators: {}
    };
    dataFetchedRef.current = false;
    setChartData([]);
    setVolumeData([]);
    setLastCandle(null);
    setPriceChange({ value: 0, percent: 0 });
    setError(null);
    setIsLoading(true);
    
    // Use a flag to track if this effect is still the most recent one
    let isCurrentRequest = true;
    
    // Force a small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      // Skip if this effect has been superseded by a newer one
      if (!isCurrentRequest) {
        console.log('Skipping stale request');
        return;
      }
      
      // Initialize new chart
      console.log('Creating new chart for timeframe:', timeframe);
      // Store the cleanup function returned by initializeChart
      const chartCleanup = initializeChart();
      
      // Format symbol for Binance
      const formatSymbolForBinance = (symbol) => {
        // Remove any spaces or special characters
        let formattedSymbol = symbol.replace('-', '').replace('/', '').replace(' ', '');
        
        // Ensure USDT pairs are properly formatted
        if (!formattedSymbol.toUpperCase().includes('USDT') && formattedSymbol.toUpperCase().includes('BTC')) {
          return formattedSymbol.toUpperCase();
        } else if (!formattedSymbol.toUpperCase().includes('USDT')) {
          return formattedSymbol.toUpperCase() + 'USDT';
        }
        
        return formattedSymbol.toUpperCase();
      };
      
      // Map timeframe to Binance interval
      const mapTimeframeToBinanceInterval = (tf) => {
        const timeframeMap = {
          '1m': '1m',
          '5m': '5m',
          '15m': '15m',
          '30m': '30m',
          '1h': '1h',
          '4h': '4h',
          '1d': '1d',
          'd': '1d',
          'daily': '1d',
          '1w': '1w',
          'w': '1w',
          '1M': '1M',
          'M': '1M'
        };
        
        return timeframeMap[tf] || '1d';
      };
      
      const binanceSymbol = formatSymbolForBinance(symbol);
      const interval = mapTimeframeToBinanceInterval(timeframe);
      
      // Determine the appropriate limit based on timeframe
      let limit;
      switch(timeframe) {
        case '1m':
          limit = 1000; // Last ~16 hours
          break;
        case '5m':
          limit = 1000; // Last ~3.5 days
          break;
        case '15m':
          limit = 1000; // Last ~10 days
          break;
        case '30m':
          limit = 1000; // Last ~20 days
          break;
        case '1h':
          limit = 1000; // Last ~41 days
          break;
        case '4h':
          limit = 1000; // Last ~166 days
          break;
        case '1d':
        case 'd':
        case 'daily':
          limit = 1000; // Last ~3 years
          break;
        case '1w':
        case 'w':
          limit = 500; // Last ~10 years
          break;
        case '1M':
        case 'M':
          limit = 500; // Monthly data
          break;
        default:
          limit = 1000;
      }
      
      // First, clear the backend cache for this symbol and timeframe
      const API_URL = process.env.REACT_APP_API_URL || '';
      const clearCacheTimestamp = Date.now();
      
      console.log(`Clearing backend cache for ${binanceSymbol} on ${interval} timeframe`);
      
      // Make a request to clear the cache with the abort signal
      fetch(`${API_URL}/api/clear-cache?symbol=${binanceSymbol}&timeframe=${interval}&_=${clearCacheTimestamp}`, { signal })
        .then(response => response.json())
        .then(clearCacheResult => {
          // Skip if this effect has been superseded
          if (!isCurrentRequest) {
            console.log('Skipping stale response after cache clear');
            return Promise.reject(new DOMException('Aborted', 'AbortError'));
          }
          
          console.log('Cache clear response:', clearCacheResult);
          
          if (clearCacheResult.success) {
            console.log('Successfully cleared cache:', clearCacheResult.message);
          } else {
            console.warn('Failed to clear cache:', clearCacheResult.error);
          }
          
          // Now fetch the data with a unique timestamp to force cache bypass
          const uniqueTimestamp = Date.now();
          console.log(`Fetching data with unique timestamp: ${uniqueTimestamp}`);
          
          // Generate a truly random parameter to force cache bypass
          const randomParam = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          console.log(`Making direct API call to Binance for ${binanceSymbol} on ${interval} timeframe with limit ${limit}`);
          
          // Explicitly request a cache bypass with the abort signal
          return fetch(`${API_URL}/api/proxy/binance/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}&random=${randomParam}&_=${uniqueTimestamp}&force_bypass=true`, { signal });
        })
        .catch(err => {
          // If aborted, rethrow to skip further processing
          if (err.name === 'AbortError') {
            throw err;
          }
          
          console.warn('Error clearing cache, proceeding with data fetch:', err);
          
          // If cache clear fails, still try to fetch data
          const uniqueTimestamp = Date.now();
          const randomParam = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          // Still use force_bypass even if cache clearing failed
          return fetch(`${API_URL}/api/proxy/binance/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}&random=${randomParam}&_=${uniqueTimestamp}&force_bypass=true`, { signal });
        })
        .then(response => response.json())
        .then(result => {
          // Skip if this effect has been superseded
          if (!isCurrentRequest) {
            console.log('Skipping stale response after data fetch');
            return;
          }
          
          if (result && result.success && result.data) {
            console.log(`Successfully fetched ${result.data.length} candles for ${timeframe} timeframe`);
            
            // Process the data
            const processedData = result.data.map(candle => {
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
            
            // Process and set data
            const chartData = processedData.map(candle => ({
              time: candle.time,
              open: parseFloat(candle.open),
              high: parseFloat(candle.high),
              low: parseFloat(candle.low),
              close: parseFloat(candle.close),
            }));
            
            const volumeData = processedData.map(candle => ({
              time: candle.time,
              value: parseFloat(candle.volume),
              color: parseFloat(candle.close) >= parseFloat(candle.open) ? '#26a69a' : '#ef5350',
            }));
            
            // Set data to state and chart
            setChartData(chartData);
            setVolumeData(volumeData);
            
            if (seriesRef.current.main) {
              console.log('Setting data to candlestick series...');
              seriesRef.current.main.setData(chartData);
            }
            
            if (seriesRef.current.volume) {
              console.log('Setting data to volume series...');
              seriesRef.current.volume.setData(volumeData);
            }
            
            // Calculate and set visible range
            const visibleRange = calculateVisibleRange(chartData, timeframe);
            if (visibleRange && chartRef.current) {
              console.log(`Setting visible range for ${timeframe}: ${JSON.stringify(visibleRange)}`);
              chartRef.current.timeScale().setVisibleRange(visibleRange);
            }
            
            // Calculate price change
            if (chartData.length > 1) {
              const firstCandle = chartData[0];
              const lastCandle = chartData[chartData.length - 1];
              const change = lastCandle.close - firstCandle.close;
              const percentChange = (change / firstCandle.close) * 100;
              
              setPriceChange({
                value: change,
                percent: percentChange
              });
              
              setLastCandle(lastCandle);
            }
            
            // Mark data as fetched
            dataFetchedRef.current = true;
            
            // Setup WebSocket after data is loaded
            setupWebSocket();
            
            // Apply proper scaling after data is loaded
            if (chartRef.current) {
              console.log('Applying scaling for timeframe:', timeframe);
              chartRef.current.timeScale().fitContent();
            }
            
            setIsLoading(false);
          } else {
            console.error('Invalid data format from Binance API proxy:', result);
            setError('Invalid data format from Binance API proxy');
            setIsLoading(false);
          }
        })
        .catch(err => {
          // Skip if this was an abort error
          if (err.name === 'AbortError') {
            console.log('Request was aborted due to new timeframe selection');
            return;
          }
          
          console.error('Error fetching data from Binance API proxy:', err);
          setError(`Error fetching data: ${err.message}`);
          setIsLoading(false);
        });
    }, 50);
    
    // Return cleanup function
    return () => {
      // Mark this effect as superseded
      isCurrentRequest = false;
      
      // Abort any in-flight requests
      abortController.abort();
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Clean up chart - we don't need to call cleanup here as it's handled by the chart removal above
      // If chartRef.current exists, it will be cleaned up in the next render cycle
      
      // Clean up WebSocket
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [symbol, timeframe]);
  
  // Update when symbol or timeframe changes - but only to update the key
  useEffect(() => {
    // Only regenerate the key if the symbol or timeframe actually changed
    // AND if this is not the initial render (chartKey already contains the symbol and timeframe)
    const currentSymbol = chartKey.split('-')[0];
    const currentTimeframe = chartKey.split('-')[1];
    
    if (currentSymbol !== symbol || currentTimeframe !== timeframe) {
      // We don't need to do anything here - the other useEffect will handle the actual data fetching
      // This is just to prevent duplicate renders
      console.log(`Symbol or timeframe changed from ${currentSymbol}/${currentTimeframe} to ${symbol}/${timeframe}`);
      // The key update is handled in the main useEffect
    }
  }, [symbol, timeframe, chartKey]);
  
  return (
    <PaneContainer height={height}>
      <PaneHeader>
        <PaneTitle>
          {symbol}
          {lastCandle && (
            <PaneValue color={lastCandle.close >= lastCandle.open ? '#26A69A' : '#EF5350'}>
              {formatPrice(lastCandle.close)}
            </PaneValue>
          )}
          {priceChange.value !== 0 && (
            <PriceChange $isPositive={priceChange.value > 0}>
              {priceChange.value > 0 ? '+' : ''}{formatPrice(priceChange.value)} ({priceChange.percent.toFixed(2)}%)
            </PriceChange>
          )}
          {lastCandle && (
            <OHLCVInfo>
              <OHLCVItem>
                <OHLCVLabel>O:</OHLCVLabel>
                <OHLCVValue>{formatPrice(lastCandle.open)}</OHLCVValue>
              </OHLCVItem>
              <OHLCVItem>
                <OHLCVLabel>H:</OHLCVLabel>
                <OHLCVValue>{formatPrice(lastCandle.high)}</OHLCVValue>
              </OHLCVItem>
              <OHLCVItem>
                <OHLCVLabel>L:</OHLCVLabel>
                <OHLCVValue>{formatPrice(lastCandle.low)}</OHLCVValue>
              </OHLCVItem>
              <OHLCVItem>
                <OHLCVLabel>C:</OHLCVLabel>
                <OHLCVValue>{formatPrice(lastCandle.close)}</OHLCVValue>
              </OHLCVItem>
            </OHLCVInfo>
          )}
        </PaneTitle>
        <PaneControls>
          {onSettings && (
            <PaneButton onClick={onSettings}>
              <i className="fa fa-cog" />
            </PaneButton>
          )}
          {onFullscreen && (
            <PaneButton onClick={onFullscreen}>
              <i className={isFullscreen ? "fa fa-compress" : "fa fa-expand"} />
            </PaneButton>
          )}
          {onClose && (
            <PaneButton onClick={onClose}>
              <i className="fa fa-times" />
            </PaneButton>
          )}
        </PaneControls>
      </PaneHeader>
      <ChartCanvas>
        <div 
          key={`chart-${chartKey}`}
          ref={chartContainerRef} 
          style={{ width: '100%', height: '100%', position: 'relative' }}
        />
        <PriceScaleOverlay>
          <PriceScaleButtons>
            <ScaleButton 
              onClick={() => {
                const newAutoScale = !isAutoScale;
                setIsAutoScale(newAutoScale);
                if (chartRef.current) {
                  const priceScale = chartRef.current.priceScale('right');
                  priceScale.applyOptions({
                    autoScale: newAutoScale,
                    entireTextOnly: true
                  });
                  if (newAutoScale) {
                    // Use proper method to auto-scale
                    chartRef.current.timeScale().fitContent();
                  }
                }
              }} 
              title="Auto Scale"
              $isActive={isAutoScale}
            >
              A
            </ScaleButton>
            <ScaleButton 
              onClick={() => {
                const newLogScale = !isLogScale;
                setIsLogScale(newLogScale);
                if (chartRef.current) {
                  chartRef.current.priceScale('right').applyOptions({
                    mode: newLogScale ? 2 : 0
                  });
                }
              }}
              title="Logarithmic Scale"
              $isActive={isLogScale}
            >
              L
            </ScaleButton>
          </PriceScaleButtons>
        </PriceScaleOverlay>
        {isLoading && <LoadingOverlay>Loading chart data...</LoadingOverlay>}
        {error && (
          <ErrorOverlay>
            <ErrorTitle>Error loading chart data</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
          </ErrorOverlay>
        )}
      </ChartCanvas>
    </PaneContainer>
  );
};

export default ChartPane; 