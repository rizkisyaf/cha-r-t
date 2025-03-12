import React from 'react';
import { FormGroup, Label, Input, Select, CheckboxContainer, Checkbox, ColorInput } from '../SettingsComponents';
import styled from 'styled-components';

// Indicator metadata
export const metadata = {
  type: 'RSI',
  name: 'Relative Strength Index',
  description: 'Measures the speed and change of price movements on a scale of 0 to 100',
  category: 'technicals',
  author: 'TradingView',
  defaultSettings: { 
    period: 14,
    source: 'close',
    offset: 0,
    color: '#FF6B6B',
    upperBand: 70,
    lowerBand: 30,
    upperBandColor: '#EF5350',
    lowerBandColor: '#26A69A',
    lineWidth: 2,
    isVisible: true,
    showBands: true,
    waitForTimeframeClose: true
  }
};

// Calculation function
export const calculate = (data, settings) => {
  const { period, source = 'close', offset = 0 } = settings;
  const rsiData = [];
  
  if (data.length < period + 1) {
    return rsiData;
  }
  
  let gains = 0;
  let losses = 0;
  
  // First pass: calculate initial averages
  for (let i = 1; i <= period; i++) {
    const change = data[i][source] - data[i - 1][source];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  // Calculate first RSI
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  
  // Apply offset if needed
  const offsetIndex = period + offset;
  if (offsetIndex >= 0 && offsetIndex < data.length) {
    rsiData.push({
      time: data[offsetIndex].time,
      value: rsi
    });
  }
  
  // Calculate rest of RSI values
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i][source] - data[i - 1][source];
    let currentGain = 0;
    let currentLoss = 0;
    
    if (change >= 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }
    
    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    
    // Apply offset if needed
    const offsetIndex = i + offset;
    if (offsetIndex >= 0 && offsetIndex < data.length) {
      rsiData.push({
        time: data[offsetIndex].time,
        value: rsi
      });
    }
  }
  
  return rsiData;
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
      
      <SectionTitle>BANDS</SectionTitle>
      
      <FormGroup>
        <Label>Overbought Level</Label>
        <Input 
          type="number" 
          name="upperBand" 
          value={settings.upperBand || metadata.defaultSettings.upperBand} 
          onChange={onChange}
          min="1"
          max="100"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>Oversold Level</Label>
        <Input 
          type="number" 
          name="lowerBand" 
          value={settings.lowerBand || metadata.defaultSettings.lowerBand} 
          onChange={onChange}
          min="0"
          max="99"
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
        <Label>RSI Color</Label>
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
      
      <SectionTitle>BANDS</SectionTitle>
      
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="showBands" 
            checked={settings.showBands !== false} 
            onChange={onChange}
          />
          <Label>Show Bands</Label>
        </CheckboxContainer>
      </FormGroup>
      
      <FormGroup>
        <Label>Overbought Band Color</Label>
        <ColorInput>
          <input 
            type="color" 
            name="upperBandColor" 
            value={settings.upperBandColor || metadata.defaultSettings.upperBandColor} 
            onChange={onChange}
          />
          <span>{settings.upperBandColor || metadata.defaultSettings.upperBandColor}</span>
        </ColorInput>
      </FormGroup>
      
      <FormGroup>
        <Label>Oversold Band Color</Label>
        <ColorInput>
          <input 
            type="color" 
            name="lowerBandColor" 
            value={settings.lowerBandColor || metadata.defaultSettings.lowerBandColor} 
            onChange={onChange}
          />
          <span>{settings.lowerBandColor || metadata.defaultSettings.lowerBandColor}</span>
        </ColorInput>
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
  return `RSI(${settings.period})`;
};

// Series configuration for the chart
export const getSeriesOptions = (settings) => {
  return {
    color: settings.color || metadata.defaultSettings.color,
    lineWidth: settings.lineWidth || metadata.defaultSettings.lineWidth,
    priceLineVisible: false,
    priceScaleId: 'rsi',
    scaleMargins: {
      top: 0.8,
      bottom: 0,
    },
  };
};

// Function to get the value at a specific position (for crosshair)
const getValueAtPosition = (crosshairData, indicator) => {
  if (!crosshairData || !crosshairData.indicatorValues) {
    return null;
  }
  
  return crosshairData.indicatorValues[indicator.type];
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