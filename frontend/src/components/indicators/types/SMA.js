import React from 'react';
import { FormGroup, Label, Input, Select, CheckboxContainer, Checkbox, ColorInput } from '../SettingsComponents';
import styled from 'styled-components';

// Indicator metadata
export const metadata = {
  type: 'SMA',
  name: 'Simple Moving Average',
  description: 'Calculates the average price over a specified period',
  category: 'technicals',
  author: 'TradingView',
  defaultSettings: { 
    // Inputs
    period: 20,
    source: 'close',
    offset: 0,
    smoothingType: 'None',
    smoothingPeriod: 14,
    bbStdDev: 2,
    waitForTimeframeClose: true,
    
    // Style
    color: '#2962FF',
    lineWidth: 2,
    showMA: true,
    precision: 'Default',
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
    
    // Visibility
    isVisible: true,
    showTicks: true,
    showSeconds: true,
    secondsMin: 1,
    secondsMax: 59,
    showMinutes: true,
    minutesMin: 1,
    minutesMax: 59,
    showHours: true,
    hoursMin: 1,
    hoursMax: 24,
    showDays: true,
    daysMin: 1,
    daysMax: 366,
    showWeeks: true,
    weeksMin: 1,
    weeksMax: 52,
    showMonths: true,
    monthsMin: 1,
    monthsMax: 12,
    showRanges: true
  }
};

// Calculation function
export const calculate = (data, settings) => {
  const { period, source = 'close', offset = 0 } = settings;
  const smaData = [];
  
  // Ensure we have data to work with
  if (!data || data.length === 0) {
    console.warn('SMA calculation received empty data');
    return [];
  }
  
  // Log the first data point to understand its structure
  console.log('SMA calculation first data point:', data[0]);
  
  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        // Make sure we handle different data formats
        const value = data[i - j][source] !== undefined ? data[i - j][source] : 
                     (data[i - j].close !== undefined ? data[i - j].close : null);
        
        if (value === null) {
          console.warn(`SMA calculation: Missing ${source} value at index ${i-j}`);
          continue;
        }
        
        sum += value;
      }
      
      // Apply offset if needed
      const offsetIndex = i + offset;
      if (offsetIndex >= 0 && offsetIndex < data.length) {
        const smaValue = sum / period;
        console.log(`SMA value at time ${data[offsetIndex].time}: ${smaValue}`);
        
        smaData.push({
          time: data[offsetIndex].time,
          value: smaValue,
        });
      }
    }
  }
  
  console.log(`SMA calculation complete: ${smaData.length} points calculated`);
  return smaData;
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
      
      <SectionTitle>SMOOTHING</SectionTitle>
      
      <FormGroup>
        <Label>Type</Label>
        <Select 
          name="smoothingType" 
          value={settings.smoothingType || metadata.defaultSettings.smoothingType} 
          onChange={onChange}
        >
          <option value="None">None</option>
          <option value="SMA">SMA</option>
          <option value="EMA">EMA</option>
          <option value="WMA">WMA</option>
          <option value="RMA">RMA</option>
        </Select>
      </FormGroup>
      
      <FormGroup>
        <Label>Length</Label>
        <Input 
          type="number" 
          name="smoothingPeriod" 
          value={settings.smoothingPeriod || metadata.defaultSettings.smoothingPeriod} 
          onChange={onChange}
          min="1"
        />
      </FormGroup>
      
      <FormGroup>
        <Label>BB StdDev</Label>
        <Input 
          type="number" 
          name="bbStdDev" 
          value={settings.bbStdDev || metadata.defaultSettings.bbStdDev} 
          onChange={onChange}
          min="0.1"
          step="0.1"
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
        <CheckboxContainer>
          <Checkbox 
            name="showMA" 
            checked={settings.showMA !== false} 
            onChange={onChange}
          />
          <Label>MA</Label>
        </CheckboxContainer>
      </FormGroup>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ width: '40px', height: '40px' }}>
          <ColorInput style={{ width: '100%', height: '100%' }}>
            <input 
              type="color" 
              name="color" 
              value={settings.color || metadata.defaultSettings.color} 
              onChange={onChange}
              style={{ width: '100%', height: '100%' }}
            />
          </ColorInput>
        </div>
        
        <div style={{ flex: 1, height: '4px', background: 'linear-gradient(to right, #2962FF, #2962FF)', borderRadius: '2px' }}></div>
        
        <div style={{ width: '40px', height: '40px', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12C3 12 7 4 12 4C17 4 21 12 21 12C21 12 17 20 12 20C7 20 3 12 3 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      </div>
      
      <SectionTitle>OUTPUTS</SectionTitle>
      
      <FormGroup>
        <Label>Precision</Label>
        <Select 
          name="precision" 
          value={settings.precision || "Default"} 
          onChange={onChange}
        >
          <option value="Default">Default</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </Select>
      </FormGroup>
      
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="labelsOnPriceScale" 
            checked={settings.labelsOnPriceScale !== false} 
            onChange={onChange}
          />
          <Label>Labels on price scale</Label>
        </CheckboxContainer>
      </FormGroup>
      
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="valuesInStatusLine" 
            checked={settings.valuesInStatusLine !== false} 
            onChange={onChange}
          />
          <Label>Values in status line</Label>
        </CheckboxContainer>
      </FormGroup>
    </>
  );
};

// Visibility Settings component
export const VisibilitySettings = ({ settings, onChange }) => {
  return (
    <>
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="showTicks" 
            checked={settings.showTicks !== false} 
            onChange={onChange}
          />
          <Label>Ticks</Label>
        </CheckboxContainer>
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showSeconds" 
            checked={settings.showSeconds !== false} 
            onChange={onChange}
          />
          <Label>Seconds</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="secondsMin" 
          value={settings.secondsMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="secondsMax" 
          value={settings.secondsMax || 59} 
          onChange={onChange}
          min="1"
          max="59"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showMinutes" 
            checked={settings.showMinutes !== false} 
            onChange={onChange}
          />
          <Label>Minutes</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="minutesMin" 
          value={settings.minutesMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="minutesMax" 
          value={settings.minutesMax || 59} 
          onChange={onChange}
          min="1"
          max="59"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showHours" 
            checked={settings.showHours !== false} 
            onChange={onChange}
          />
          <Label>Hours</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="hoursMin" 
          value={settings.hoursMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="hoursMax" 
          value={settings.hoursMax || 24} 
          onChange={onChange}
          min="1"
          max="24"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showDays" 
            checked={settings.showDays !== false} 
            onChange={onChange}
          />
          <Label>Days</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="daysMin" 
          value={settings.daysMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="daysMax" 
          value={settings.daysMax || 366} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showWeeks" 
            checked={settings.showWeeks !== false} 
            onChange={onChange}
          />
          <Label>Weeks</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="weeksMin" 
          value={settings.weeksMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="weeksMax" 
          value={settings.weeksMax || 52} 
          onChange={onChange}
          min="1"
          max="52"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckboxContainer style={{ width: '100px' }}>
          <Checkbox 
            name="showMonths" 
            checked={settings.showMonths !== false} 
            onChange={onChange}
          />
          <Label>Months</Label>
        </CheckboxContainer>
        
        <Input 
          type="number" 
          name="monthsMin" 
          value={settings.monthsMin || 1} 
          onChange={onChange}
          min="1"
          style={{ width: '100px' }}
        />
        
        <div style={{ 
          flex: 1, 
          height: '4px', 
          background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.2))', 
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            right: '0', 
            top: '-8px', 
            width: '16px', 
            height: '16px', 
            background: 'white', 
            borderRadius: '50%' 
          }}></div>
        </div>
        
        <Input 
          type="number" 
          name="monthsMax" 
          value={settings.monthsMax || 12} 
          onChange={onChange}
          min="1"
          max="12"
          style={{ width: '100px' }}
        />
      </FormGroup>
      
      <FormGroup>
        <CheckboxContainer>
          <Checkbox 
            name="showRanges" 
            checked={settings.showRanges !== false} 
            onChange={onChange}
          />
          <Label>Ranges</Label>
        </CheckboxContainer>
      </FormGroup>
    </>
  );
};

// For backward compatibility
export const Settings = InputsSettings;

// Display name formatter
export const formatLabel = (settings) => {
  return `SMA(${settings.period})`;
};

// Series configuration for the chart
export const getSeriesOptions = (settings) => {
  return {
    color: settings.color || metadata.defaultSettings.color,
    lineWidth: settings.lineWidth || metadata.defaultSettings.lineWidth,
    priceLineVisible: false
  };
};

// Function to get the value at a specific position (for crosshair)
const getValueAtPosition = (crosshairData, indicator) => {
  console.log('SMA getValueAtPosition called with:', { 
    crosshairTime: crosshairData?.time,
    indicatorType: indicator?.type,
    availableValues: crosshairData?.indicatorValues
  });
  
  if (!crosshairData || !crosshairData.indicatorValues) {
    console.log('SMA: No crosshairData or indicatorValues available');
    return null;
  }
  
  const value = crosshairData.indicatorValues[indicator.type];
  console.log(`SMA: Retrieved value ${value} for ${indicator.type}`);
  return value;
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