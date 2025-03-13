import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

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

const PriceInfo = styled.div`
  color: ${props => props.color || 'var(--text-color)'};
  font-weight: 500;
  margin-right: 4px;
`;

const PriceChange = styled.div`
  color: ${props => props.isPositive ? '#26A69A' : '#EF5350'};
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
  min-height: 0;
`;

/**
 * ChartPane component - A modular chart pane that can be used for main chart or indicators
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the pane
 * @param {string} props.type - Type of pane ('main', 'indicator')
 * @param {string} props.title - Title of the pane
 * @param {Array} props.data - Data to display in the pane
 * @param {string} props.height - Height of the pane (e.g., '70%', '200px')
 * @param {Object} props.options - Chart options
 * @param {Function} props.onCrosshairMove - Callback for crosshair movement
 * @param {Function} props.onResize - Callback for pane resize
 * @param {Function} props.onClose - Callback for pane close
 */
const ChartPane = ({
  id,
  type = 'main',
  title,
  data = [],
  height,
  options = {},
  indicators = [],
  currentValue,
  onCrosshairMove,
  onResize,
  onClose
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const indicatorSeriesRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const dataRef = useRef(data);
  
  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  // Initialize chart on mount
  useEffect(() => {
    if (chartContainerRef.current) {
      try {
        console.log(`Initializing ${type} chart pane: ${id}`);
        
        // Default chart options
        const defaultOptions = {
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
            mode: 0,
            vertLine: {
              color: 'rgba(255, 255, 255, 0.1)',
              width: 1,
              style: 0,
              visible: true,
              labelVisible: true,
            },
            horzLine: {
              color: 'rgba(255, 255, 255, 0.1)',
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
        };
        
        // Create chart with merged options
        const chart = createChart(chartContainerRef.current, {
          ...defaultOptions,
          ...options
        });
        
        // Set up main series based on pane type
        let mainSeries;
        
        if (type === 'main') {
          // For main chart, use candlestick series
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26A69A',
            downColor: '#EF5350',
            borderVisible: false,
            wickUpColor: '#26A69A',
            wickDownColor: '#EF5350',
            priceScaleId: 'right',
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
          });
          
          // Add volume series for main chart
          const volumeSeries = chart.addSeries(HistogramSeries, {
            color: 'rgba(76, 175, 80, 0.5)',
            priceFormat: {
              type: 'volume',
            },
            priceScaleId: 'volume',
            scaleMargins: {
              top: 0.8,
              bottom: 0.0,
            },
          });
          
          // Configure the volume price scale to be hidden
          chart.priceScale('volume').applyOptions({
            scaleMargins: {
              top: 0.8,
              bottom: 0.0,
            },
            visible: false,
          });
          
          // Save volume series reference
          seriesRef.current = {
            main: mainSeries,
            volume: volumeSeries
          };
        } else if (type === 'indicator') {
          // For indicator panes, use line series by default
          mainSeries = chart.addSeries(LineSeries, {
            color: options.color || '#2962FF',
            lineWidth: 2,
            priceScaleId: 'right',
          });
          
          // Save main series reference
          seriesRef.current = {
            main: mainSeries
          };
        }
        
        // Save chart reference
        chartRef.current = chart;
        
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
        
        // Set up crosshair move handler
        chart.subscribeCrosshairMove((param) => {
          if (onCrosshairMove) {
            onCrosshairMove(id, param);
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
        console.error(`Error initializing chart pane ${id}:`, error);
      }
    }
  }, [id, type]); // Remove options and onCrosshairMove from dependencies
  
  // Update data when it changes
  useEffect(() => {
    if (chartRef.current && seriesRef.current && data && data.length > 0) {
      try {
        console.log(`Updating ${type} chart pane ${id} with data:`, data.length, 'points');
        
        if (type === 'main') {
          // Update candlestick data
          seriesRef.current.main.setData(data);
          
          // Format volume data for the histogram series
          const volumeData = data.map(item => ({
            time: item.time,
            value: item.volume || 0,
            color: item.close >= item.open 
              ? 'rgba(38, 166, 154, 0.5)' // Green for up candles
              : 'rgba(239, 83, 80, 0.5)', // Red for down candles
          }));
          
          // Update volume data
          seriesRef.current.volume.setData(volumeData);
        } else if (type === 'indicator') {
          // For indicator panes, format data appropriately
          const formattedData = data.map(item => ({
            time: item.time,
            value: typeof item === 'object' ? item.value : item
          }));
          
          seriesRef.current.main.setData(formattedData);
        }
        
        // Fit content to view
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error(`Error updating chart pane ${id} data:`, error);
      }
    }
  }, [data, id, type]);
  
  // Update chart options when they change
  useEffect(() => {
    if (chartRef.current && options) {
      try {
        chartRef.current.applyOptions(options);
      } catch (error) {
        console.error(`Error updating chart options for ${id}:`, error);
      }
    }
  }, [options, id]);
  
  // Set up crosshair move handler when it changes
  useEffect(() => {
    if (chartRef.current && onCrosshairMove) {
      const chart = chartRef.current;
      
      // Remove previous subscription if exists
      chart.unsubscribeCrosshairMove();
      
      // Add new subscription
      chart.subscribeCrosshairMove((param) => {
        onCrosshairMove(id, param);
      });
    }
  }, [onCrosshairMove, id]);
  
  // Format value for display
  const formatValue = (value) => {
    if (value === undefined || value === null) return 'n/a';
    
    if (typeof value === 'number') {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    return value.toString();
  };
  
  // Format number with appropriate suffixes for large values
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return 'n/a';
    
    // For large numbers (like volume), format with K, M, B suffixes
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Calculate price change and percentage
  const calculatePriceChange = () => {
    if (!data || data.length < 2) return { change: 0, percentage: 0 };
    
    const currentPrice = data[data.length - 1].close;
    const previousPrice = data[data.length - 2].close;
    const change = currentPrice - previousPrice;
    const percentage = (change / previousPrice) * 100;
    
    return { change, percentage };
  };
  
  // Get OHLCV data for the latest candle
  const getLatestOHLCV = () => {
    if (!data || data.length === 0) return null;
    
    return data[data.length - 1];
  };
  
  return (
    <PaneContainer height={height}>
      {title && (
        <PaneHeader>
          <PaneTitle>
            {type === 'main' ? (
              <>
                {title}
                {data && data.length > 0 && (
                  <OHLCVInfo>
                    {(() => {
                      const ohlcv = getLatestOHLCV();
                      if (!ohlcv) return null;
                      return (
                        <>
                          <OHLCVItem>
                            <OHLCVLabel>O</OHLCVLabel>
                            <OHLCVValue>{formatValue(ohlcv.open)}</OHLCVValue>
                          </OHLCVItem>
                          <OHLCVItem>
                            <OHLCVLabel>H</OHLCVLabel>
                            <OHLCVValue>{formatValue(ohlcv.high)}</OHLCVValue>
                          </OHLCVItem>
                          <OHLCVItem>
                            <OHLCVLabel>L</OHLCVLabel>
                            <OHLCVValue>{formatValue(ohlcv.low)}</OHLCVValue>
                          </OHLCVItem>
                          <OHLCVItem>
                            <OHLCVLabel>C</OHLCVLabel>
                            <OHLCVValue>{formatValue(ohlcv.close)}</OHLCVValue>
                          </OHLCVItem>
                          <OHLCVItem>
                            <OHLCVLabel>V</OHLCVLabel>
                            <OHLCVValue>{formatNumber(ohlcv.volume, 0)}</OHLCVValue>
                          </OHLCVItem>
                          {(() => {
                            const { change, percentage } = calculatePriceChange();
                            const isPositive = change >= 0;
                            return (
                              <PriceChange isPositive={isPositive}>
                                {isPositive ? '+' : ''}{formatValue(change)} ({isPositive ? '+' : ''}{formatValue(percentage)}%)
                              </PriceChange>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </OHLCVInfo>
                )}
              </>
            ) : (
              <>
                {title}
                {currentValue !== undefined && (
                  <PaneValue color={options.color}>
                    {formatValue(currentValue)}
                  </PaneValue>
                )}
              </>
            )}
          </PaneTitle>
          <PaneControls>
            {onResize && (
              <PaneButton onClick={() => onResize(id)}>
                ⋮
              </PaneButton>
            )}
            {onClose && (
              <PaneButton onClick={() => onClose(id)}>
                ×
              </PaneButton>
            )}
          </PaneControls>
        </PaneHeader>
      )}
      <ChartCanvas ref={chartContainerRef} />
    </PaneContainer>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(ChartPane); 