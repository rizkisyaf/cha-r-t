import React from 'react';
import { FormGroup, Label, Input } from '../SettingsComponents';

// Indicator metadata
const metadata = {
  type: 'MACD',
  name: 'Moving Average Convergence Divergence',
  description: 'Shows the relationship between two moving averages of a security\'s price',
  category: 'technicals',
  author: 'TradingView',
  defaultSettings: { 
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    macdColor: '#2962FF',
    signalColor: '#FF6B6B',
    histogramPositiveColor: '#26A69A',
    histogramNegativeColor: '#EF5350'
  }
};

// Calculation function
const calculate = (data, settings) => {
  const { fastPeriod, slowPeriod, signalPeriod } = settings;
  const macdData = [];
  
  if (data.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
    return macdData;
  }
  
  // Calculate EMA for fast period
  const fastEMA = calculateEMA(data, fastPeriod);
  
  // Calculate EMA for slow period
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = [];
  const startIndex = Math.max(fastPeriod, slowPeriod) - 1;
  
  for (let i = startIndex; i < data.length; i++) {
    const macd = fastEMA[i - startIndex + fastPeriod - 1] - slowEMA[i - startIndex + slowPeriod - 1];
    macdLine.push({
      time: data[i].time,
      value: macd
    });
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMAFromValues(
    macdLine.map(item => item.value), 
    signalPeriod
  );
  
  // Calculate histogram (MACD line - signal line)
  for (let i = signalPeriod - 1; i < macdLine.length; i++) {
    const macd = macdLine[i].value;
    const signal = signalLine[i - (signalPeriod - 1)];
    const histogram = macd - signal;
    
    macdData.push({
      time: macdLine[i].time,
      macd: macd,
      signal: signal,
      histogram: histogram
    });
  }
  
  return macdData;
};

// Helper function to calculate EMA
function calculateEMA(data, period) {
  const emaData = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first period
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  emaData.push(ema);
  
  // Calculate EMA for each data point
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    emaData.push(ema);
  }
  
  return emaData;
}

// Helper function to calculate EMA from an array of values
function calculateEMAFromValues(values, period) {
  const emaData = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first period
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let ema = sum / period;
  emaData.push(ema);
  
  // Calculate EMA for each data point
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    emaData.push(ema);
  }
  
  return emaData;
}

// Settings component
const Settings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <Label>Fast Period</Label>
        <Input 
          type="number" 
          name="fastPeriod" 
          value={settings.fastPeriod || metadata.defaultSettings.fastPeriod} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
      <FormGroup>
        <Label>Slow Period</Label>
        <Input 
          type="number" 
          name="slowPeriod" 
          value={settings.slowPeriod || metadata.defaultSettings.slowPeriod} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
      <FormGroup>
        <Label>Signal Period</Label>
        <Input 
          type="number" 
          name="signalPeriod" 
          value={settings.signalPeriod || metadata.defaultSettings.signalPeriod} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
    </>
  );
};

// Display name formatter
const formatLabel = (settings) => {
  return `MACD(${settings.fastPeriod},${settings.slowPeriod},${settings.signalPeriod})`;
};

// Series configuration for the chart
const getSeriesOptions = (settings) => {
  return {
    macd: {
      color: settings.macdColor || metadata.defaultSettings.macdColor,
      lineWidth: 2,
      priceLineVisible: false,
    },
    signal: {
      color: settings.signalColor || metadata.defaultSettings.signalColor,
      lineWidth: 2,
      priceLineVisible: false,
    },
    histogram: {
      color: settings.histogramPositiveColor || metadata.defaultSettings.histogramPositiveColor,
      priceFormat: { type: 'volume' },
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

// Export all components and functions
export {
  metadata,
  calculate,
  Settings as SettingsComponent,
  formatLabel,
  getSeriesOptions,
  getValueAtPosition
}; 