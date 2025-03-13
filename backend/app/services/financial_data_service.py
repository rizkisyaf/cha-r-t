import os
import requests
import json
import csv
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

# CSV data file path
CSV_DATA_FILE = os.path.join(os.path.dirname(__file__), 'futures_orderbook_data.csv')

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
        
        # Check if we have data from the frontend
        if symbol == "BTCUSDT" and timeframe in ['1m', '1min', '5m', '5min', '15m', '15min']:
            # For crypto on short timeframes, we'll generate mock data
            # since yfinance doesn't provide real-time minute data for crypto
            return generate_mock_data(symbol, timeframe, limit)
        
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

def get_csv_data(timeframe):
    """
    Get financial data from the CSV file
    
    Args:
        timeframe (str): The timeframe (e.g., '1D', '1H', '15min')
        
    Returns:
        dict: Financial data in a format suitable for charting
    """
    try:
        # Check if CSV file exists
        if not os.path.exists(CSV_DATA_FILE):
            print(f"CSV file not found: {CSV_DATA_FILE}")
            return {"error": "CSV data not available"}
        
        # Read CSV file
        print(f"Reading CSV data from {CSV_DATA_FILE}")
        
        # Process the orderbook data into OHLC candles
        raw_data = []
        with open(CSV_DATA_FILE, 'r') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    # Convert timestamp from milliseconds to datetime
                    timestamp = int(row['timestamp']) / 1000
                    
                    # Use mid price (average of best bid and ask)
                    bid_price = float(row['bid_price1'])
                    ask_price = float(row['ask_price1'])
                    price = (bid_price + ask_price) / 2
                    
                    # Use sum of bid and ask quantities as volume
                    volume = float(row['bid_qty1']) + float(row['ask_qty1'])
                    
                    raw_data.append({
                        'timestamp': timestamp,
                        'price': price,
                        'volume': volume
                    })
                except (ValueError, KeyError) as e:
                    # Skip invalid rows
                    continue
                
                # Limit to 50,000 rows for performance
                if len(raw_data) >= 50000:
                    break
        
        print(f"Loaded {len(raw_data)} data points from CSV")
        
        # Sort by timestamp
        raw_data.sort(key=lambda x: x['timestamp'])
        
        # Convert to OHLC based on timeframe
        interval_minutes = convert_timeframe_to_minutes(timeframe)
        interval_seconds = interval_minutes * 60
        
        # Group data by time intervals
        candle_groups = {}
        for data_point in raw_data:
            # Calculate candle timestamp (floor to interval)
            candle_timestamp = int(data_point['timestamp'] // interval_seconds * interval_seconds)
            
            if candle_timestamp not in candle_groups:
                candle_groups[candle_timestamp] = {
                    'prices': [data_point['price']],
                    'volumes': [data_point['volume']]
                }
            else:
                candle_groups[candle_timestamp]['prices'].append(data_point['price'])
                candle_groups[candle_timestamp]['volumes'].append(data_point['volume'])
        
        # Convert groups to OHLC candles
        candles = []
        for timestamp, data in candle_groups.items():
            if len(data['prices']) > 0:
                candles.append({
                    'time': timestamp,
                    'open': data['prices'][0],
                    'high': max(data['prices']),
                    'low': min(data['prices']),
                    'close': data['prices'][-1],
                    'volume': sum(data['volumes'])
                })
        
        # Sort candles by time
        candles.sort(key=lambda x: x['time'])
        
        # Limit to 500 candles for performance
        if len(candles) > 500:
            candles = candles[-500:]
        
        print(f"Created {len(candles)} candles from CSV data")
        
        return {
            'symbol': 'BTC/USD Futures',
            'timeframe': timeframe,
            'candles': candles
        }
    except Exception as e:
        print(f"Error reading CSV data: {str(e)}")
        return {"error": f"Failed to process CSV data: {str(e)}"}

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

def convert_timeframe_to_minutes(timeframe):
    """
    Convert timeframe to minutes for CSV data processing
    
    Args:
        timeframe (str): The timeframe (e.g., '1D', '1H', '15min')
        
    Returns:
        int: Number of minutes in the timeframe
    """
    timeframe_map = {
        '1min': 1,
        '5min': 5,
        '15min': 15,
        '30min': 30,
        '1H': 60,
        '4H': 240,
        '1D': 1440,  # 24 hours
        '1W': 10080,  # 7 days
        '1M': 43200   # 30 days (approximate)
    }
    
    return timeframe_map.get(timeframe, 15)  # Default to 15 minutes

def convert_timeframe_to_interval(timeframe):
    """
    Convert the application timeframe to Alpha Vantage interval
    
    Args:
        timeframe (str): The timeframe (e.g., '1D', '1H', '15min')
        
    Returns:
        str: Alpha Vantage interval
    """
    timeframe_map = {
        '1min': '1min',
        '5min': '5min',
        '15min': '15min',
        '30min': '30min',
        '1H': '60min',
        '1D': 'daily',
        '1W': 'weekly',
        '1M': 'monthly'
    }
    
    return timeframe_map.get(timeframe, 'daily')

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