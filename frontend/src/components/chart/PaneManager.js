import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import ChartPane from './ChartPane';
import IndicatorPane from './IndicatorPane';
import { getIndicator } from '../indicators/types';

const PaneManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ResizeHandle = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--secondary-color);
  cursor: row-resize;
  position: relative;
  
  &:hover {
    background-color: var(--accent-color);
  }
  
  &:after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 2px;
    background-color: var(--border-color);
  }
`;

/**
 * PaneManager component - Manages multiple chart panes and their synchronization
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Main chart data
 * @param {Array} props.indicators - Indicators to display
 * @param {Function} props.onIndicatorRemove - Callback when an indicator is removed
 * @param {Function} props.onIndicatorVisibilityToggle - Callback when an indicator's visibility is toggled
 * @param {string} props.symbol - Symbol of the chart
 */
const PaneManager = ({
  data = [],
  indicators = [],
  onIndicatorRemove,
  onIndicatorVisibilityToggle,
  symbol = ''
}) => {
  // State for panes configuration
  const [panes, setPanes] = useState([]);
  // State for crosshair data
  const [crosshairData, setCrosshairData] = useState(null);
  // State for indicator values at crosshair position
  const [indicatorValues, setIndicatorValues] = useState({});
  
  // Initialize panes based on indicators
  useEffect(() => {
    // Always have a main chart pane
    const newPanes = [
      {
        id: 'main',
        type: 'main',
        title: symbol || 'BTCUSDT',
        height: '100%', // Default to 100% height
        data: data
      }
    ];
    
    // Group indicators by their type
    const indicatorGroups = {};
    let hasSeparatePanes = false;
    
    indicators.forEach(indicator => {
      // Skip indicators that aren't visible
      if (indicator.isVisible === false) return;
      
      // Determine which pane this indicator should go in
      let paneType;
      
      switch (indicator.type) {
        case 'RSI':
          paneType = 'rsi';
          hasSeparatePanes = true;
          break;
        case 'MACD':
          paneType = 'macd';
          hasSeparatePanes = true;
          break;
        case 'SMA':
        case 'EMA':
        case 'BB':
          paneType = 'main'; // These go on the main chart
          break;
        default:
          // Check if this indicator type needs its own pane or should go on main chart
          const indicatorModule = getIndicator(indicator.type);
          if (indicatorModule && indicatorModule.needsSeparatePane) {
            paneType = indicator.type.toLowerCase();
            hasSeparatePanes = true;
          } else {
            paneType = 'main';
          }
      }
      
      // Add to the appropriate group
      if (!indicatorGroups[paneType]) {
        indicatorGroups[paneType] = [];
      }
      
      indicatorGroups[paneType].push(indicator);
    });
    
    // If we have separate panes, adjust the main pane height
    if (hasSeparatePanes) {
      newPanes[0].height = '70%';
    }
    
    // Create panes for each indicator group
    Object.entries(indicatorGroups).forEach(([paneType, paneIndicators]) => {
      // Skip main pane indicators as they'll be handled separately
      if (paneType === 'main') return;
      
      // Create a new pane for this indicator group
      newPanes.push({
        id: paneType,
        type: 'indicator',
        title: paneType.toUpperCase(),
        height: '150px', // Default height for indicator panes
        indicators: paneIndicators,
        data: [] // Will be populated later
      });
    });
    
    // Add main pane indicators
    if (indicatorGroups.main) {
      newPanes[0].indicators = indicatorGroups.main;
    }
    
    // Update panes state
    setPanes(newPanes);
  }, [data, indicators, symbol]);
  
  // Calculate indicator data for each pane
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Update panes with calculated indicator data
    setPanes(currentPanes => {
      return currentPanes.map(pane => {
        // Skip main pane data as it's already set
        if (pane.type === 'main') return pane;
        
        // Calculate data for this pane's indicators
        let paneData = [];
        
        if (pane.indicators && pane.indicators.length > 0) {
          // Get the first indicator to determine the data format
          const firstIndicator = pane.indicators[0];
          const indicatorModule = getIndicator(firstIndicator.type);
          
          if (indicatorModule) {
            try {
              paneData = indicatorModule.calculate(data, firstIndicator);
              
              // Format data for the chart
              if (firstIndicator.type === 'RSI') {
                paneData = paneData.map(d => ({
                  time: d.time,
                  value: d.value
                }));
              } else if (firstIndicator.type === 'MACD') {
                // For MACD, we'll handle this specially in the ChartPane component
                paneData = paneData;
              }
            } catch (error) {
              console.error(`Error calculating data for ${firstIndicator.type}:`, error);
            }
          }
        }
        
        return {
          ...pane,
          data: paneData
        };
      });
    });
  }, [data]);
  
  // Handle crosshair movement
  const handleCrosshairMove = useCallback((paneId, param) => {
    if (!param.point) return;
    
    // Update crosshair data
    setCrosshairData({
      paneId,
      point: param.point,
      time: param.time
    });
    
    // Calculate indicator values at this point
    if (param.time) {
      const newIndicatorValues = {};
      
      // Process each indicator
      indicators.forEach(indicator => {
        try {
          const indicatorModule = getIndicator(indicator.type);
          if (!indicatorModule) return;
          
          const calculatedData = indicatorModule.calculate(data, indicator);
          const indicatorPoint = calculatedData.find(d => d.time === param.time);
          
          if (indicatorPoint) {
            if (indicator.type === 'SMA' || indicator.type === 'EMA') {
              newIndicatorValues[indicator.id] = indicatorPoint.value;
            } else if (indicator.type === 'BB') {
              newIndicatorValues[indicator.id] = {
                middle: indicatorPoint.middle,
                upper: indicatorPoint.upper,
                lower: indicatorPoint.lower
              };
            } else if (indicator.type === 'MACD') {
              newIndicatorValues[indicator.id] = {
                macd: indicatorPoint.macd,
                signal: indicatorPoint.signal,
                histogram: indicatorPoint.histogram
              };
            } else if (indicator.type === 'RSI') {
              newIndicatorValues[indicator.id] = indicatorPoint.value;
            }
          }
        } catch (err) {
          console.error(`Error processing indicator ${indicator.type}:`, err);
        }
      });
      
      // Update indicator values
      setIndicatorValues(newIndicatorValues);
    }
  }, [data, indicators]);
  
  // Handle pane resize
  const handlePaneResize = useCallback((paneId, newHeight) => {
    setPanes(currentPanes => {
      return currentPanes.map(pane => {
        if (pane.id === paneId) {
          return {
            ...pane,
            height: newHeight
          };
        }
        return pane;
      });
    });
  }, []);
  
  // Handle pane close
  const handlePaneClose = useCallback((paneId) => {
    // Don't allow closing the main pane
    if (paneId === 'main') return;
    
    // Remove the pane and get indicators to remove
    let indicatorsToRemove = [];
    
    setPanes(currentPanes => {
      const paneToRemove = currentPanes.find(pane => pane.id === paneId);
      if (paneToRemove && paneToRemove.indicators) {
        indicatorsToRemove = [...paneToRemove.indicators];
      }
      return currentPanes.filter(pane => pane.id !== paneId);
    });
    
    // Call the indicator remove callback for all indicators in this pane
    if (onIndicatorRemove && indicatorsToRemove.length > 0) {
      indicatorsToRemove.forEach(indicator => {
        onIndicatorRemove(indicator);
      });
    }
  }, [onIndicatorRemove]);
  
  // Get current value for a pane
  const getPaneCurrentValue = useCallback((pane) => {
    if (!pane || !pane.indicators || pane.indicators.length === 0) return undefined;
    
    // For main pane, return the latest price
    if (pane.type === 'main' && data && data.length > 0) {
      return data[data.length - 1].close;
    }
    
    // For indicator panes, return the value of the first indicator
    const firstIndicator = pane.indicators[0];
    if (crosshairData && crosshairData.time) {
      return indicatorValues[firstIndicator.id];
    }
    
    // If no crosshair data, return the latest calculated value
    if (pane.data && pane.data.length > 0) {
      const latestPoint = pane.data[pane.data.length - 1];
      if (firstIndicator.type === 'MACD') {
        return {
          macd: latestPoint.macd,
          signal: latestPoint.signal,
          histogram: latestPoint.histogram
        };
      }
      return latestPoint.value;
    }
    
    return undefined;
  }, [data, crosshairData, indicatorValues]);
  
  // Memoize the rendered panes to prevent unnecessary re-renders
  const renderedPanes = useMemo(() => {
    return panes.map((pane, index) => (
      <React.Fragment key={pane.id}>
        {pane.type === 'main' ? (
          <ChartPane
            id={pane.id}
            type={pane.type}
            title={pane.title}
            data={pane.data || data}
            height={pane.height}
            indicators={pane.indicators || []}
            currentValue={getPaneCurrentValue(pane)}
            onCrosshairMove={handleCrosshairMove}
            onResize={handlePaneResize}
            onClose={handlePaneClose}
          />
        ) : (
          <IndicatorPane
            id={pane.id}
            type={pane.id} // Use pane.id as the indicator type (rsi, macd, etc.)
            title={pane.title}
            data={pane.data}
            height={pane.height}
            currentValue={getPaneCurrentValue(pane)}
            onCrosshairMove={handleCrosshairMove}
            onResize={handlePaneResize}
            onClose={handlePaneClose}
            options={{
              // Special options for different pane types
              ...(pane.id === 'rsi' && {
                color: '#7B1FA2', // Purple for RSI
                priceScale: {
                  scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                  },
                  borderVisible: true,
                },
                // RSI should be bounded between 0-100
                priceFormat: {
                  type: 'custom',
                  minMove: 0.01,
                  formatter: (price) => price.toFixed(2),
                },
              }),
              ...(pane.id === 'macd' && {
                color: '#2962FF', // Blue for MACD
                priceScale: {
                  scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                  },
                  borderVisible: true,
                },
              }),
            }}
          />
        )}
        {/* Add resize handle between panes */}
        {index < panes.length - 1 && (
          <ResizeHandle
            onMouseDown={(e) => {
              // Implement resize logic here
              // This would involve tracking mouse movement and updating pane heights
            }}
          />
        )}
      </React.Fragment>
    ));
  }, [
    panes, 
    data, 
    getPaneCurrentValue, 
    handleCrosshairMove, 
    handlePaneResize, 
    handlePaneClose
  ]);
  
  return (
    <PaneManagerContainer>
      {renderedPanes}
    </PaneManagerContainer>
  );
};

export default PaneManager; 