import React from 'react';
import { FormGroup, Label, Input, Select, CheckboxContainer, Checkbox, ColorInput } from '../SettingsComponents';
import styled from 'styled-components';

// Indicator metadata
export const metadata = {
  type: 'EMA',
  name: 'Exponential Moving Average',
  description: 'Gives more weight to recent prices for a specified period',
  category: 'technicals',
  author: 'TradingView',
  defaultSettings: { 
    period: 20,
    source: 'close',
    offset: 0,
    color: '#2962FF',
    lineWidth: 2,
    isVisible: true,
    waitForTimeframeClose: true
  }
};

// Calculation function
export const calculate = (data, settings) => {
  const { period, source = 'close', offset = 0 } = settings;
  const emaData = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first period
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][source] || data[i].close;
  }
  let ema = sum / period;
  
  // Calculate EMA for each data point
  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      if (i > period - 1) {
        ema = (data[i][source] - ema) * multiplier + ema;
      }
      
      // Apply offset if needed
      const offsetIndex = i + offset;
      if (offsetIndex >= 0 && offsetIndex < data.length) {
        emaData.push({
          time: data[offsetIndex].time,
          value: ema
        });
      }
    }
  }
  
  return emaData;
};

// Inputs Settings component
export const InputsSettings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <Label>Length</Label>
        <Input 
          type="number" 
          name="period" 
          value={settings.period || metadata.defaultSettings.period} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Source</Label>
        <Select 
          name="source" 
          value={settings.source || metadata.defaultSettings.source} 
          onChange={onChange}
        >
          <option value="close">close</option>
          <option value="open">open</option>
          <option value="high">high</option>
          <option value="low">low</option>
          <option value="hl2">(high + low) / 2</option>
          <option value="hlc3">(high + low + close) / 3</option>
          <option value="ohlc4">(open + high + low + close) / 4</option>
        </Select>
      </FormGroup>
      
      <FormGroup>
        <Label>Offset</Label>
        <Input 
          type="number" 
          name="offset" 
          value={settings.offset || metadata.defaultSettings.offset} 
          onChange={onChange}
        />
      </FormGroup>
      
      <SectionTitle>CALCULATION</SectionTitle>
      
      <FormGroup>
        <Label>Timeframe</Label>
        <Select 
          name="timeframe" 
          value={settings.timeframe || "Chart"} 
          onChange={onChange}
        >
          <option value="Chart">Chart</option>
          <option value="1m">1m</option>
          <option value="5m">5m</option>
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </Select>
      </FormGroup>
      
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="waitForTimeframeClose" 
            checked={settings.waitForTimeframeClose !== false} 
            onChange={onChange}
          />
          <Label>Wait for timeframe closes</Label>
        </CheckboxContainer>
      </FormGroup>
    </>
  );
};

// Style Settings component
export const StyleSettings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <Label>Color</Label>
        <ColorInput>
          <input 
            type="color" 
            name="color" 
            value={settings.color || metadata.defaultSettings.color} 
            onChange={onChange}
          />
          <span>{settings.color || metadata.defaultSettings.color}</span>
        </ColorInput>
      </FormGroup>
      
      <FormGroup>
        <Label>Line Width</Label>
        <Input 
          type="number" 
          name="lineWidth" 
          value={settings.lineWidth || metadata.defaultSettings.lineWidth} 
          onChange={onChange}
          min="1"
          max="4"
        />
      </FormGroup>
    </>
  );
};

// Visibility Settings component
export const VisibilitySettings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <Label>Show on chart</Label>
        <CheckboxContainer>
          <Checkbox 
            name="isVisible" 
            checked={settings.isVisible !== false} 
            onChange={onChange}
          />
        </CheckboxContainer>
      </FormGroup>
    </>
  );
};

// For backward compatibility
export const Settings = InputsSettings;

// Display name formatter
export const formatLabel = (settings) => {
  return `EMA(${settings.period})`;
};

// Series configuration for the chart
export const getSeriesOptions = (settings) => {
  return {
    color: settings.color || metadata.defaultSettings.color,
    lineWidth: settings.lineWidth || metadata.defaultSettings.lineWidth,
    priceLineVisible: false
  };
};

// Add missing SectionTitle component
const SectionTitle = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  margin-top: 16px;
  margin-bottom: 8px;
  letter-spacing: 1px;
`;

// Function to get the value at a specific position (for crosshair)
const getValueAtPosition = (crosshairData, indicator) => {
  if (!crosshairData || !crosshairData.indicatorValues) {
    return null;
  }
  
  return crosshairData.indicatorValues[indicator.type];
};

export default {
  metadata,
  calculate,
  InputsSettings,
  StyleSettings,
  VisibilitySettings,
  Settings,
  formatLabel,
  getSeriesOptions,
  getValueAtPosition
}; 