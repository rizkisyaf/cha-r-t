import os
import requests
import json
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
import random
import yfinance as yf
import pandas as pd
import numpy as np
import time
import traceback

# Load environment variables
load_dotenv()

# Alpha Vantage API key
ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
BASE_URL = 'https://www.alphavantage.co/query'

# Data file paths
JSON_DATA_FILES = {
    'daily': os.path.join(os.path.dirname(__file__), 'btcusdt_1year.json'),
    '1min_7days': os.path.join(os.path.dirname(__file__), 'btcusdt_1min_7days.json'),
    '1min_30days': os.path.join(os.path.dirname(__file__), 'btcusdt_1min_30days.json'),
    '1min_90days': os.path.join(os.path.dirname(__file__), 'btcusdt_1min_90days.json'),
    '1min_180days': os.path.join(os.path.dirname(__file__), 'btcusdt_1min_180days.json')
}

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
    """
    try:
        print(f"Fetching financial data for {symbol} on {timeframe} timeframe")
        
        # For BTCUSDT, try to use our JSON data files first
        if symbol.upper() == "BTCUSDT":
            json_data = get_json_data(timeframe, limit)
            if not json_data.get("error"):
                return json_data
        
        # For other symbols or if JSON data fails, use yfinance or generate mock data
        # Map timeframe to yfinance interval
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
        
        # Determine the period based on the interval and limit
        if interval == '1m':
            period = '1d'  # yfinance only provides 1m data for the last 7 days
        elif interval == '5m' or interval == '15m' or interval == '30m':
            period = '7d'
        elif interval == '1h':
            period = '30d'
        elif interval == '4h':
            period = '60d'
        else:
            period = '1y'
        
        # For stocks, add the exchange if not present
        if symbol.upper() in ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA'] and '.' not in symbol:
            symbol = f"{symbol}.US"
        
        # Get data from yfinance
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
        
        # If no data, try to generate mock data
        if df.empty:
            print(f"No data available for {symbol} on {timeframe} timeframe, generating mock data")
            return generate_mock_data(symbol, timeframe, limit)
        
        # Convert to list of dictionaries
        data = []
        for index, row in df.iterrows():
            timestamp = int(index.timestamp())
            data.append({
                'time': timestamp,
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': float(row['Volume'])
            })
        
        # Limit the number of data points
        if limit and limit > 0:
            data = data[-limit:]
        
        return data
    except Exception as e:
        print(f"Error fetching financial data: {str(e)}")
        traceback.print_exc()
        # Return mock data as a fallback
        return generate_mock_data(symbol, timeframe, limit)

def get_json_data(timeframe, limit=100):
    """
    Get financial data from the appropriate JSON file based on timeframe
    
    Args:
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): The number of data points to return
        
    Returns:
        dict: Financial data in a format suitable for charting
    """
    try:
        # Select the appropriate file based on timeframe
        file_key = select_json_file_for_timeframe(timeframe)
        json_file = JSON_DATA_FILES[file_key]
        
        # Check if JSON file exists
        if not os.path.exists(json_file):
            print(f"JSON file not found: {json_file}")
            return {"error": "JSON data not available"}
        
        # Read JSON file
        print(f"Reading JSON data from {json_file}")
        with open(json_file, 'r') as file:
            raw_data = json.load(file)
        
        print(f"Loaded {len(raw_data)} data points from JSON")
        
        # Convert millisecond timestamps to seconds if needed
        for candle in raw_data:
            # Check if timestamp is in milliseconds (13 digits)
            if len(str(int(candle['time']))) > 10:
                candle['time'] = int(candle['time'] / 1000)
        
        # Sort by time
        raw_data.sort(key=lambda x: x['time'])
        
        # Process data based on timeframe
        if file_key == 'daily' or timeframe.lower() in ['1d', 'd', 'daily', '1day']:
            # Daily data doesn't need resampling
            candles = raw_data
        else:
            # For minute data, we need to filter based on the requested timeframe
            candles = filter_minute_data(raw_data, timeframe)
        
        # Limit the number of data points
        if limit and limit > 0:
            candles = candles[-limit:]
        
        print(f"Processed {len(candles)} candles from JSON data for {timeframe} timeframe")
        
        return {
            'symbol': 'BTCUSDT',
            'timeframe': timeframe,
            'candles': candles
        }
    except Exception as e:
        print(f"Error reading JSON data: {str(e)}")
        traceback.print_exc()
        return {"error": f"Failed to process JSON data: {str(e)}"}

def select_json_file_for_timeframe(timeframe):
    """
    Select the appropriate JSON file based on the requested timeframe
    
    Args:
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        
    Returns:
        str: Key for the JSON_DATA_FILES dictionary
    """
    timeframe = timeframe.lower()
    
    if timeframe in ['1d', 'd', 'daily', '1day']:
        return 'daily'
    
    # For all other timeframes, use minute data with appropriate history length
    seconds = convert_timeframe_to_seconds(timeframe)
    
    # Calculate how many days of data we need based on the timeframe and a reasonable number of candles
    # For example, for 4h timeframe, we want at least 90 days of data to have enough candles
    if seconds >= 14400:  # 4h or higher
        return '1min_180days'
    elif seconds >= 3600:  # 1h
        return '1min_90days'
    elif seconds >= 900:  # 15m or higher
        return '1min_30days'
    else:  # 1m, 5m
        return '1min_7days'

def filter_minute_data(data, timeframe):
    """
    Filter minute data to match the requested timeframe
    
    Args:
        data (list): List of 1-minute OHLCV dictionaries
        timeframe (str): Target timeframe (e.g., '5m', '15m', '1h', '4h')
        
    Returns:
        list: Filtered OHLCV data
    """
    # Convert timeframe to seconds
    seconds = convert_timeframe_to_seconds(timeframe)
    minute_seconds = 60
    
    # If timeframe is 1m, return the data as is
    if seconds == minute_seconds:
        return data
    
    print(f"Filtering 1-minute data to {timeframe} timeframe ({seconds} seconds)")
    
    # Group data by time intervals
    candle_groups = {}
    for candle in data:
        # Calculate candle timestamp (floor to interval)
        candle_timestamp = int(candle['time'] // seconds * seconds)
        
        if candle_timestamp not in candle_groups:
            candle_groups[candle_timestamp] = {
                'open': candle['open'],
                'high': candle['high'],
                'low': candle['low'],
                'close': candle['close'],
                'volume': candle['volume'],
                'candles': [candle]
            }
        else:
            group = candle_groups[candle_timestamp]
            group['high'] = max(group['high'], candle['high'])
            group['low'] = min(group['low'], candle['low'])
            group['close'] = candle['close']
            group['volume'] += candle['volume']
            group['candles'].append(candle)
    
    # Convert groups to OHLCV candles
    filtered = []
    for timestamp, group in candle_groups.items():
        filtered.append({
            'time': timestamp,
            'open': group['open'],
            'high': group['high'],
            'low': group['low'],
            'close': group['close'],
            'volume': group['volume']
        })
    
    # Sort by time
    filtered.sort(key=lambda x: x['time'])
    
    print(f"Filtered {len(data)} 1-minute candles to {len(filtered)} {timeframe} candles")
    
    return filtered

def convert_timeframe_to_seconds(timeframe):
    """
    Convert timeframe to seconds
    
    Args:
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h')
        
    Returns:
        int: Number of seconds in the timeframe
    """
    # Normalize timeframe format
    timeframe = timeframe.lower()
    
    # Extract number and unit
    match = re.match(r'(\d+)([mhdw])', timeframe)
    if not match:
        # Default to 1 day if format is not recognized
        return 86400
    
    number, unit = match.groups()
    number = int(number)
    
    # Convert to seconds
    if unit == 'm':
        return number * 60  # minutes
    elif unit == 'h':
        return number * 3600  # hours
    elif unit == 'd':
        return number * 86400  # days
    elif unit == 'w':
        return number * 604800  # weeks
    else:
        return 86400  # default to 1 day

def generate_mock_data(symbol, timeframe, limit=100):
    """
    Generate mock financial data
    
    Args:
        symbol (str): The trading symbol
        timeframe (str): The timeframe
        limit (int): The number of data points to generate
        
    Returns:
        list: A list of dictionaries containing OHLCV data
    """
    print(f"Generating mock data for {symbol} on {timeframe} timeframe")
    
    # Set the base price based on the symbol
    if symbol.upper() == 'BTCUSDT':
        base_price = 40000
        volatility = 0.02
    elif symbol.upper() == 'ETHUSDT':
        base_price = 2000
        volatility = 0.03
    elif symbol.upper() in ['AAPL', 'AAPL.US']:
        base_price = 150
        volatility = 0.01
    elif symbol.upper() in ['MSFT', 'MSFT.US']:
        base_price = 300
        volatility = 0.01
    else:
        base_price = 100
        volatility = 0.02
    
    # Set the time interval based on the timeframe
    if timeframe in ['1m', '1min']:
        interval = 60  # 1 minute in seconds
    elif timeframe in ['5m', '5min']:
        interval = 300  # 5 minutes in seconds
    elif timeframe in ['15m', '15min']:
        interval = 900  # 15 minutes in seconds
    elif timeframe in ['30m', '30min']:
        interval = 1800  # 30 minutes in seconds
    elif timeframe in ['1h']:
        interval = 3600  # 1 hour in seconds
    elif timeframe in ['4h']:
        interval = 14400  # 4 hours in seconds
    else:
        interval = 86400  # 1 day in seconds
    
    # Generate data
    data = []
    current_time = int(time.time())
    current_price = base_price
    
    for i in range(limit):
        # Calculate the timestamp for this candle
        timestamp = current_time - (limit - i - 1) * interval
        
        # Generate random price movement
        price_change = current_price * volatility * (random.random() * 2 - 1)
        open_price = current_price
        close_price = current_price + price_change
        
        # Ensure prices are positive
        if close_price <= 0:
            close_price = open_price * 0.9
        
        # Generate high and low prices
        high_price = max(open_price, close_price) * (1 + random.random() * volatility)
        low_price = min(open_price, close_price) * (1 - random.random() * volatility)
        
        # Generate random volume
        volume = base_price * 10 * (0.5 + random.random())
        
        # Add the candle to the data
        data.append({
            'time': timestamp,
            'open': float(open_price),
            'high': float(high_price),
            'low': float(low_price),
            'close': float(close_price),
            'volume': float(volume)
        })
        
        # Update the current price for the next candle
        current_price = close_price
    
    return data

def get_intraday_data(symbol, interval):
    """
    Get intraday data from Alpha Vantage
    
    Args:
        symbol (str): The stock symbol
        interval (str): The interval (e.g., '1min', '5min')
        
    Returns:
        dict: Intraday data
    """
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'symbol': symbol,
        'interval': interval,
        'outputsize': 'full',
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    
    # Extract time series data
    time_series_key = f"Time Series ({interval})"
    if time_series_key not in data:
        return {"error": "No data available"}
    
    time_series = data[time_series_key]
    
    # Convert to format suitable for charting
    candles = []
    for timestamp, values in time_series.items():
        candle = {
            'time': datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S').timestamp(),
            'open': float(values['1. open']),
            'high': float(values['2. high']),
            'low': float(values['3. low']),
            'close': float(values['4. close']),
            'volume': float(values['5. volume'])
        }
        candles.append(candle)
    
    # Sort by time
    candles.sort(key=lambda x: x['time'])
    
    return {
        'symbol': symbol,
        'timeframe': interval,
        'candles': candles
    }

def get_daily_data(symbol):
    """
    Get daily data from Alpha Vantage
    
    Args:
        symbol (str): The stock symbol
        
    Returns:
        dict: Daily data
    """
    params = {
        'function': 'TIME_SERIES_DAILY',
        'symbol': symbol,
        'outputsize': 'full',
        'apikey': ALPHA_VANTAGE_API_KEY
    }
    
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    
    # Extract time series data
    if 'Time Series (Daily)' not in data:
        return {"error": "No data available"}
    
    time_series = data['Time Series (Daily)']
    
    # Convert to format suitable for charting
    candles = []
    for timestamp, values in time_series.items():
        candle = {
            'time': datetime.strptime(timestamp, '%Y-%m-%d').timestamp(),
            'open': float(values['1. open']),
            'high': float(values['2. high']),
            'low': float(values['3. low']),
            'close': float(values['4. close']),
            'volume': float(values['5. volume'])
        }
        candles.append(candle)
    
    # Sort by time
    candles.sort(key=lambda x: x['time'])
    
    return {
        'symbol': symbol,
        'timeframe': 'daily',
        'candles': candles
    } 