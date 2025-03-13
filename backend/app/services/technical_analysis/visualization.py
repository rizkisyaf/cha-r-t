"""
Chart Visualization Module

This module provides functions for generating textual descriptions of charts
and visualizing financial data for analysis.
"""

import pandas as pd
from typing import List, Dict, Any, Union
import numpy as np
from datetime import datetime

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

def format_timestamp(timestamp: int) -> str:
    """
    Format a Unix timestamp to a readable date string
    
    Args:
        timestamp (int): Unix timestamp in seconds
        
    Returns:
        str: Formatted date string
    """
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M')

def describe_price_action(data: List[Dict[str, Any]]) -> str:
    """
    Generate a textual description of price action
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        str: Textual description of price action
    """
    if not data or len(data) < 2:
        return "Insufficient data to describe price action."
    
    # Convert to DataFrame
    df = convert_to_dataframe(data)
    
    # Calculate basic statistics
    start_price = df['open'].iloc[0]
    end_price = df['close'].iloc[-1]
    high_price = df['high'].max()
    low_price = df['low'].min()
    
    price_change = end_price - start_price
    price_change_pct = (price_change / start_price) * 100
    
    # Determine trend
    if price_change_pct > 5:
        trend = "strongly bullish"
    elif price_change_pct > 1:
        trend = "bullish"
    elif price_change_pct < -5:
        trend = "strongly bearish"
    elif price_change_pct < -1:
        trend = "bearish"
    else:
        trend = "neutral"
    
    # Calculate volatility
    daily_returns = df['close'].pct_change()
    volatility = daily_returns.std() * 100
    
    if volatility > 3:
        volatility_desc = "extremely volatile"
    elif volatility > 2:
        volatility_desc = "highly volatile"
    elif volatility > 1:
        volatility_desc = "moderately volatile"
    else:
        volatility_desc = "relatively stable"
    
    # Calculate volume profile
    avg_volume = df['volume'].mean()
    recent_volume = df['volume'].iloc[-5:].mean()
    volume_change_pct = ((recent_volume / avg_volume) - 1) * 100
    
    if volume_change_pct > 50:
        volume_desc = "significantly higher than average"
    elif volume_change_pct > 20:
        volume_desc = "higher than average"
    elif volume_change_pct < -50:
        volume_desc = "significantly lower than average"
    elif volume_change_pct < -20:
        volume_desc = "lower than average"
    else:
        volume_desc = "around average"
    
    # Generate description
    start_date = format_timestamp(df.index[0])
    end_date = format_timestamp(df.index[-1])
    
    description = f"From {start_date} to {end_date}, the price moved from {start_price:.2f} to {end_price:.2f}, "
    description += f"representing a {abs(price_change_pct):.2f}% {'increase' if price_change >= 0 else 'decrease'}. "
    description += f"The market has been {trend} and {volatility_desc}. "
    description += f"The highest price reached was {high_price:.2f}, while the lowest was {low_price:.2f}. "
    description += f"Recent trading volume has been {volume_desc}."
    
    return description

def describe_indicators(data: List[Dict[str, Any]], indicators: Dict[str, Any]) -> str:
    """
    Generate a textual description of technical indicators
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        indicators (Dict): Dictionary of calculated indicators
        
    Returns:
        str: Textual description of indicators
    """
    if not data or not indicators:
        return "No indicator data available."
    
    description = "Technical Indicators Analysis:\n"
    
    # Process each indicator
    for indicator_name, indicator_data in indicators.items():
        if isinstance(indicator_data, dict) and "error" in indicator_data:
            description += f"- {indicator_name}: Error calculating indicator - {indicator_data['error']}\n"
            continue
            
        if indicator_name.startswith("SMA") or indicator_name.startswith("EMA"):
            description += describe_moving_average(data, indicator_data, indicator_name)
        elif indicator_name.startswith("RSI"):
            description += describe_rsi(indicator_data)
        elif indicator_name.startswith("MACD"):
            description += describe_macd(indicator_data)
        elif indicator_name.startswith("BB") or indicator_name.startswith("BOLLINGER"):
            description += describe_bollinger_bands(data, indicator_data)
        else:
            description += f"- {indicator_name}: Indicator data available but no specific description implemented.\n"
    
    return description

def describe_moving_average(data: List[Dict[str, Any]], ma_data: List[Dict[str, Any]], ma_name: str) -> str:
    """
    Generate a description of a moving average indicator
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        ma_data (List[Dict]): Moving average data
        ma_name (str): Name of the moving average
        
    Returns:
        str: Description of the moving average
    """
    if not ma_data or len(ma_data) < 2:
        return f"- {ma_name}: Insufficient data.\n"
    
    # Get current price and MA value
    current_price = data[-1]['close']
    ma_value = ma_data[-1]['value']
    
    # Calculate the difference
    diff_pct = ((current_price / ma_value) - 1) * 100
    
    # Determine the trend
    if current_price > ma_value:
        position = f"above the {ma_name} ({ma_value:.2f})"
        if diff_pct > 5:
            interpretation = f"indicating a strong bullish trend with significant separation ({diff_pct:.2f}%)."
        else:
            interpretation = f"suggesting a bullish bias ({diff_pct:.2f}% above)."
    else:
        position = f"below the {ma_name} ({ma_value:.2f})"
        if diff_pct < -5:
            interpretation = f"indicating a strong bearish trend with significant separation ({abs(diff_pct):.2f}%)."
        else:
            interpretation = f"suggesting a bearish bias ({abs(diff_pct):.2f}% below)."
    
    # Check for recent crossovers
    crossover = "No recent crossover detected."
    if len(ma_data) > 10 and len(data) > 10:
        for i in range(max(0, len(data) - 10), len(data) - 1):
            if i < len(ma_data) - 1:
                if data[i]['close'] < ma_data[i]['value'] and data[i+1]['close'] > ma_data[i+1]['value']:
                    crossover = f"Bullish crossover detected on {format_timestamp(data[i+1]['time'])}."
                    break
                elif data[i]['close'] > ma_data[i]['value'] and data[i+1]['close'] < ma_data[i+1]['value']:
                    crossover = f"Bearish crossover detected on {format_timestamp(data[i+1]['time'])}."
                    break
    
    return f"- {ma_name}: The current price ({current_price:.2f}) is {position}, {interpretation} {crossover}\n"

def describe_rsi(rsi_data: List[Dict[str, Any]]) -> str:
    """
    Generate a description of the RSI indicator
    
    Args:
        rsi_data (List[Dict]): RSI data
        
    Returns:
        str: Description of the RSI
    """
    if not rsi_data or len(rsi_data) < 2:
        return "- RSI: Insufficient data.\n"
    
    # Get current RSI value
    current_rsi = rsi_data[-1]['value']
    
    # Interpret RSI value
    if current_rsi > 70:
        condition = "overbought"
        interpretation = "suggesting potential price reversal or correction to the downside."
    elif current_rsi < 30:
        condition = "oversold"
        interpretation = "suggesting potential price reversal or bounce to the upside."
    elif current_rsi > 60:
        condition = "bullish territory"
        interpretation = "indicating strength in the current trend."
    elif current_rsi < 40:
        condition = "bearish territory"
        interpretation = "indicating weakness in the current trend."
    else:
        condition = "neutral territory"
        interpretation = "showing no clear directional bias."
    
    # Check for divergence
    divergence = ""
    if len(rsi_data) > 20:
        # Get price data for the same period
        price_highs = []
        rsi_highs = []
        price_lows = []
        rsi_lows = []
        
        for i in range(len(rsi_data) - 20, len(rsi_data)):
            # Check for local maxima and minima
            if i > 0 and i < len(rsi_data) - 1:
                if rsi_data[i]['value'] > rsi_data[i-1]['value'] and rsi_data[i]['value'] > rsi_data[i+1]['value']:
                    rsi_highs.append((i, rsi_data[i]['value']))
                    price_highs.append((i, rsi_data[i]['time']))
                elif rsi_data[i]['value'] < rsi_data[i-1]['value'] and rsi_data[i]['value'] < rsi_data[i+1]['value']:
                    rsi_lows.append((i, rsi_data[i]['value']))
                    price_lows.append((i, rsi_data[i]['time']))
        
        # Check for bearish divergence (price higher, RSI lower)
        if len(price_highs) >= 2 and len(rsi_highs) >= 2:
            if price_highs[-1][1] > price_highs[-2][1] and rsi_highs[-1][1] < rsi_highs[-2][1]:
                divergence = " Bearish divergence detected, which could signal a potential reversal."
        
        # Check for bullish divergence (price lower, RSI higher)
        if len(price_lows) >= 2 and len(rsi_lows) >= 2:
            if price_lows[-1][1] < price_lows[-2][1] and rsi_lows[-1][1] > rsi_lows[-2][1]:
                divergence = " Bullish divergence detected, which could signal a potential reversal."
    
    return f"- RSI: The current RSI value is {current_rsi:.2f}, which is in {condition}, {interpretation}{divergence}\n"

def describe_macd(macd_data: Dict[str, List[Dict[str, Any]]]) -> str:
    """
    Generate a description of the MACD indicator
    
    Args:
        macd_data (Dict): MACD data with 'macd', 'signal', and 'histogram' keys
        
    Returns:
        str: Description of the MACD
    """
    if not macd_data or 'macd' not in macd_data or 'signal' not in macd_data or 'histogram' not in macd_data:
        return "- MACD: Insufficient data.\n"
    
    if not macd_data['macd'] or not macd_data['signal'] or not macd_data['histogram']:
        return "- MACD: Insufficient data.\n"
    
    # Get current values
    current_macd = macd_data['macd'][-1]['value']
    current_signal = macd_data['signal'][-1]['value']
    current_histogram = macd_data['histogram'][-1]['value']
    
    # Determine position
    if current_macd > current_signal:
        position = "above"
        bias = "bullish"
    else:
        position = "below"
        bias = "bearish"
    
    # Check for recent crossover
    crossover = "No recent crossover detected."
    if len(macd_data['macd']) > 5 and len(macd_data['signal']) > 5:
        for i in range(max(0, len(macd_data['macd']) - 5), len(macd_data['macd']) - 1):
            if (macd_data['macd'][i]['value'] < macd_data['signal'][i]['value'] and 
                macd_data['macd'][i+1]['value'] > macd_data['signal'][i+1]['value']):
                crossover = f"Bullish crossover detected recently, suggesting potential upward momentum."
                break
            elif (macd_data['macd'][i]['value'] > macd_data['signal'][i]['value'] and 
                  macd_data['macd'][i+1]['value'] < macd_data['signal'][i+1]['value']):
                crossover = f"Bearish crossover detected recently, suggesting potential downward momentum."
                break
    
    # Check histogram trend
    histogram_trend = ""
    if len(macd_data['histogram']) > 5:
        recent_histograms = [h['value'] for h in macd_data['histogram'][-5:]]
        if all(recent_histograms[i] < recent_histograms[i+1] for i in range(len(recent_histograms)-1)):
            histogram_trend = " The histogram is showing increasing positive momentum."
        elif all(recent_histograms[i] > recent_histograms[i+1] for i in range(len(recent_histograms)-1)):
            histogram_trend = " The histogram is showing increasing negative momentum."
    
    return (f"- MACD: The MACD line ({current_macd:.4f}) is {position} the signal line ({current_signal:.4f}), "
            f"indicating a {bias} bias. {crossover}{histogram_trend}\n")

def describe_bollinger_bands(data: List[Dict[str, Any]], bb_data: Dict[str, List[Dict[str, Any]]]) -> str:
    """
    Generate a description of Bollinger Bands
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        bb_data (Dict): Bollinger Bands data with 'upper', 'middle', and 'lower' keys
        
    Returns:
        str: Description of the Bollinger Bands
    """
    if not bb_data or 'upper' not in bb_data or 'middle' not in bb_data or 'lower' not in bb_data:
        return "- Bollinger Bands: Insufficient data.\n"
    
    if not bb_data['upper'] or not bb_data['middle'] or not bb_data['lower']:
        return "- Bollinger Bands: Insufficient data.\n"
    
    # Get current values
    current_price = data[-1]['close']
    upper_band = bb_data['upper'][-1]['value']
    middle_band = bb_data['middle'][-1]['value']
    lower_band = bb_data['lower'][-1]['value']
    
    # Calculate bandwidth
    bandwidth = ((upper_band - lower_band) / middle_band) * 100
    
    # Determine position
    if current_price > upper_band:
        position = "above the upper band"
        interpretation = "suggesting an overbought condition or a strong uptrend."
    elif current_price < lower_band:
        position = "below the lower band"
        interpretation = "suggesting an oversold condition or a strong downtrend."
    elif current_price > middle_band:
        position = "between the middle and upper band"
        interpretation = "suggesting a bullish bias within the normal range."
    else:
        position = "between the middle and lower band"
        interpretation = "suggesting a bearish bias within the normal range."
    
    # Interpret bandwidth
    if bandwidth > 40:
        volatility = "high"
        volatility_interpretation = "indicating significant market volatility."
    elif bandwidth > 20:
        volatility = "moderate"
        volatility_interpretation = "indicating normal market volatility."
    else:
        volatility = "low"
        volatility_interpretation = "suggesting a potential volatility expansion soon."
    
    # Check for band touches
    band_touches = ""
    if len(data) > 20 and len(bb_data['upper']) > 20 and len(bb_data['lower']) > 20:
        upper_touches = 0
        lower_touches = 0
        
        for i in range(max(0, len(data) - 20), len(data)):
            if i < len(bb_data['upper']) and i < len(bb_data['lower']):
                if data[i]['high'] >= bb_data['upper'][i]['value']:
                    upper_touches += 1
                if data[i]['low'] <= bb_data['lower'][i]['value']:
                    lower_touches += 1
        
        if upper_touches > 0 and lower_touches > 0:
            band_touches = f" Price has touched the upper band {upper_touches} times and the lower band {lower_touches} times in the last 20 periods."
        elif upper_touches > 0:
            band_touches = f" Price has touched the upper band {upper_touches} times in the last 20 periods."
        elif lower_touches > 0:
            band_touches = f" Price has touched the lower band {lower_touches} times in the last 20 periods."
    
    return (f"- Bollinger Bands: The current price ({current_price:.2f}) is {position}, {interpretation} "
            f"The bandwidth is {bandwidth:.2f}%, indicating {volatility} volatility, {volatility_interpretation}{band_touches}\n")

def plot_chart_text(data: List[Dict[str, Any]], indicators: Dict[str, Any] = None, patterns: List[Dict[str, Any]] = None) -> str:
    """
    Generate a textual representation of a chart with price action, indicators, and patterns
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        indicators (Dict): Dictionary of calculated indicators
        patterns (List[Dict]): List of identified patterns
        
    Returns:
        str: Textual representation of the chart
    """
    chart_description = "Chart Analysis:\n\n"
    
    # Describe price action
    chart_description += "Price Action:\n"
    chart_description += describe_price_action(data) + "\n\n"
    
    # Describe indicators if available
    if indicators:
        chart_description += "Technical Indicators:\n"
        chart_description += describe_indicators(data, indicators) + "\n"
    
    # Describe patterns if available
    if patterns:
        chart_description += "Chart Patterns:\n"
        for pattern in patterns:
            if pattern['found']:
                chart_description += f"- {pattern['pattern'].replace('_', ' ').title()}: {pattern['message']}\n"
                chart_description += f"  Pattern spans from {format_timestamp(pattern['start_time'])} to {format_timestamp(pattern['end_time'])}\n"
    
    # Add summary and potential outlook
    chart_description += "\nSummary and Outlook:\n"
    
    # Determine overall trend
    if len(data) > 1:
        start_price = data[0]['close']
        end_price = data[-1]['close']
        price_change_pct = ((end_price / start_price) - 1) * 100
        
        if price_change_pct > 10:
            trend = "strongly bullish"
        elif price_change_pct > 2:
            trend = "bullish"
        elif price_change_pct < -10:
            trend = "strongly bearish"
        elif price_change_pct < -2:
            trend = "bearish"
        else:
            trend = "neutral"
        
        chart_description += f"The overall trend is {trend} with a {abs(price_change_pct):.2f}% {'increase' if price_change_pct >= 0 else 'decrease'} "
        chart_description += f"over the analyzed period. "
    
    # Add indicator-based outlook if available
    if indicators:
        bullish_signals = 0
        bearish_signals = 0
        
        # Check moving averages
        for indicator_name, indicator_data in indicators.items():
            if (indicator_name.startswith("SMA") or indicator_name.startswith("EMA")) and len(indicator_data) > 0:
                if data[-1]['close'] > indicator_data[-1]['value']:
                    bullish_signals += 1
                else:
                    bearish_signals += 1
        
        # Check RSI
        for indicator_name, indicator_data in indicators.items():
            if indicator_name.startswith("RSI") and len(indicator_data) > 0:
                rsi_value = indicator_data[-1]['value']
                if rsi_value > 60:
                    bullish_signals += 1
                elif rsi_value < 40:
                    bearish_signals += 1
        
        # Check MACD
        for indicator_name, indicator_data in indicators.items():
            if indicator_name.startswith("MACD") and 'macd' in indicator_data and 'signal' in indicator_data:
                if indicator_data['macd'][-1]['value'] > indicator_data['signal'][-1]['value']:
                    bullish_signals += 1
                else:
                    bearish_signals += 1
        
        # Determine overall indicator bias
        if bullish_signals > bearish_signals:
            chart_description += "Technical indicators are predominantly bullish, suggesting potential upward momentum. "
        elif bearish_signals > bullish_signals:
            chart_description += "Technical indicators are predominantly bearish, suggesting potential downward pressure. "
        else:
            chart_description += "Technical indicators are mixed, suggesting a consolidation phase or indecision in the market. "
    
    # Add pattern-based outlook if available
    if patterns and any(p['found'] for p in patterns):
        bullish_patterns = [p for p in patterns if p['found'] and p['pattern'] in ['double_bottom', 'ascending_triangle']]
        bearish_patterns = [p for p in patterns if p['found'] and p['pattern'] in ['double_top', 'head_and_shoulders', 'descending_triangle']]
        
        if bullish_patterns and not bearish_patterns:
            chart_description += "The identified chart patterns suggest a potential bullish reversal or continuation. "
        elif bearish_patterns and not bullish_patterns:
            chart_description += "The identified chart patterns suggest a potential bearish reversal or continuation. "
        elif bullish_patterns and bearish_patterns:
            chart_description += "There are conflicting chart patterns, suggesting uncertainty in the market direction. "
    
    # Add final note
    chart_description += "\nNote: This analysis is based on historical data and technical indicators. "
    chart_description += "Always consider fundamental factors and risk management in your trading decisions."
    
    return chart_description 