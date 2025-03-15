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
    
    // Sort data by time to ensure correct range calculation
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    
    // Get the last timestamp
    const lastTimestamp = sortedData[sortedData.length - 1].time;
    
    // Calculate range based on timeframe
    let daysToShow = 30; // Default
    
    if (tf === '1d' || tf === 'd' || tf === 'daily') {
      daysToShow = 60; // Show 60 days for daily timeframe
    } else if (tf === '4h' || tf === '1h') {
      daysToShow = 14; // Show 14 days for hourly timeframes
    } else if (tf === '15m' || tf === '5m') {
      daysToShow = 7; // Show 7 days for minute timeframes
    } else if (tf === '1m') {
      daysToShow = 3; // Show 3 days for 1-minute timeframe
    }
    
    // Calculate range start (seconds)
    const rangeStart = lastTimestamp - (daysToShow * 24 * 60 * 60);
    
    // Add 1 day of padding to the end
    const rangeEnd = lastTimestamp + (1 * 24 * 60 * 60);
    
    console.log(`Calculated visible range for ${tf}: ${new Date(rangeStart * 1000).toISOString()} to ${new Date(rangeEnd * 1000).toISOString()}`);
    console.log(`Days to show: ${daysToShow}, Last timestamp: ${new Date(lastTimestamp * 1000).toISOString()}`);
    
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
    
    // Skip if data already fetched for this symbol/timeframe
    if (dataFetchedRef.current) {
      console.log(`Data already fetched for ${symbol} on ${timeframe} timeframe, skipping duplicate fetch`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data for ${symbol} on ${timeframe} timeframe`);
      
      // Determine appropriate limit based on timeframe
      let limit = 500;
      if (timeframe === '1d' || timeframe === 'd' || timeframe === 'daily') {
        limit = 365; // Get a year of data for daily timeframe
      } else if (timeframe === '4h' || timeframe === '1h') {
        limit = 1000; // Get more data for hourly timeframes
      } else if (timeframe === '15m' || timeframe === '5m') {
        limit = 1500; // Get more data for minute timeframes
      } else if (timeframe === '1m') {
        limit = 2000; // Get more data for 1-minute timeframe
      }
      
      // Fetch historical data
      const historicalData = await chartDataService.fetchHistoricalData(symbol, timeframe, limit);
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error(`No data returned for ${symbol} on ${timeframe} timeframe`);
      }
      
      console.log(`Fetched ${historicalData.length} candles for ${symbol} on ${timeframe} timeframe`);
      
      // Process data for candlestick chart
      const chartData = historicalData.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
      
      // Process data for volume
      const volumeData = historicalData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
      }));
      
      // Set data for state updates
      setChartData(chartData);
      setVolumeData(volumeData);
      
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
        
        // Set last candle
        setLastCandle(lastCandle);
      }
      
      // Initialize chart if needed
      if (!chartRef.current) {
        initializeChart();
      }
      
      // Set data to chart
      if (seriesRef.current.main) {
        console.log('Setting data to candlestick series...');
        seriesRef.current.main.setData(chartData);
      }
      
      // Set data to volume
      if (seriesRef.current.volume) {
        console.log('Setting data to volume series...');
        seriesRef.current.volume.setData(volumeData);
      }
      
      // Calculate and set visible range
      const visibleRange = calculateVisibleRange(chartData, timeframe);
      if (visibleRange && chartRef.current) {
        console.log(`Setting visible range: ${JSON.stringify(visibleRange)}`);
        chartRef.current.timeScale().setVisibleRange({
          from: visibleRange.from,
          to: visibleRange.to
        });
      }
      
      // Mark data as fetched
      dataFetchedRef.current = true;
      
      // Setup WebSocket for real-time updates
      setupWebSocket();
      
      // Notify parent component
      if (onDataLoaded) {
        onDataLoaded({
          symbol,
          timeframe,
          data: chartData,
          lastCandle: chartData[chartData.length - 1]
        });
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to setup WebSocket
  const setupWebSocket = () => {
    // Skip if already subscribed or no data fetched yet
    if (subscription || !dataFetchedRef.current) {
      return;
    }
    
    // Setup WebSocket subscription for real-time updates
    chartDataService.subscribeToRealTimeUpdates(symbol, (newCandle) => {
      if (!seriesRef.current.main || !seriesRef.current.volume) return;
      
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
    const cleanup = initializeChart();
    
    // Fetch data
    fetchData();
    
    return () => {
      // Cleanup chart
      if (cleanup) cleanup();
      
      // Cleanup WebSocket
      if (subscription) {
        console.log('Cleaning up WebSocket subscription');
        subscription.unsubscribe();
      }
    };
  }, []);

  // Effect to handle symbol or timeframe changes
  useEffect(() => {
    // Reset data fetched flag when symbol or timeframe changes
    dataFetchedRef.current = false;
    
    // Reset WebSocket subscription
    if (subscription) {
      console.log('Cleaning up WebSocket subscription for symbol/timeframe change');
      subscription.unsubscribe();
      setSubscription(null);
    }
    
    // Fetch data for new symbol/timeframe
    fetchData();
  }, [symbol, timeframe]);
  
  // Update when symbol or timeframe changes
  useEffect(() => {
    // Only regenerate the key if the symbol or timeframe actually changed
    const newKey = `${symbol}-${timeframe}-${Date.now()}`;
    if (chartKey.split('-')[0] !== symbol || chartKey.split('-')[1] !== timeframe) {
      console.log(`Symbol or timeframe changed, regenerating chart key: ${newKey}`);
      setChartKey(newKey);
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