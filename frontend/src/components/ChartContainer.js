import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FaRulerHorizontal, 
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
  FaChevronDown} from 'react-icons/fa';
import { IndicatorsModal, IndicatorSettings } from './indicators';
import { PaneManager } from './chart';

const ChartContainerWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
  width: 100%;
  transition: width 0.3s ease;
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
    color: var(--accent-color);
    border-left: 2px solid var(--accent-color);
    padding-left: 10px;
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
      border-bottom: 2px solid var(--accent-color);
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

/**
 * ChartContainer component - Main chart container with header and tools
 * 
 * @param {Object} props - Component props
 * @param {string} props.symbol - Symbol to display
 * @param {string} props.timeframe - Timeframe to display
 * @param {Array} props.data - Chart data
 * @param {Object} props.context - Chart context with indicators
 * @param {Function} props.onTimeframeChange - Callback for timeframe change
 * @param {Function} props.onIndicatorAdd - Callback for indicator add/remove
 */
const ChartContainer = ({ 
  symbol, 
  timeframe, 
  data, 
  context = { indicators: [] }, 
  onTimeframeChange, 
  onIndicatorAdd 
}) => {
  const [activeToolIndex, setActiveToolIndex] = useState(null);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('Candles');
  const [isIndicatorsMenuOpen, setIsIndicatorsMenuOpen] = useState(false);
  const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false);
  const [currentIndicator, setCurrentIndicator] = useState(null);
  const [crosshairData, setCrosshairData] = useState(null);
  
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
  
  // Handle crosshair movement
  const handleCrosshairMove = useCallback((paneId, param) => {
    if (!param.point || !param.time) return;
    
    // Find the candle at this time
    const candle = data.find(d => d.time === param.time);
    if (!candle) return;
    
    // Update crosshair data
    setCrosshairData({
      time: param.time,
      point: candle
    });
  }, [data]);
  
  // Handle indicator removal
  const handleRemoveIndicator = (indicator) => {
    if (onIndicatorAdd) {
      const newIndicators = context.indicators.filter(ind => 
        !(ind.type === indicator.type && ind.period === indicator.period)
      );
      onIndicatorAdd(newIndicators);
    }
  };
  
  // Handle indicator visibility toggle
  const handleToggleIndicatorVisibility = (indicator) => {
    if (onIndicatorAdd) {
      const newIndicators = context.indicators.map(ind => {
        if (ind.type === indicator.type && ind.period === indicator.period) {
          return {
            ...ind,
            isVisible: ind.isVisible === false ? true : false
          };
        }
        return ind;
      });
      onIndicatorAdd(newIndicators);
    }
  };
  
  // Handle indicator settings open
  const handleOpenIndicatorSettings = (indicator) => {
    setCurrentIndicator(indicator);
    setIsIndicatorSettingsOpen(true);
  };
  
  // Handle indicator settings save
  const handleSaveIndicatorSettings = (updatedIndicator) => {
    if (onIndicatorAdd) {
      const newIndicators = context.indicators.map(ind => {
        if (ind.type === currentIndicator.type && ind.period === currentIndicator.period) {
          return updatedIndicator;
        }
        return ind;
      });
      onIndicatorAdd(newIndicators);
      setIsIndicatorSettingsOpen(false);
      setCurrentIndicator(null);
    }
  };

  return (
    <ChartContainerWrapper>
      <ChartHeader>
        <ChartStatusSection>
          <IndicatorsControl>
            <IndicatorButton onClick={() => setIsIndicatorsMenuOpen(!isIndicatorsMenuOpen)}>
              <FaRulerHorizontal />
              Indicators
            </IndicatorButton>
          </IndicatorsControl>
          
          <ChartTypeDropdown>
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
        <PaneManager
          data={data}
          indicators={context.indicators} 
          onIndicatorRemove={handleRemoveIndicator}
          onIndicatorVisibilityToggle={handleToggleIndicatorVisibility}
          symbol={symbol}
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