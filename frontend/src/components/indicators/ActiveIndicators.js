import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaTimes, FaCog, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getIndicator } from './types';

const ActiveIndicatorsContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  pointer-events: auto;
  max-width: calc(100% - 32px);
  background: rgba(19, 23, 34, 0.95);
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
`;

const IndicatorTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(30, 34, 45, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: #fff;
  gap: 12px;
  transition: all 0.2s ease;
  min-width: 200px;

  &:hover {
    border-color: rgba(41, 98, 255, 0.6);
    background: rgba(41, 98, 255, 0.15);
  }
`;

const IndicatorLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const IndicatorName = styled.span`
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IndicatorValue = styled.span`
  color: ${props => props.color || '#2962FF'};
  font-size: 13px;
  font-weight: 500;
  margin-left: auto;
  padding-left: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  transition: opacity 0.2s ease;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;

    &:hover {
      color: #2962FF;
    }
  }
`;

const getIndicatorLabel = (indicator) => {
  // Ensure indicator is a valid object
  if (!indicator || typeof indicator !== 'object') {
    return { name: 'Unknown', value: '' };
  }

  // Get the indicator module
  const indicatorModule = getIndicator(indicator.type);
  if (!indicatorModule) {
    return { name: indicator.type || 'Unknown', value: '' };
  }

  // Use the formatLabel function from the indicator module
  return {
    name: indicatorModule.formatLabel(indicator),
    color: indicator.color || indicatorModule.metadata.defaultSettings.color
  };
};

// Format indicator value with appropriate precision
const formatIndicatorValue = (value, precision = 2) => {
  if (value === undefined || value === null) return 'n/a';
  
  try {
    // Handle complex indicator values (like BB and MACD)
    if (typeof value === 'object') {
      if (value.middle !== undefined) {
        // Bollinger Bands
        return `M: ${Number(value.middle).toFixed(precision)} U: ${Number(value.upper).toFixed(precision)} L: ${Number(value.lower).toFixed(precision)}`;
      } else if (value.macd !== undefined) {
        // MACD
        return `MACD: ${Number(value.macd).toFixed(precision)} S: ${Number(value.signal).toFixed(precision)} H: ${Number(value.histogram).toFixed(precision)}`;
      }
      // Return first value if it's an object but not recognized format
      const firstKey = Object.keys(value)[0];
      return firstKey ? `${Number(value[firstKey]).toFixed(precision)}` : 'n/a';
    }
    
    // Handle NaN values
    if (isNaN(value)) return 'n/a';
    
    return Number(value).toFixed(precision);
  } catch (err) {
    console.error('Error formatting indicator value:', err);
    return 'n/a';
  }
};

const ActiveIndicators = ({ 
  indicators = [], 
  onRemoveIndicator, 
  onToggleVisibility,
  onOpenSettings,
  crosshairData = null
}) => {
  const [hoveredIndicator, setHoveredIndicator] = useState(null);
  const [indicatorValues, setIndicatorValues] = useState({});
  const prevCrosshairTimeRef = useRef(null);
  const indicatorDataCache = useRef({});

  // Initialize with crosshairData if available
  useEffect(() => {
    if (crosshairData && crosshairData.indicatorValues) {
      setIndicatorValues(crosshairData.indicatorValues);
      
      // Also update the cache
      Object.keys(crosshairData.indicatorValues).forEach(key => {
        indicatorDataCache.current[key] = crosshairData.indicatorValues[key];
      });
      
      console.log('Initialized indicator values from crosshairData:', crosshairData.indicatorValues);
    }
  }, []);

  // Cache indicator data for each indicator
  useEffect(() => {
    if (indicators.length > 0) {
      // This will ensure we have cached data even if crosshair hasn't moved yet
      indicators.forEach(indicator => {
        try {
          const indicatorModule = getIndicator(indicator.type);
          if (indicatorModule && window.chartData && window.chartData.length > 0) {
            // Calculate the indicator data
            const calculatedData = indicatorModule.calculate(window.chartData, indicator);
            if (calculatedData.length > 0) {
              // Store the last value
              const lastPoint = calculatedData[calculatedData.length - 1];
              
              // Extract the value based on indicator type
              let value;
              if (indicator.type === 'SMA') {
                // Special handling for SMA
                if (typeof lastPoint === 'number') {
                  value = lastPoint;
                } else if (lastPoint.value !== undefined) {
                  value = lastPoint.value;
                } else if (lastPoint.close !== undefined) {
                  value = lastPoint.close;
                } else {
                  // Try to find any numeric property
                  const keys = Object.keys(lastPoint);
                  for (const key of keys) {
                    if (key !== 'time' && typeof lastPoint[key] === 'number') {
                      value = lastPoint[key];
                      break;
                    }
                  }
                }
                console.log(`Cached SMA value: ${value}`);
              } else if (indicator.type === 'BB') {
                value = {
                  middle: lastPoint.middle,
                  upper: lastPoint.upper,
                  lower: lastPoint.lower
                };
              } else if (indicator.type === 'MACD') {
                value = {
                  macd: lastPoint.macd,
                  signal: lastPoint.signal,
                  histogram: lastPoint.histogram
                };
              } else if (lastPoint.value !== undefined) {
                value = lastPoint.value;
              } else {
                // Try to find any numeric property
                const firstValueKey = Object.keys(lastPoint).find(key => 
                  key !== 'time' && typeof lastPoint[key] === 'number'
                );
                if (firstValueKey) {
                  value = lastPoint[firstValueKey];
                }
              }
              
              if (value !== undefined) {
                indicatorDataCache.current[indicator.type] = value;
                console.log(`Cached value for ${indicator.type}:`, value);
              }
            }
          }
        } catch (err) {
          console.error(`Error caching data for ${indicator.type}:`, err);
        }
      });
    }
  }, [indicators]);

  // Update indicator values when crosshair data changes
  useEffect(() => {
    if (crosshairData && crosshairData.indicatorValues) {
      console.log('ActiveIndicators received new crosshairData:', crosshairData);
      
      // Create a new values object
      const newValues = {};
      
      // Process each indicator type
      indicators.forEach(indicator => {
        const type = indicator.type;
        
        // First check if we have a value in crosshairData
        if (crosshairData.indicatorValues[type] !== undefined) {
          newValues[type] = crosshairData.indicatorValues[type];
          console.log(`Using crosshair value for ${type}:`, newValues[type]);
        } 
        // Otherwise use cached value if available
        else if (indicatorDataCache.current[type] !== undefined) {
          newValues[type] = indicatorDataCache.current[type];
          console.log(`Using cached value for ${type}:`, newValues[type]);
        }
        
        // Special handling for SMA to ensure we always have a value
        if (type === 'SMA' && newValues[type] === undefined) {
          try {
            const indicatorModule = getIndicator(type);
            if (indicatorModule && window.chartData && window.chartData.length > 0) {
              const calculatedData = indicatorModule.calculate(window.chartData, indicator);
              if (calculatedData.length > 0) {
                // Get the last calculated value
                const lastPoint = calculatedData[calculatedData.length - 1];
                if (lastPoint && lastPoint.value !== undefined) {
                  newValues[type] = lastPoint.value;
                  console.log(`Calculated SMA value on demand:`, newValues[type]);
                }
              }
            }
          } catch (err) {
            console.error('Error calculating SMA value on demand:', err);
          }
        }
      });
      
      // Update the state with the new values
      setIndicatorValues(newValues);
      
      // Update the previous time ref
      prevCrosshairTimeRef.current = crosshairData.time;
      
      // Update cache with new values
      Object.keys(newValues).forEach(key => {
        indicatorDataCache.current[key] = newValues[key];
      });
    }
  }, [crosshairData, indicators]);

  // Debug log when indicator values change
  useEffect(() => {
    console.log('Indicator values updated:', indicatorValues);
  }, [indicatorValues]);

  if (!indicators.length) return null;

  // Filter out any duplicate indicators by creating a unique ID for each
  const uniqueIndicators = indicators.reduce((acc, indicator, index) => {
    // Create a unique ID based on type and parameters
    const uniqueId = `${indicator.type}-${index}`;
    
    // Only add if this unique ID isn't already in our accumulator
    if (!acc.some(item => item.uniqueId === uniqueId)) {
      acc.push({ ...indicator, uniqueId, originalIndex: index });
    }
    return acc;
  }, []);

  return (
    <ActiveIndicatorsContainer>
      {uniqueIndicators.map((indicator) => {
        const { name, color } = getIndicatorLabel(indicator);
        const isHovered = hoveredIndicator === indicator.uniqueId;
        // Use indicator type as the key for the value
        const currentValue = indicatorValues[indicator.type];
        
        // Debug log for each indicator being rendered
        console.log(`Rendering indicator ${indicator.type}: value = ${JSON.stringify(currentValue)}, isHovered = ${isHovered}`);
        
        return (
          <IndicatorTag 
            key={indicator.uniqueId}
            onMouseEnter={() => setHoveredIndicator(indicator.uniqueId)}
            onMouseLeave={() => setHoveredIndicator(null)}
          >
            <IndicatorLabel>
              <IndicatorName>{name}</IndicatorName>
              {!isHovered && (
                <IndicatorValue color={color}>
                  {formatIndicatorValue(currentValue, indicator.precision || 2)}
                </IndicatorValue>
              )}
            </IndicatorLabel>
            
            <ButtonGroup style={{ 
              opacity: isHovered ? 1 : 0, 
              pointerEvents: isHovered ? 'auto' : 'none',
              display: isHovered ? 'flex' : 'none'
            }}>
              <button 
                onClick={() => onOpenSettings(indicator.originalIndex, indicator)}
                title="Settings"
              >
                <FaCog />
              </button>
              <button 
                onClick={() => onToggleVisibility(indicator.originalIndex)}
                title={indicator.isVisible ? "Hide indicator" : "Show indicator"}
              >
                {indicator.isVisible !== false ? <FaEye /> : <FaEyeSlash />}
              </button>
              <button 
                onClick={() => onRemoveIndicator(indicator.originalIndex)}
                title="Remove indicator"
              >
                <FaTimes />
              </button>
            </ButtonGroup>
          </IndicatorTag>
        )
      })}
    </ActiveIndicatorsContainer>
  );
};

export default ActiveIndicators;