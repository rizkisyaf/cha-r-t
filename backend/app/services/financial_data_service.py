import os
import requests
import json
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
import time
import traceback

# Load environment variables
load_dotenv()

# Cache for financial data to reduce API calls
data_cache = {}
cache_expiry = {}
CACHE_DURATION = 60 * 5  # 5 minutes in seconds

def get_financial_data(symbol, timeframe, limit=100):
    """
    Get financial data for a specific symbol and timeframe
    
    Args:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): The number of data points to return
        
    Returns:
        list: A list of dictionaries containing OHLCV data
        
    Raises:
        Exception: If no data is available for the specified symbol and timeframe
    """
    try:
        print(f"Fetching financial data for {symbol} on {timeframe} timeframe")
        
        # Check cache first
        cache_key = f"{symbol}_{timeframe}_{limit}"
        if cache_key in data_cache and time.time() - cache_expiry[cache_key] < CACHE_DURATION:
            print(f"Using cached data for {symbol} on {timeframe} timeframe")
            return data_cache[cache_key]
        
        # Map timeframe to Binance interval
        interval_map = {
            '1m': '1m',
            '1min': '1m',
            '5m': '5m',
            '5min': '5m',
            '15m': '15m',
            '15min': '15m',
            '30m': '30m',
            '30min': '30m',
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
            '1D': '1d',
            'D': '1d'
        }
        
        interval = interval_map.get(timeframe, '1d')
        
        # Build the Binance API URL
        url = "https://api.binance.com/api/v3/klines"
        
        # Prepare parameters
        params = {
            'symbol': symbol.upper(),
            'interval': interval,
            'limit': limit
        }
        
        print(f"Fetching data from Binance API: {url} with params: {params}")
        
        # Make the request to Binance API
        response = requests.get(url, params=params, timeout=10)
        
        # Check if the response is successful
        if response.status_code != 200:
            print(f"Binance API returned status code {response.status_code}: {response.text}")
            raise Exception(f"Binance API error: {response.text}")
        
        # Get the data from the response
        binance_data = response.json()
        
        # Format the data for our chart
        formatted_data = []
        
        # Binance returns data in the following format:
        # [
        #   [
        #     1499040000000,      // Open time
        #     "0.01634790",       // Open
        #     "0.80000000",       // High
        #     "0.01575800",       // Low
        #     "0.01577100",       // Close
        #     "148976.11427815",  // Volume
        #     1499644799999,      // Close time
        #     "2434.19055334",    // Quote asset volume
        #     308,                // Number of trades
        #     "1756.87402397",    // Taker buy base asset volume
        #     "28.46694368",      // Taker buy quote asset volume
        #     "17928899.62484339" // Ignore
        #   ]
        # ]
        
        for candle in binance_data:
            # Convert timestamp from milliseconds to seconds
            timestamp = int(candle[0] / 1000)
            
            formatted_data.append({
                'time': timestamp,
                'open': float(candle[1]),
                'high': float(candle[2]),
                'low': float(candle[3]),
                'close': float(candle[4]),
                'volume': float(candle[5])
            })
        
        print(f"Successfully fetched {len(formatted_data)} candles from Binance API")
        
        # Update cache
        data_cache[cache_key] = formatted_data
        cache_expiry[cache_key] = time.time()
        
        return formatted_data
    except Exception as e:
        print(f"Error fetching financial data: {str(e)}")
        traceback.print_exc()
        raise Exception(f"Failed to fetch financial data: {str(e)}")

def convert_timeframe_to_seconds(timeframe):
    """
    Convert a timeframe string to seconds
    
    Args:
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        
    Returns:
        int: The timeframe in seconds
    """
    timeframe = timeframe.lower()
    
    # Extract the number and unit
    match = re.match(r'(\d+)([a-z]+)', timeframe)
    if match:
        value, unit = match.groups()
        value = int(value)
    else:
        # Default to 1 day if format is not recognized
        value = 1
        unit = 'd'
    
    # Convert to seconds
    if unit in ['m', 'min', 'minute', 'minutes']:
        return value * 60
    elif unit in ['h', 'hour', 'hours']:
        return value * 3600
    elif unit in ['d', 'day', 'days']:
        return value * 86400
    else:
        # Default to 1 day
        return 86400 