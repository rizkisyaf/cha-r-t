import React from 'react';
import { FormGroup, Label, Input } from '../SettingsComponents';

// Indicator metadata
export const metadata = {
  type: 'BB',
  name: 'Bollinger Bands',
  description: 'Shows volatility and potential price levels using standard deviations',
  category: 'technicals',
  author: 'TradingView',
  defaultSettings: { 
    period: 20,
    stdDev: 2,
    middleColor: '#2962FF',
    upperColor: '#26A69A',
    lowerColor: '#EF5350'
  }
};

// Calculation function
export const calculate = (data, settings) => {
  const { period, stdDev } = settings;
  const bbData = [];
  
  if (data.length < period) {
    return bbData;
  }
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    let sumSquares = 0;
    
    // Calculate SMA and standard deviation
    for (let j = 0; j < period; j++) {
      const price = data[i - j].close;
      sum += price;
      sumSquares += price * price;
    }
    
    const sma = sum / period;
    const variance = (sumSquares - (sum * sum / period)) / period;
    const standardDeviation = Math.sqrt(variance);
    
    bbData.push({
      time: data[i].time,
      middle: sma,
      upper: sma + (standardDeviation * stdDev),
      lower: sma - (standardDeviation * stdDev)
    });
  }
  
  return bbData;
};

// Settings component
export const Settings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <Label>Period</Label>
        <Input 
          type="number" 
          name="period" 
          value={settings.period || metadata.defaultSettings.period} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
      <FormGroup>
        <Label>Standard Deviation</Label>
        <Input 
          type="number" 
          name="stdDev" 
          value={settings.stdDev || metadata.defaultSettings.stdDev} 
          onChange={onChange}
          min="0.1"
          step="0.1"
        />
      </FormGroup>
    </>
  );
};

// Display name formatter
export const formatLabel = (settings) => {
  return `BB(${settings.period},${settings.stdDev})`;
};

// Series configuration for the chart
export const getSeriesOptions = (settings) => {
  return {
    middle: {
      color: settings.middleColor || metadata.defaultSettings.middleColor,
      lineWidth: 1,
      priceLineVisible: false,
    },
    upper: {
      color: settings.upperColor || metadata.defaultSettings.upperColor,
      lineWidth: 1,
      priceLineVisible: false,
    },
    lower: {
      color: settings.lowerColor || metadata.defaultSettings.lowerColor,
      lineWidth: 1,
      priceLineVisible: false,
    }
  };
};

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
  Settings,
  formatLabel,
  getSeriesOptions,
  getValueAtPosition
}; 