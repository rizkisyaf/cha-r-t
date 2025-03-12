import SMA from './SMA';
import EMA from './EMA';
import RSI from './RSI';
import BB from './BB';
import * as MACDModule from './MACD';

// Create a MACD object from the named exports
const MACD = {
  metadata: MACDModule.metadata,
  calculate: MACDModule.calculate,
  Settings: MACDModule.SettingsComponent,
  formatLabel: MACDModule.formatLabel,
  getSeriesOptions: MACDModule.getSeriesOptions,
  getValueAtPosition: MACDModule.getValueAtPosition
};

// Map of all available indicators
const INDICATORS = {
  SMA,
  EMA,
  RSI,
  BB,
  MACD
};

// Get all indicators metadata for the indicator selector
export const getIndicatorsMetadata = () => {
  return Object.values(INDICATORS).map(indicator => indicator.metadata);
};

// Get a specific indicator by type
export const getIndicator = (type) => {
  return INDICATORS[type] || null;
};

export default INDICATORS; 