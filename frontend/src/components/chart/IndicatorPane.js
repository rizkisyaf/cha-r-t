import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';

const PaneContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.height || '150px'};
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

const PaneValues = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
`;

const PaneValue = styled.div`
  color: ${props => props.color || 'var(--text-color)'};
  font-weight: 500;
  font-size: 11px;
  display: flex;
  align-items: center;
  
  &:before {
    content: '';
    display: ${props => props.showLine ? 'inline-block' : 'none'};
    width: 8px;
    height: 2px;
    background-color: ${props => props.color || 'var(--text-color)'};
    margin-right: 4px;
  }
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
 * IndicatorPane component - A modular chart pane for any indicator type
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the pane
 * @param {string} props.type - Indicator type ('RSI', 'MACD', etc.)
 * @param {string} props.title - Title of the pane
 * @param {Array} props.data - Indicator data to display
 * @param {string} props.height - Height of the pane
 * @param {Object} props.options - Chart options
 * @param {Object} props.currentValue - Current indicator value(s)
 * @param {Function} props.onCrosshairMove - Callback for crosshair movement
 * @param {Function} props.onResize - Callback for pane resize
 * @param {Function} props.onClose - Callback for pane close
 */
const IndicatorPane = ({
  id,
  type = 'indicator',
  title,
  data = [],
  height = '150px',
  options = {},
  currentValue,
  onCrosshairMove,
  onResize,
  onClose
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRefs = useRef({});
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
        console.log(`Initializing ${type} indicator pane`);
        
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
              color: 'rgba(224, 227, 235, 0.1)',
              width: 1,
              style: 0,
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
          rightPriceScale: {
            borderColor: '#2A2E39',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          }
        };
        
        // Create chart with merged options
        const chart = createChart(chartContainerRef.current, {
          ...defaultOptions,
          ...options
        });
        
        // Configure the chart based on indicator type
        switch (type.toUpperCase()) {
          case 'RSI': {
            // Configure the price scale to show 0-100 range for RSI
            chart.priceScale('right').applyOptions({
              autoScale: false,
              scaleMargins: {
                top: 0.1,
                bottom: 0.1,
              },
              minValue: 0,
              maxValue: 100,
            });
            
            // Add reference lines
            const overboughtLine = chart.addSeries(LineSeries, {
              color: 'rgba(38, 166, 154, 0.5)', // Green
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
            });
            
            const middleLine = chart.addSeries(LineSeries, {
              color: 'rgba(255, 255, 255, 0.3)', // White
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
            });
            
            const oversoldLine = chart.addSeries(LineSeries, {
              color: 'rgba(239, 83, 80, 0.5)', // Red
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
            });
            
            // Add main RSI line
            const rsiSeries = chart.addSeries(LineSeries, {
              color: options.color || '#7B1FA2', // Purple by default
              lineWidth: 2,
              priceScaleId: 'right',
            });
            
            // Set reference lines data if we have data
            if (data && data.length > 0) {
              const startTime = data[0].time;
              const endTime = data[data.length - 1].time;
              
              overboughtLine.setData([
                { time: startTime, value: 70 },
                { time: endTime, value: 70 }
              ]);
              
              middleLine.setData([
                { time: startTime, value: 50 },
                { time: endTime, value: 50 }
              ]);
              
              oversoldLine.setData([
                { time: startTime, value: 30 },
                { time: endTime, value: 30 }
              ]);
            }
            
            // Save references
            seriesRefs.current = {
              main: rsiSeries,
              overbought: overboughtLine,
              middle: middleLine,
              oversold: oversoldLine
            };
            break;
          }
          
          case 'MACD': {
            // Add a zero line
            const zeroLine = chart.addSeries(LineSeries, {
              color: 'rgba(255, 255, 255, 0.3)',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              priceScaleId: 'right',
            });
            
            // Set zero line data if we have data
            if (data && data.length > 0) {
              zeroLine.setData([
                { time: data[0].time, value: 0 },
                { time: data[data.length - 1].time, value: 0 }
              ]);
            }
            
            // Add MACD line
            const macdSeries = chart.addSeries(LineSeries, {
              color: '#2962FF', // Blue
              lineWidth: 2,
              priceScaleId: 'right',
            });
            
            // Add signal line
            const signalSeries = chart.addSeries(LineSeries, {
              color: '#FF6D00', // Orange
              lineWidth: 2,
              priceScaleId: 'right',
            });
            
            // Add histogram
            const histogramSeries = chart.addSeries(HistogramSeries, {
              priceScaleId: 'right',
            });
            
            // Save references
            seriesRefs.current = {
              macd: macdSeries,
              signal: signalSeries,
              histogram: histogramSeries,
              zeroLine: zeroLine
            };
            break;
          }
          
          default: {
            // For other indicators, just add a main line series
            const mainSeries = chart.addSeries(LineSeries, {
              color: options.color || '#2962FF', // Blue by default
              lineWidth: 2,
              priceScaleId: 'right',
            });
            
            // Save reference
            seriesRefs.current = {
              main: mainSeries
            };
            break;
          }
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
        console.error(`Error initializing ${type} indicator pane:`, error);
      }
    }
  }, [id, type]);
  
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
  
  // Update data when it changes
  useEffect(() => {
    if (chartRef.current && seriesRefs.current && data && data.length > 0) {
      try {
        console.log(`Updating ${type} indicator pane with data:`, data.length, 'points');
        
        switch (type.toUpperCase()) {
          case 'RSI': {
            // Format data for RSI series
            const rsiData = data.map(item => ({
              time: item.time,
              value: typeof item === 'object' ? item.value : item
            }));
            
            // Update RSI data
            seriesRefs.current.main.setData(rsiData);
            
            // Update reference lines with the correct time range
            const startTime = data[0].time;
            const endTime = data[data.length - 1].time;
            
            if (seriesRefs.current.overbought) {
              seriesRefs.current.overbought.setData([
                { time: startTime, value: 70 },
                { time: endTime, value: 70 }
              ]);
            }
            
            if (seriesRefs.current.middle) {
              seriesRefs.current.middle.setData([
                { time: startTime, value: 50 },
                { time: endTime, value: 50 }
              ]);
            }
            
            if (seriesRefs.current.oversold) {
              seriesRefs.current.oversold.setData([
                { time: startTime, value: 30 },
                { time: endTime, value: 30 }
              ]);
            }
            break;
          }
          
          case 'MACD': {
            // Format data for each MACD series
            const macdData = data.map(item => ({
              time: item.time,
              value: item.macd
            }));
            
            const signalData = data.map(item => ({
              time: item.time,
              value: item.signal
            }));
            
            const histogramData = data.map(item => ({
              time: item.time,
              value: item.histogram,
              color: item.histogram >= 0 
                ? 'rgba(38, 166, 154, 0.5)' // Green for positive
                : 'rgba(239, 83, 80, 0.5)'  // Red for negative
            }));
            
            // Update series data
            seriesRefs.current.macd.setData(macdData);
            seriesRefs.current.signal.setData(signalData);
            seriesRefs.current.histogram.setData(histogramData);
            
            // Update zero line
            if (seriesRefs.current.zeroLine) {
              seriesRefs.current.zeroLine.setData([
                { time: data[0].time, value: 0 },
                { time: data[data.length - 1].time, value: 0 }
              ]);
            }
            break;
          }
          
          default: {
            // For other indicators, format data appropriately
            const formattedData = data.map(item => ({
              time: item.time,
              value: typeof item === 'object' ? item.value : item
            }));
            
            // Update main series
            seriesRefs.current.main.setData(formattedData);
            break;
          }
        }
        
        // Fit content to view
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error(`Error updating ${type} indicator pane data:`, error);
      }
    }
  }, [data, type]);
  
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
  
  // Render indicator values based on type
  const renderIndicatorValues = () => {
    if (!currentValue) return null;
    
    switch (type.toUpperCase()) {
      case 'RSI':
        return (
          <PaneValue 
            color={
              currentValue > 70 ? '#26A69A' : // Overbought - green
              currentValue < 30 ? '#EF5350' : // Oversold - red
              'var(--text-color)' // Normal
            }
          >
            {formatValue(currentValue)}
          </PaneValue>
        );
        
      case 'MACD':
        return (
          <PaneValues>
            <PaneValue color="#2962FF" showLine>
              MACD: {formatValue(currentValue.macd)}
            </PaneValue>
            <PaneValue color="#FF6D00" showLine>
              Signal: {formatValue(currentValue.signal)}
            </PaneValue>
            <PaneValue 
              color={currentValue.histogram >= 0 ? '#26A69A' : '#EF5350'} 
              showLine
            >
              Hist: {formatValue(currentValue.histogram)}
            </PaneValue>
          </PaneValues>
        );
        
      default:
        return (
          <PaneValue color={options.color}>
            {formatValue(currentValue)}
          </PaneValue>
        );
    }
  };
  
  return (
    <PaneContainer height={height}>
      <PaneHeader>
        <PaneTitle>
          {title || type}
          {renderIndicatorValues()}
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
      <ChartCanvas ref={chartContainerRef} />
    </PaneContainer>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(IndicatorPane); 