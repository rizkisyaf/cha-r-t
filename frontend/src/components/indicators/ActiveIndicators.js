import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaCog, FaEye, FaEyeSlash } from 'react-icons/fa';

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
  flex-direction: column;
  gap: 2px;
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
  color: #2962FF;
  font-size: 13px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);

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
  const value = (() => {
    switch (indicator.type) {
      case 'SMA':
      case 'EMA':
        return `${indicator.period}`;
      case 'RSI':
        return `${indicator.period}`;
      case 'BB':
        return `${indicator.period}, ${indicator.stdDev}`;
      case 'MACD':
        return `${indicator.fastPeriod}, ${indicator.slowPeriod}, ${indicator.signalPeriod}`;
      default:
        return '';
    }
  })();

  return {
    name: indicator.name || indicator.type,
    value
  };
};

const ActiveIndicators = ({ 
  indicators = [], 
  onRemoveIndicator, 
  onToggleVisibility,
  onOpenSettings 
}) => {
  if (!indicators.length) return null;

  return (
    <ActiveIndicatorsContainer>
      {indicators.map((indicator, index) => {
        const { name, value } = getIndicatorLabel(indicator);
        return (
          <IndicatorTag key={`${indicator.type}-${index}`}>
            <IndicatorLabel>
              <IndicatorName>{name}</IndicatorName>
              <IndicatorValue>{value}</IndicatorValue>
            </IndicatorLabel>
            <ButtonGroup>
              <button 
                onClick={() => onOpenSettings(index, indicator)}
                title="Settings"
              >
                <FaCog />
              </button>
              <button 
                onClick={() => onToggleVisibility(index)}
                title={indicator.isVisible ? "Hide indicator" : "Show indicator"}
              >
                {indicator.isVisible ? <FaEye /> : <FaEyeSlash />}
              </button>
              <button 
                onClick={() => onRemoveIndicator(index)}
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