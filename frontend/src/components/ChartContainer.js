import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { 
  FaDrawPolygon, 
  FaRulerHorizontal, 
  FaFont, 
  FaRegSave, 
  FaCamera,
  FaCrosshairs,
  FaRuler,
  FaLayerGroup,
  FaNetworkWired,
  FaLeaf,
  FaFont as FaText,
  FaSmile,
  FaRulerCombined,
  FaSearch,
  FaMagnet,
  FaPencilAlt,
  FaLock,
  FaEye,
  FaLink,
  FaTrash,
  FaChartLine,
  FaChartBar,
  FaChartArea,
  FaChartPie,
  FaChevronDown,
  FaPlus,
  FaCaretUp,
  FaCaretDown,
  FaInfoCircle
} from 'react-icons/fa';
import { IndicatorsModal, IndicatorSettings, ActiveIndicators } from './indicators';
import { getIndicator } from './indicators/types';

const ChartContainerWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const ChartStatusSection = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 200px;
`;

const OHLCVContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  flex-wrap: wrap;
  gap: 8px;
  position: relative;
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
  font-size: 12px;
  color: var(--text-color);
  font-weight: 500;
`;

const CandleTime = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
`;

const ChangeValue = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.$positive ? '#26A69A' : '#EF5350'};
  margin-right: 24px;
  
  svg {
    margin-right: 4px;
  }
`;

const IndicatorsControl = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
`;

const IndicatorButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg {
    margin-right: 4px;
    font-size: 12px;
  }
`;

const ChartTypeDropdown = styled.div`
  position: relative;
`;

const ChartTypeButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg:first-child {
    margin-right: 4px;
    font-size: 12px;
  }
  
  svg:last-child {
    margin-left: 4px;
    font-size: 10px;
  }
`;

const ChartTypeMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 180px;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  margin-top: 4px;
`;

const ChartTypeMenuItem = styled.div`
  padding: 8px 12px;
  display: flex;
  align-items: center;
  color: var(--text-color);
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg {
    margin-right: 8px;
    font-size: 14px;
  }
  
  &.active {
    background-color: rgba(41, 98, 255, 0.1);
    color: var(--accent-color);
  }
`;

const ChartTools = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  
  button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 16px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 0;
    
    &:hover {
      color: var(--text-color);
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    &.active {
      color: var(--accent-color);
      background-color: rgba(41, 98, 255, 0.1);
    }
  }
`;

const ToolDivider = styled.div`
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
  margin: 0 4px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
`;

const ChartArea = styled.div`
  flex: 1;
  position: relative;
  min-height: 0;
`;

const ChartCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
`;

const ChartContainer = ({ symbol, timeframe, data, context = { indicators: [] }, onTimeframeChange, onIndicatorAdd }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorSeriesRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const [activeToolIndex, setActiveToolIndex] = useState(null);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('Candles');
  const [isIndicatorsMenuOpen, setIsIndicatorsMenuOpen] = useState(false);
  const chartTypeRef = useRef(null);
  const indicatorsRef = useRef(null);
  const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false);
  const [currentIndicator, setCurrentIndicator] = useState(null);
  const [crosshairData, setCrosshairData] = useState(null);
  
  // OHLCV data state
  const [ohlcvData, setOhlcvData] = useState({
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    change: 0,
    changePercent: 0,
    positive: true
  });
  
  // Update OHLCV data when crosshair data changes or when chart data changes
  useEffect(() => {
    if (data && data.length > 0) {
      // If we have crosshair data, use that
      if (crosshairData && crosshairData.point) {
        const currentCandle = crosshairData.point;
        const previousCandle = findPreviousCandle(data, currentCandle.time);
        
        const change = previousCandle ? currentCandle.close - previousCandle.close : 0;
        const changePercent = previousCandle ? (change / previousCandle.close) * 100 : 0;
        
        setOhlcvData({
          open: currentCandle.open,
          high: currentCandle.high,
          low: currentCandle.low,
          close: currentCandle.close,
          volume: currentCandle.volume,
          change,
          changePercent,
          positive: change >= 0
        });
        
        console.log('Updated OHLCV data from crosshair:', currentCandle);
      } 
      // Otherwise use the latest candle
      else {
        const latestCandle = data[data.length - 1];
        const previousCandle = data.length > 1 ? data[data.length - 2] : null;
        
        const change = previousCandle ? latestCandle.close - previousCandle.close : 0;
        const changePercent = previousCandle ? (change / previousCandle.close) * 100 : 0;
        
        setOhlcvData({
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
          volume: latestCandle.volume,
          change,
          changePercent,
          positive: change >= 0
        });
        
        console.log('Updated OHLCV data from latest candle:', latestCandle);
      }
    }
  }, [crosshairData, data]);
  
  // Helper function to find the previous candle
  const findPreviousCandle = (data, currentTime) => {
    if (!data || data.length <= 1) return null;
    
    // Find the index of the current candle
    const currentIndex = data.findIndex(candle => candle.time === currentTime);
    
    // If we found the current candle and it's not the first one, return the previous candle
    if (currentIndex > 0) {
      return data[currentIndex - 1];
    }
    
    return null;
  };
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chartTypeRef.current && !chartTypeRef.current.contains(event.target)) {
        setIsChartTypeMenuOpen(false);
      }
      
      if (indicatorsRef.current && !indicatorsRef.current.contains(event.target)) {
        setIsIndicatorsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Format number with commas and fixed decimal places
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '0';
    
    // For large numbers (like volume), format with K, M, B suffixes
    if (decimals === 0 && num > 1000) {
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
    }
    
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Check if timestamp is a Unix timestamp (number) or a string
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) // Unix timestamp (seconds)
      : new Date(timestamp);       // ISO string or other format
    
    // Format the date
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Handle chart type change
  const handleChartTypeChange = (chartType) => {
    setSelectedChartType(chartType);
    setIsChartTypeMenuOpen(false);
    
    // In a real app, you would update the chart type here
    console.log(`Changing chart type to ${chartType}`);
  };
  
  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe) => {
    if (newTimeframe !== timeframe && onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  }, [timeframe, onTimeframeChange]);
  
  const handleToolClick = (index) => {
    setActiveToolIndex(activeToolIndex === index ? null : index);
  };
  
  // Initialize chart on mount
  useEffect(() => {
    if (chartContainerRef.current) {
      try {
        console.log('Initializing chart with Lightweight Charts v5.0.3');
        
        // Create chart with the new API
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
          layout: {
            background: { color: '#1E222D' },
            textColor: '#D1D4DC',
            fontSize: 12,
          },
          grid: {
            vertLines: { color: '#2A2E39' },
            horzLines: { color: '#2A2E39' },
          },
          crosshair: {
            mode: 0, // 0 for normal, 1 for magnet
            vertLine: {
              color: 'rgba(224, 227, 235, 0.1)',
              width: 1,
              style: 0, // 0 for solid, 1 for dotted, 2 for dashed
              visible: true,
              labelVisible: true,
            },
            horzLine: {
              color: 'rgba(224, 227, 235, 0.1)',
              width: 1,
              style: 0,
              visible: true,
              labelVisible: true,
            },
          },
          timeScale: {
            borderColor: '#2A2E39',
            timeVisible: true,
            secondsVisible: false,
          },
        });
        
        // Create candlestick series with proper margins to leave space for volume
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#26A69A',
          downColor: '#EF5350',
          borderVisible: false,
          wickUpColor: '#26A69A',
          wickDownColor: '#EF5350',
          // Set margins to leave space for volume at the bottom
          priceScaleId: 'right',
          scaleMargins: {
            top: 0.1,
            bottom: 0.2, // Leave 20% of the space at the bottom for volume
          },
        });
        
        // Create a histogram series for volume with proper positioning
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: 'rgba(76, 175, 80, 0.5)',
          priceFormat: {
            type: 'volume',
          },
          // Use a separate price scale for volume
          priceScaleId: 'volume',
          // Position volume at the bottom of the chart
          scaleMargins: {
            top: 0.8, // Start at 80% from the top
            bottom: 0.0, // Go all the way to the bottom
          },
        });
        
        // Configure the volume price scale to be hidden
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0.0,
          },
          visible: false, // Hide the volume price scale
        });
        
        // Save references
        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;
        
        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          }
        };
        
        // Set up ResizeObserver
        resizeObserverRef.current = new ResizeObserver(handleResize);
        resizeObserverRef.current.observe(chartContainerRef.current);
        
        // Add a direct mousemove event listener to the chart container
        chartContainerRef.current.addEventListener('mousemove', (e) => {
          if (!chartRef.current || !data || data.length === 0) return;
          
          try {
            const rect = chartContainerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if mouse is within chart area
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
              // Get the time at the current mouse position
              const timeScale = chartRef.current.timeScale();
              const logical = timeScale.coordinateToLogical(x);
              
              if (logical !== null) {
                // Find the closest data point
                let closestPoint = null;
                let minDistance = Infinity;
                
                for (const point of data) {
                  const pointTime = typeof point.time === 'number' 
                    ? point.time 
                    : new Date(point.time).getTime() / 1000;
                  
                  const distance = Math.abs(pointTime - logical);
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = point;
                  }
                }
                
                if (closestPoint) {
                  // Get indicator values for this point
                  const indicatorValues = {};
                  
                  // Process indicators
                  context.indicators.forEach(indicator => {
                    try {
                      const indicatorModule = getIndicator(indicator.type);
                      if (!indicatorModule) return;
                      
                      const calculatedData = indicatorModule.calculate(data, indicator);
                      const indicatorPoint = calculatedData.find(d => d.time === closestPoint.time);
                      
                      if (indicatorPoint) {
                        if (indicator.type === 'SMA') {
                          indicatorValues[indicator.type] = indicatorPoint.value;
                        } else if (indicator.type === 'BB') {
                          indicatorValues[indicator.type] = {
                            middle: indicatorPoint.middle,
                            upper: indicatorPoint.upper,
                            lower: indicatorPoint.lower
                          };
                        } else if (indicator.type === 'MACD') {
                          indicatorValues[indicator.type] = {
                            macd: indicatorPoint.macd,
                            signal: indicatorPoint.signal,
                            histogram: indicatorPoint.histogram
                          };
                        } else if (indicatorPoint.value !== undefined) {
                          indicatorValues[indicator.type] = indicatorPoint.value;
                        }
                      }
                    } catch (err) {
                      console.error(`Error processing indicator ${indicator.type}:`, err);
                    }
                  });
                  
                  // Update crosshair data
                  setCrosshairData({
                    time: closestPoint.time,
                    point: closestPoint,
                    indicatorValues
                  });
                  
                  console.log('Updated crosshair data from mousemove:', closestPoint);
                }
              }
            }
          } catch (error) {
            console.error('Error in mousemove handler:', error);
          }
        });
        
        // Add a mouse leave handler
        chartContainerRef.current.addEventListener('mouseleave', () => {
          // Reset to the latest candle
          if (data && data.length > 0) {
            const latestCandle = data[data.length - 1];
            const previousCandle = data.length > 1 ? data[data.length - 2] : null;
            
            const change = previousCandle ? latestCandle.close - previousCandle.close : 0;
            const changePercent = previousCandle ? (change / previousCandle.close) * 100 : 0;
            
            setOhlcvData({
              open: latestCandle.open,
              high: latestCandle.high,
              low: latestCandle.low,
              close: latestCandle.close,
              volume: latestCandle.volume,
              change,
              changePercent,
              positive: change >= 0
            });
            
            // Clear crosshair data
            setCrosshairData(null);
          }
        });
        
        // Clean up on unmount
        return () => {
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
          }
          
          if (chartRef.current) {
            chartRef.current.remove();
          }
        };
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    }
  }, []);
  
  // Update data when it changes
  useEffect(() => {
    if (chartRef.current && candlestickSeriesRef.current && volumeSeriesRef.current && data && data.length > 0) {
      console.log('Updating chart with data:', data.length, 'candles');
      
      try {
        // Make data available globally for the ActiveIndicators component
        window.chartData = data;
        
        // Update candlestick data
        candlestickSeriesRef.current.setData(data);
        
        // Format volume data for the histogram series
        const volumeData = data.map(item => {
          return {
            time: item.time,
            value: item.volume || 0,
            color: item.close >= item.open 
              ? 'rgba(38, 166, 154, 0.5)' // Green for up candles
              : 'rgba(239, 83, 80, 0.5)', // Red for down candles
          };
        });
        
        // Update volume data
        volumeSeriesRef.current.setData(volumeData);
        
        // Fit content to view
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [data]);
  
  // Update indicators when chart context changes
  useEffect(() => {
    if (chartRef.current && data && data.length > 0 && context.indicators) {
      try {
        console.log('Updating indicators:', context.indicators);
        console.log('Chart data available:', data.length, 'points');
        
        // Make data available globally for the ActiveIndicators component
        window.chartData = data;
        
        // Remove old indicators
        indicatorSeriesRef.current.forEach(series => {
          if (Array.isArray(series.series)) {
            series.series.forEach(s => {
              if (s && chartRef.current) {
                chartRef.current.removeSeries(s);
              }
            });
          } else if (series.series && chartRef.current) {
            chartRef.current.removeSeries(series.series);
          }
        });
        
        // Clear indicator references
        indicatorSeriesRef.current = [];
        
        // Store calculated indicator values for crosshair
        const calculatedIndicatorValues = {};
        
        // Add new indicators
        context.indicators.forEach((indicator, index) => {
          try {
            // Get the indicator module
            const indicatorModule = getIndicator(indicator.type);
            if (!indicatorModule) {
              console.error(`Indicator module not found for type: ${indicator.type}`);
              return;
            }
            
            const isVisible = indicator.isVisible !== false;
            
            // Calculate indicator data
            console.log(`Calculating ${indicator.type} with data:`, data.length, 'points');
            
            // Validate data format before calculation
            if (!data[0].time || data[0].close === undefined) {
              console.error(`Invalid data format for ${indicator.type} calculation:`, data[0]);
              return;
            }
            
            const indicatorData = indicatorModule.calculate(data, indicator);
            console.log(`Calculated ${indicator.type} data:`, indicatorData.length, 'points');
            
            if (indicatorData.length === 0) {
              console.warn(`No data points calculated for ${indicator.type}`);
              return;
            }
            
            // Store the last value for immediate display
            const lastPoint = indicatorData[indicatorData.length - 1];
            
            // Extract the value based on indicator type
            if (indicator.type === 'SMA') {
              if (typeof lastPoint === 'number') {
                calculatedIndicatorValues[indicator.type] = lastPoint;
              } else if (lastPoint.value !== undefined) {
                calculatedIndicatorValues[indicator.type] = lastPoint.value;
              } else if (lastPoint.close !== undefined) {
                calculatedIndicatorValues[indicator.type] = lastPoint.close;
              }
              console.log(`Stored last SMA value: ${calculatedIndicatorValues[indicator.type]}`);
            } else if (indicator.type === 'BB') {
              calculatedIndicatorValues[indicator.type] = {
                middle: lastPoint.middle,
                upper: lastPoint.upper,
                lower: lastPoint.lower
              };
            } else if (indicator.type === 'MACD') {
              calculatedIndicatorValues[indicator.type] = {
                macd: lastPoint.macd,
                signal: lastPoint.signal,
                histogram: lastPoint.histogram
              };
            } else if (lastPoint.value !== undefined) {
              calculatedIndicatorValues[indicator.type] = lastPoint.value;
            }
            
            // Get series options
            const seriesOptions = indicatorModule.getSeriesOptions(indicator);
            console.log(`Series options for ${indicator.type}:`, seriesOptions);
            
            // Handle different indicator types
            switch (indicator.type) {
              case 'BB': {
                // Bollinger Bands have three lines
                const middle = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions.middle,
                  visible: isVisible,
                });
                
                const upper = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions.upper,
                  visible: isVisible,
                });
                
                const lower = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions.lower,
                  visible: isVisible,
                });
                
                // Make sure data has the correct format for the chart
                const middleData = indicatorData.map(d => ({ time: d.time, value: d.middle }));
                const upperData = indicatorData.map(d => ({ time: d.time, value: d.upper }));
                const lowerData = indicatorData.map(d => ({ time: d.time, value: d.lower }));
                
                console.log(`Setting BB data: middle=${middleData.length}, upper=${upperData.length}, lower=${lowerData.length} points`);
                
                middle.setData(middleData);
                upper.setData(upperData);
                lower.setData(lowerData);
                
                indicatorSeriesRef.current[index] = {
                  type: indicator.type,
                  series: [middle, upper, lower]
                };
                break;
              }
              
              case 'MACD': {
                // MACD has a line and a histogram
                const macdSeries = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions.macd,
                  visible: isVisible,
                  priceScaleId: 'macd',
                  scaleMargins: {
                    top: 0.7,
                    bottom: 0.1,
                  },
                });
                
                const signalSeries = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions.signal,
                  visible: isVisible,
                  priceScaleId: 'macd',
                  scaleMargins: {
                    top: 0.7,
                    bottom: 0.1,
                  },
                });
                
                const histogramSeries = chartRef.current.addSeries(HistogramSeries, {
                  ...seriesOptions.histogram,
                  visible: isVisible,
                  priceScaleId: 'macd',
                  scaleMargins: {
                    top: 0.7,
                    bottom: 0.1,
                  },
                });
                
                // Format data for the series
                const macdData = indicatorData.map(d => ({ time: d.time, value: d.macd }));
                const signalData = indicatorData.map(d => ({ time: d.time, value: d.signal }));
                const histogramData = indicatorData.map(d => ({ 
                  time: d.time, 
                  value: d.histogram,
                  color: d.histogram >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
                }));
                
                macdSeries.setData(macdData);
                signalSeries.setData(signalData);
                histogramSeries.setData(histogramData);
                
                indicatorSeriesRef.current[index] = {
                  type: indicator.type,
                  series: [macdSeries, signalSeries, histogramSeries]
                };
                break;
              }
              
              default: {
                // Default case for simple line indicators (SMA, EMA, RSI)
                const series = chartRef.current.addSeries(LineSeries, {
                  ...seriesOptions,
                  visible: isVisible,
                  // For RSI, use a separate price scale
                  priceScaleId: indicator.type === 'RSI' ? 'rsi' : 'right',
                  // For RSI, set scale margins to display at the bottom
                  ...(indicator.type === 'RSI' ? {
                    scaleMargins: {
                      top: 0.8,
                      bottom: 0.1,
                    },
                  } : {})
                });
                
                console.log(`Setting ${indicator.type} data: ${indicatorData.length} points`);
                
                // Make sure the data is in the correct format
                if (indicatorData.length > 0) {
                  // Check if the data is already in the correct format
                  const formattedData = indicatorData.map(d => {
                    if (typeof d === 'number') {
                      return { time: data[data.length - 1].time, value: d };
                    } else if (d.value !== undefined) {
                      return { time: d.time, value: d.value };
                    } else if (d.close !== undefined) {
                      return { time: d.time, value: d.close };
                    } else {
                      // Try to find any numeric property
                      const keys = Object.keys(d);
                      for (const key of keys) {
                        if (key !== 'time' && typeof d[key] === 'number') {
                          return { time: d.time, value: d[key] };
                        }
                      }
                      return null;
                    }
                  }).filter(d => d !== null);
                  
                  if (formattedData.length > 0) {
                    console.log(`Formatted data for ${indicator.type}:`, formattedData.length, 'points');
                    console.log('First point:', formattedData[0]);
                    console.log('Last point:', formattedData[formattedData.length - 1]);
                    series.setData(formattedData);
                  } else {
                    console.warn(`No valid data points for ${indicator.type}`);
                  }
                }
                
                indicatorSeriesRef.current[index] = {
                  type: indicator.type,
                  series
                };
              }
            }
          } catch (err) {
            console.error(`Error processing indicator ${indicator.type}:`, err);
          }
        });
        
        // Set initial crosshair data with calculated values
        if (data.length > 0) {
          setCrosshairData({
            time: data[data.length - 1].time,
            point: data[data.length - 1],
            indicatorValues: calculatedIndicatorValues
          });
        }
        
        // Fit content to view
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error('Error updating indicators:', error);
      }
    }
  }, [context.indicators, data]);
  
  const handleRemoveIndicator = (index) => {
    if (context.indicators && onIndicatorAdd) {
      // Remove the indicator series from the chart first
      const indicatorToRemove = indicatorSeriesRef.current[index];
      if (indicatorToRemove) {
        if (Array.isArray(indicatorToRemove.series)) {
          indicatorToRemove.series.forEach(s => {
            if (s && chartRef.current) {
              chartRef.current.removeSeries(s);
            }
          });
        } else if (indicatorToRemove.series && chartRef.current) {
          chartRef.current.removeSeries(indicatorToRemove.series);
        }
      }
      
      // Remove from the indicators array
      const newIndicators = [...context.indicators];
      newIndicators.splice(index, 1);
      
      // Update the reference array
      indicatorSeriesRef.current.splice(index, 1);
      
      onIndicatorAdd(newIndicators);
    }
  };

  const handleToggleIndicatorVisibility = (index) => {
    if (context.indicators && onIndicatorAdd) {
      const newIndicators = [...context.indicators];
      const currentVisibility = newIndicators[index].isVisible;
      
      // Toggle visibility
      newIndicators[index] = {
        ...newIndicators[index],
        isVisible: !currentVisibility
      };
      
      // Handle the series visibility
      const indicatorSeries = indicatorSeriesRef.current[index];
      if (indicatorSeries) {
        if (Array.isArray(indicatorSeries.series)) {
          indicatorSeries.series.forEach(s => {
            s.applyOptions({ visible: !currentVisibility });
          });
        } else if (indicatorSeries.series) {
          indicatorSeries.series.applyOptions({ visible: !currentVisibility });
        }
      }
      
      onIndicatorAdd(newIndicators);
    }
  };

  const handleOpenIndicatorSettings = (index, indicator) => {
    // Show the indicator settings modal
    console.log('Open settings for indicator:', indicator);
    
    // Set state to show the settings modal
    setIsIndicatorSettingsOpen(true);
    setCurrentIndicator({ index, ...indicator });
  };

  const handleSaveIndicatorSettings = (index, updatedIndicator) => {
    if (context.indicators && onIndicatorAdd) {
      const newIndicators = [...context.indicators];
      
      // Remove the index property which was added for the settings component
      const { index: _, originalIndex: __, uniqueId: ___, ...cleanIndicator } = updatedIndicator;
      
      // Update the indicator
      newIndicators[index] = cleanIndicator;
      
      // Update the state
      onIndicatorAdd(newIndicators);
      
      // Close the settings modal
      setIsIndicatorSettingsOpen(false);
      setCurrentIndicator(null);
    }
  };

  return (
    <ChartContainerWrapper>
      <ChartHeader>
        <ChartStatusSection>
          <OHLCVContainer>
            <OHLCVItem>
              <OHLCVLabel>O</OHLCVLabel>
              <OHLCVValue>{formatNumber(ohlcvData.open)}</OHLCVValue>
            </OHLCVItem>
            <OHLCVItem>
              <OHLCVLabel>H</OHLCVLabel>
              <OHLCVValue>{formatNumber(ohlcvData.high)}</OHLCVValue>
            </OHLCVItem>
            <OHLCVItem>
              <OHLCVLabel>L</OHLCVLabel>
              <OHLCVValue>{formatNumber(ohlcvData.low)}</OHLCVValue>
            </OHLCVItem>
            <OHLCVItem>
              <OHLCVLabel>C</OHLCVLabel>
              <OHLCVValue>{formatNumber(ohlcvData.close)}</OHLCVValue>
            </OHLCVItem>
            <OHLCVItem>
              <OHLCVLabel>V</OHLCVLabel>
              <OHLCVValue>{formatNumber(ohlcvData.volume, 0)}</OHLCVValue>
            </OHLCVItem>
            
            {crosshairData && crosshairData.time && (
              <CandleTime>
                {formatTimestamp(crosshairData.time)}
              </CandleTime>
            )}
          </OHLCVContainer>
          
          <ChangeValue $positive={ohlcvData.positive}>
            {ohlcvData.positive ? <FaCaretUp /> : <FaCaretDown />}
            {formatNumber(Math.abs(ohlcvData.change))} ({formatNumber(Math.abs(ohlcvData.changePercent))}%)
          </ChangeValue>
          
          <IndicatorsControl>
            <IndicatorButton onClick={() => setIsIndicatorsMenuOpen(!isIndicatorsMenuOpen)}>
              <FaRulerHorizontal />
              Indicators
            </IndicatorButton>
          </IndicatorsControl>
          
          <ChartTypeDropdown ref={chartTypeRef}>
            <ChartTypeButton onClick={() => setIsChartTypeMenuOpen(!isChartTypeMenuOpen)}>
              <FaChartBar />
              {selectedChartType}
              <FaChevronDown />
            </ChartTypeButton>
            
            <ChartTypeMenu $isOpen={isChartTypeMenuOpen}>
              <ChartTypeMenuItem 
                className={selectedChartType === 'Candles' ? 'active' : ''}
                onClick={() => handleChartTypeChange('Candles')}
              >
                <FaChartBar />
                Candles
              </ChartTypeMenuItem>
              <ChartTypeMenuItem 
                className={selectedChartType === 'Heiken Ashi' ? 'active' : ''}
                onClick={() => handleChartTypeChange('Heiken Ashi')}
              >
                <FaChartBar />
                Heiken Ashi
              </ChartTypeMenuItem>
              <ChartTypeMenuItem 
                className={selectedChartType === 'Line' ? 'active' : ''}
                onClick={() => handleChartTypeChange('Line')}
              >
                <FaChartLine />
                Line
              </ChartTypeMenuItem>
              <ChartTypeMenuItem 
                className={selectedChartType === 'Area' ? 'active' : ''}
                onClick={() => handleChartTypeChange('Area')}
              >
                <FaChartArea />
                Area
              </ChartTypeMenuItem>
              <ChartTypeMenuItem 
                className={selectedChartType === 'Renko' ? 'active' : ''}
                onClick={() => handleChartTypeChange('Renko')}
              >
                <FaChartPie />
                Renko
              </ChartTypeMenuItem>
            </ChartTypeMenu>
          </ChartTypeDropdown>
        </ChartStatusSection>
        
        <ChartTools>
          <ToolGroup>
            <button 
              className={activeToolIndex === 0 ? 'active' : ''}
              onClick={() => handleToolClick(0)}
              title="Crosshair"
            >
              <FaCrosshairs />
            </button>
            <button 
              className={activeToolIndex === 1 ? 'active' : ''}
              onClick={() => handleToolClick(1)}
              title="Measure"
            >
              <FaRuler />
            </button>
          </ToolGroup>
          
          <ToolDivider />
          
          <ToolGroup>
            <button 
              className={activeToolIndex === 2 ? 'active' : ''}
              onClick={() => handleToolClick(2)}
              title="Draw Line"
            >
              <FaRulerCombined />
            </button>
            <button 
              className={activeToolIndex === 3 ? 'active' : ''}
              onClick={() => handleToolClick(3)}
              title="Draw Fibonacci"
            >
              <FaLayerGroup />
            </button>
            <button 
              className={activeToolIndex === 4 ? 'active' : ''}
              onClick={() => handleToolClick(4)}
              title="Draw Pitchfork"
            >
              <FaNetworkWired />
            </button>
            <button 
              className={activeToolIndex === 5 ? 'active' : ''}
              onClick={() => handleToolClick(5)}
              title="Draw Gann Fan"
            >
              <FaLeaf />
            </button>
          </ToolGroup>
          
          <ToolDivider />
          
          <ToolGroup>
            <button 
              className={activeToolIndex === 6 ? 'active' : ''}
              onClick={() => handleToolClick(6)}
              title="Add Text"
            >
              <FaText />
            </button>
            <button 
              className={activeToolIndex === 7 ? 'active' : ''}
              onClick={() => handleToolClick(7)}
              title="Add Emoji"
            >
              <FaSmile />
            </button>
          </ToolGroup>
          
          <ToolDivider />
          
          <ToolGroup>
            <button 
              className={activeToolIndex === 8 ? 'active' : ''}
              onClick={() => handleToolClick(8)}
              title="Zoom"
            >
              <FaSearch />
            </button>
            <button 
              className={activeToolIndex === 9 ? 'active' : ''}
              onClick={() => handleToolClick(9)}
              title="Magnet Mode"
            >
              <FaMagnet />
            </button>
            <button 
              className={activeToolIndex === 10 ? 'active' : ''}
              onClick={() => handleToolClick(10)}
              title="Edit Mode"
            >
              <FaPencilAlt />
            </button>
          </ToolGroup>
          
          <ToolDivider />
          
          <ToolGroup>
            <button 
              className={activeToolIndex === 11 ? 'active' : ''}
              onClick={() => handleToolClick(11)}
              title="Lock All Drawing Tools"
            >
              <FaLock />
            </button>
            <button 
              className={activeToolIndex === 12 ? 'active' : ''}
              onClick={() => handleToolClick(12)}
              title="Hide/Show All Drawing Tools"
            >
              <FaEye />
            </button>
            <button 
              className={activeToolIndex === 13 ? 'active' : ''}
              onClick={() => handleToolClick(13)}
              title="Sync Drawings Across Charts"
            >
              <FaLink />
            </button>
            <button 
              className={activeToolIndex === 14 ? 'active' : ''}
              onClick={() => handleToolClick(14)}
              title="Remove All Drawings"
            >
              <FaTrash />
            </button>
          </ToolGroup>
        </ChartTools>
      </ChartHeader>
      
      <ChartArea>
        <ChartCanvas ref={chartContainerRef} />
        <ActiveIndicators 
          indicators={context.indicators} 
          onRemoveIndicator={handleRemoveIndicator}
          onToggleVisibility={handleToggleIndicatorVisibility}
          onOpenSettings={handleOpenIndicatorSettings}
          crosshairData={crosshairData}
        />
      </ChartArea>
      
      {/* Indicator Settings Modal */}
      <IndicatorSettings
        isOpen={isIndicatorSettingsOpen}
        indicator={currentIndicator}
        onClose={() => setIsIndicatorSettingsOpen(false)}
        onSave={handleSaveIndicatorSettings}
        onRemove={handleRemoveIndicator}
      />
      
      {/* Indicators Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsMenuOpen}
        onClose={() => setIsIndicatorsMenuOpen(false)}
        onAddIndicator={(indicator) => {
          onIndicatorAdd(indicator);
          setIsIndicatorsMenuOpen(false);
        }}
      />
    </ChartContainerWrapper>
  );
};

export default ChartContainer;