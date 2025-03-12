import os
import requests
import json
import csv
from datetime import datetime, timedelta
from dotenv import load_dotenv
import random

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

def get_financial_data(symbol, timeframe):
    """
    Get financial data for a specific symbol and timeframe
    
    Args:
        symbol (str): The stock symbol (e.g., 'AAPL')
        timeframe (str): The timeframe (e.g., '1D', '1H', '15min')
        
    Returns:
        dict: Financial data in a format suitable for charting
    """
    cache_key = f"{symbol}_{timeframe}"
    
    # Check if data is in cache and not expired
    if cache_key in data_cache and datetime.now().timestamp() < cache_expiry.get(cache_key, 0):
        return data_cache[cache_key]
    
    # Always use CSV data for this project
    csv_data = get_csv_data(timeframe)
    if csv_data and "error" not in csv_data:
        # Cache the data
        data_cache[cache_key] = csv_data
        cache_expiry[cache_key] = (datetime.now() + timedelta(seconds=CACHE_DURATION)).timestamp()
        return csv_data
    
    # If CSV data is not available, use mock data
    return generate_mock_data(symbol, timeframe)

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

def generate_mock_data(symbol, timeframe):
    """
    Generate mock data for testing
    
    Args:
        symbol (str): The stock symbol
        timeframe (str): The timeframe
        
    Returns:
        dict: Mock financial data
    """
    data = []
    base_price = 82000  # Starting price for BTC
    base_volume = 10  # Base volume
    
    now = datetime.now()
    # Generate 100 candles
    for i in range(100, -1, -1):
        # Calculate time based on timeframe
        interval_minutes = convert_timeframe_to_minutes(timeframe)
        candle_time = now - timedelta(minutes=i * interval_minutes)
        
        # Generate realistic price movements
        volatility = base_price * 0.002  # 0.2% volatility
        open_price = base_price + (volatility * (0.5 - random.random()))
        
        # Higher volatility for high and low
        high_price = open_price + (volatility * random.random())
        low_price = open_price - (volatility * random.random())
        
        # Close price between high and low
        close_price = low_price + ((high_price - low_price) * random.random())
        
        # Volume with some randomness
        volume = base_volume * (0.5 + random.random())
        
        # Update base price for next candle
        base_price = close_price
        
        data.append({
            'time': int(candle_time.timestamp()),
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': round(volume, 2)
        })
    
    return {
        'symbol': symbol,
        'timeframe': timeframe,
        'candles': data
    }

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