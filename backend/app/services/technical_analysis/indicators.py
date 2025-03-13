"""
Technical Indicators Module

This module provides functions for calculating various technical indicators
used in financial analysis and trading strategies.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union, Tuple

def convert_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert a list of OHLCV dictionaries to a pandas DataFrame
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries with keys 'time', 'open', 'high', 'low', 'close', 'volume'
        
    Returns:
        pd.DataFrame: DataFrame with OHLCV data
    """
    df = pd.DataFrame(data)
    df.set_index('time', inplace=True)
    return df

def calculate_sma(data: List[Dict[str, Any]], period: int) -> List[Dict[str, Any]]:
    """
    Calculate Simple Moving Average (SMA)
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        period (int): Period for SMA calculation
        
    Returns:
        List[Dict]: List of dictionaries with 'time' and 'value' keys
    """
    df = convert_to_dataframe(data)
    df['sma'] = df['close'].rolling(window=period).mean()
    
    result = []
    for time, row in df.iterrows():
        if not np.isnan(row['sma']):
            result.append({
                'time': time,
                'value': row['sma']
            })
    
    return result

def calculate_ema(data: List[Dict[str, Any]], period: int) -> List[Dict[str, Any]]:
    """
    Calculate Exponential Moving Average (EMA)
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        period (int): Period for EMA calculation
        
    Returns:
        List[Dict]: List of dictionaries with 'time' and 'value' keys
    """
    df = convert_to_dataframe(data)
    df['ema'] = df['close'].ewm(span=period, adjust=False).mean()
    
    result = []
    for time, row in df.iterrows():
        if not np.isnan(row['ema']):
            result.append({
                'time': time,
                'value': row['ema']
            })
    
    return result

def calculate_rsi(data: List[Dict[str, Any]], period: int = 14) -> List[Dict[str, Any]]:
    """
    Calculate Relative Strength Index (RSI)
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        period (int): Period for RSI calculation, default is 14
        
    Returns:
        List[Dict]: List of dictionaries with 'time' and 'value' keys
    """
    df = convert_to_dataframe(data)
    
    # Calculate price changes
    delta = df['close'].diff()
    
    # Separate gains and losses
    gain = delta.copy()
    loss = delta.copy()
    gain[gain < 0] = 0
    loss[loss > 0] = 0
    loss = abs(loss)
    
    # Calculate average gain and loss
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    # Calculate RS and RSI
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    result = []
    for time, row in df.iterrows():
        if not np.isnan(row['rsi']):
            result.append({
                'time': time,
                'value': row['rsi']
            })
    
    return result

def calculate_macd(data: List[Dict[str, Any]], fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Dict[str, List[Dict[str, Any]]]:
    """
    Calculate Moving Average Convergence Divergence (MACD)
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        fast_period (int): Period for fast EMA, default is 12
        slow_period (int): Period for slow EMA, default is 26
        signal_period (int): Period for signal line, default is 9
        
    Returns:
        Dict: Dictionary with 'macd', 'signal', and 'histogram' keys, each containing a list of dictionaries with 'time' and 'value' keys
    """
    df = convert_to_dataframe(data)
    
    # Calculate fast and slow EMAs
    df['ema_fast'] = df['close'].ewm(span=fast_period, adjust=False).mean()
    df['ema_slow'] = df['close'].ewm(span=slow_period, adjust=False).mean()
    
    # Calculate MACD line
    df['macd'] = df['ema_fast'] - df['ema_slow']
    
    # Calculate signal line
    df['signal'] = df['macd'].ewm(span=signal_period, adjust=False).mean()
    
    # Calculate histogram
    df['histogram'] = df['macd'] - df['signal']
    
    # Prepare results
    macd_result = []
    signal_result = []
    histogram_result = []
    
    for time, row in df.iterrows():
        if not np.isnan(row['macd']) and not np.isnan(row['signal']) and not np.isnan(row['histogram']):
            macd_result.append({
                'time': time,
                'value': row['macd']
            })
            signal_result.append({
                'time': time,
                'value': row['signal']
            })
            histogram_result.append({
                'time': time,
                'value': row['histogram']
            })
    
    return {
        'macd': macd_result,
        'signal': signal_result,
        'histogram': histogram_result
    }

def calculate_bollinger_bands(data: List[Dict[str, Any]], period: int = 20, std_dev: float = 2.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Calculate Bollinger Bands
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        period (int): Period for moving average, default is 20
        std_dev (float): Number of standard deviations, default is 2.0
        
    Returns:
        Dict: Dictionary with 'upper', 'middle', and 'lower' keys, each containing a list of dictionaries with 'time' and 'value' keys
    """
    df = convert_to_dataframe(data)
    
    # Calculate middle band (SMA)
    df['middle'] = df['close'].rolling(window=period).mean()
    
    # Calculate standard deviation
    df['std'] = df['close'].rolling(window=period).std()
    
    # Calculate upper and lower bands
    df['upper'] = df['middle'] + (df['std'] * std_dev)
    df['lower'] = df['middle'] - (df['std'] * std_dev)
    
    # Prepare results
    upper_result = []
    middle_result = []
    lower_result = []
    
    for time, row in df.iterrows():
        if not np.isnan(row['middle']) and not np.isnan(row['upper']) and not np.isnan(row['lower']):
            upper_result.append({
                'time': time,
                'value': row['upper']
            })
            middle_result.append({
                'time': time,
                'value': row['middle']
            })
            lower_result.append({
                'time': time,
                'value': row['lower']
            })
    
    return {
        'upper': upper_result,
        'middle': middle_result,
        'lower': lower_result
    }

def calculate_indicator(data: List[Dict[str, Any]], indicator_type: str, params: Dict[str, Any] = None) -> Union[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]]]:
    """
    Calculate a technical indicator based on its type and parameters
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        indicator_type (str): Type of indicator (e.g., 'SMA', 'EMA', 'RSI', 'MACD', 'BB')
        params (Dict): Parameters for the indicator calculation
        
    Returns:
        Union[List[Dict], Dict]: Indicator data
    """
    params = params or {}
    
    # Parse indicator type and parameters
    if '_' in indicator_type:
        parts = indicator_type.split('_')
        base_type = parts[0].upper()
        if len(parts) > 1 and parts[1].isdigit():
            period = int(parts[1])
            params['period'] = period
    else:
        base_type = indicator_type.upper()
    
    # Calculate the indicator
    if base_type == 'SMA':
        period = params.get('period', 20)
        return calculate_sma(data, period)
    elif base_type == 'EMA':
        period = params.get('period', 20)
        return calculate_ema(data, period)
    elif base_type == 'RSI':
        period = params.get('period', 14)
        return calculate_rsi(data, period)
    elif base_type == 'MACD':
        fast_period = params.get('fast_period', 12)
        slow_period = params.get('slow_period', 26)
        signal_period = params.get('signal_period', 9)
        return calculate_macd(data, fast_period, slow_period, signal_period)
    elif base_type in ['BB', 'BOLLINGER']:
        period = params.get('period', 20)
        std_dev = params.get('std_dev', 2.0)
        return calculate_bollinger_bands(data, period, std_dev)
    else:
        raise ValueError(f"Unsupported indicator type: {indicator_type}")

def calculate_multiple_indicators(data: List[Dict[str, Any]], indicators: List[str]) -> Dict[str, Union[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]]]]:
    """
    Calculate multiple technical indicators
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        indicators (List[str]): List of indicator specifications (e.g., ['SMA_20', 'RSI_14'])
        
    Returns:
        Dict: Dictionary with indicator names as keys and indicator data as values
    """
    result = {}
    
    for indicator_spec in indicators:
        try:
            # Parse indicator specification
            params = {}
            if '_' in indicator_spec:
                parts = indicator_spec.split('_')
                indicator_type = parts[0].upper()
                if len(parts) > 1 and parts[1].isdigit():
                    period = int(parts[1])
                    params['period'] = period
            else:
                indicator_type = indicator_spec.upper()
            
            # Calculate the indicator
            indicator_data = calculate_indicator(data, indicator_type, params)
            
            # Add to result
            result[indicator_spec] = indicator_data
        except Exception as e:
            print(f"Error calculating indicator {indicator_spec}: {str(e)}")
            result[indicator_spec] = {"error": str(e)}
    
    return result 