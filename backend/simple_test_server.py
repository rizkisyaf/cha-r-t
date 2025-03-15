from flask import Flask, jsonify, request
import requests
import time
import datetime
import os
import json
from flask_cors import CORS
import random
import math

app = Flask(__name__)
CORS(app)

# Simple in-memory cache
cache = {
    'coingecko': {},  # Format: {'bitcoin_usd_7_daily': {'data': [...], 'timestamp': 1234567890}}
    'binance': {},    # Format: {'BTCUSDT_1h_100': {'data': [...], 'timestamp': 1234567890}}
}

# Cache TTL in seconds
CACHE_TTL = {
    'daily': 3600,    # 1 hour for daily data
    'hourly': 300,    # 5 minutes for hourly data
    'minutely': 60,   # 1 minute for minutely data
    '1m': 60,         # 1 minute for 1m candles
    '5m': 60,         # 1 minute for 5m candles
    '15m': 300,       # 5 minutes for 15m candles
    '30m': 300,       # 5 minutes for 30m candles
    '1h': 600,        # 10 minutes for 1h candles
    '4h': 1800,       # 30 minutes for 4h candles
    '1d': 3600,       # 1 hour for 1d candles
    '1w': 7200,       # 2 hours for 1w candles
}

@app.route('/api/proxy/binance/klines', methods=['GET'])
def proxy_binance_klines():
    """
    Proxy endpoint for Binance API to get historical kline/candlestick data
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'ETHUSDT')
        interval (str): Kline interval (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): Number of candles to fetch (default: 500, max: 1000)
        
    Returns:
        JSON: Historical price data from Binance
    """
    try:
        # Get query parameters
        symbol = request.args.get('symbol', 'BTCUSDT')
        interval = request.args.get('interval', '1h')
        limit = request.args.get('limit', '100')
        
        # Create cache key
        cache_key = f"{symbol}_{interval}_{limit}"
        
        # Check if we have cached data and it's still valid
        current_time = time.time()
        if cache_key in cache['binance']:
            cache_entry = cache['binance'][cache_key]
            cache_age = current_time - cache_entry['timestamp']
            ttl = CACHE_TTL.get(interval, 600)  # Default to 10 minutes
            
            if cache_age < ttl:
                print(f"Returning cached Binance data for {cache_key}, age: {cache_age:.2f}s")
                return jsonify(cache_entry['data'])
        
        # If no valid cache, make request to Binance API
        print(f"Fetching fresh data from Binance for {cache_key}")
        
        # Binance API endpoint for klines
        url = 'https://api.binance.com/api/v3/klines'
        
        # Prepare parameters
        params = {
            'symbol': symbol,
            'interval': interval,
            'limit': limit
        }
        
        # Make request to Binance
        response = requests.get(url, params=params)
        
        # Check if request was successful
        if response.status_code == 200:
            # Parse response
            data = response.json()
            
            # Format data for our chart
            candles = []
            for kline in data:
                # Binance kline format:
                # [
                #   1499040000000,      // Open time
                #   "0.01634790",       // Open
                #   "0.80000000",       // High
                #   "0.01575800",       // Low
                #   "0.01577100",       // Close
                #   "148976.11427815",  // Volume
                #   1499644799999,      // Close time
                #   "2434.19055334",    // Quote asset volume
                #   308,                // Number of trades
                #   "1756.87402397",    // Taker buy base asset volume
                #   "28.46694368",      // Taker buy quote asset volume
                #   "17928899.62484339" // Ignore
                # ]
                
                candle = {
                    'time': int(kline[0] / 1000),  # Convert from ms to s
                    'open': float(kline[1]),
                    'high': float(kline[2]),
                    'low': float(kline[3]),
                    'close': float(kline[4]),
                    'volume': float(kline[5])
                }
                candles.append(candle)
            
            # Create response
            formatted_response = {
                'success': True,
                'symbol': symbol,
                'interval': interval,
                'data': candles
            }
            
            # Cache the response
            cache['binance'][cache_key] = {
                'data': formatted_response,
                'timestamp': current_time
            }
            
            return jsonify(formatted_response)
        else:
            # Error response from Binance
            error_message = f"Binance API returned status code {response.status_code}: {response.text}"
            print(error_message)
            
            # If we have a rate limit error, try to use mock data
            if response.status_code == 429:
                print(f"Binance rate limit exceeded, using mock data for {symbol}")
                data = generate_mock_crypto_data(symbol.replace('USDT', '').lower(), 30, interval)
                
                # Cache the response
                cache['binance'][cache_key] = {
                    'data': data,
                    'timestamp': current_time
                }
                
                return jsonify(data)
            
            return jsonify({
                'success': False,
                'error': error_message
            })
    
    except Exception as e:
        print(f"Error in Binance proxy: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/proxy/coingecko', methods=['GET'])
def proxy_coingecko():
    """
    Proxy endpoint for CoinGecko API to handle CORS issues and get historical cryptocurrency data
    
    Query parameters:
        coin_id (str): The CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
        vs_currency (str): The currency to compare against (e.g., 'usd', 'eur')
        days (int): Number of days of data to retrieve
        interval (str): Data interval (e.g., 'daily', 'hourly')
        
    Returns:
        JSON: Historical price data from CoinGecko
    """
    try:
        # Get query parameters
        coin_id = request.args.get('coin_id', 'bitcoin')
        vs_currency = request.args.get('vs_currency', 'usd')
        days = request.args.get('days', '7')
        interval = request.args.get('interval', 'daily')
        
        # Create cache key
        cache_key = f"{coin_id}_{vs_currency}_{days}_{interval}"
        
        # Check if we have cached data and it's still valid
        current_time = time.time()
        if cache_key in cache['coingecko']:
            cache_entry = cache['coingecko'][cache_key]
            cache_age = current_time - cache_entry['timestamp']
            ttl = CACHE_TTL.get(interval, 3600)  # Default to 1 hour
            
            if cache_age < ttl:
                print(f"Returning cached data for {cache_key}, age: {cache_age:.2f}s")
                return jsonify(cache_entry['data'])
        
        # If no valid cache, make request to CoinGecko
        print(f"Fetching fresh data from CoinGecko for {cache_key}")
        
        # For demo/testing, if we're requesting bitcoin data, use mock data to avoid rate limits
        if coin_id.lower() == 'bitcoin':
            # Generate mock data
            data = generate_mock_crypto_data(coin_id, days, interval)
            
            # Cache the response
            cache['coingecko'][cache_key] = {
                'data': data,
                'timestamp': current_time
            }
            
            return jsonify(data)
        
        # For other coins, try the real API
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {
            'vs_currency': vs_currency,
            'days': days,
            'interval': interval
        }
        
        response = requests.get(url, params=params)
        
        # Check if request was successful
        if response.status_code == 200:
            # Parse response
            data = response.json()
            
            # Format data for chart
            prices = data.get('prices', [])
            market_caps = data.get('market_caps', [])
            total_volumes = data.get('total_volumes', [])
            
            # Convert to OHLCV candles
            candles = []
            for i, price_data in enumerate(prices):
                timestamp = price_data[0] // 1000  # Convert from ms to s
                price = price_data[1]
                
                # For the first candle, use the price as open, high, low, and close
                if i == 0:
                    candle = {
                        'time': timestamp,
                        'open': price,
                        'high': price,
                        'low': price,
                        'close': price,
                        'volume': total_volumes[i][1] if i < len(total_volumes) else 0
                    }
                else:
                    # For subsequent candles, use the previous close as open
                    prev_close = candles[i-1]['close']
                    candle = {
                        'time': timestamp,
                        'open': prev_close,
                        'high': max(prev_close, price),
                        'low': min(prev_close, price),
                        'close': price,
                        'volume': total_volumes[i][1] if i < len(total_volumes) else 0
                    }
                
                candles.append(candle)
            
            # Create response
            formatted_response = {
                'success': True,
                'symbol': coin_id,
                'timeframe': interval,
                'data': candles
            }
            
            # Cache the response
            cache['coingecko'][cache_key] = {
                'data': formatted_response,
                'timestamp': current_time
            }
            
            return jsonify(formatted_response)
        elif response.status_code == 429:
            # Rate limit exceeded, use mock data
            print(f"CoinGecko rate limit exceeded, using mock data for {coin_id}")
            data = generate_mock_crypto_data(coin_id, days, interval)
            
            # Cache the response
            cache['coingecko'][cache_key] = {
                'data': data,
                'timestamp': current_time
            }
            
            return jsonify(data)
        else:
            # Other error, return error message
            error_message = f"CoinGecko API returned status code {response.status_code}: {response.text}"
            print(error_message)
            return jsonify({
                'success': False,
                'error': error_message
            })
    
    except Exception as e:
        print(f"Error in CoinGecko proxy: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/financial-data', methods=['GET'])
def get_financial_data():
    """
    Get historical financial data for a specific symbol and timeframe
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): Number of candles to fetch (default: 100)
        
    Returns:
        JSON: Historical price data
    """
    try:
        # Get query parameters
        symbol = request.args.get('symbol', 'BTCUSDT')
        timeframe = request.args.get('timeframe', '1h')
        limit = request.args.get('limit', '100')
        
        # Map timeframe to Binance interval
        interval = map_timeframe_to_binance_interval(timeframe)
        
        # For crypto symbols, use Binance API
        if is_crypto_symbol(symbol):
            # Redirect to Binance proxy
            binance_symbol = format_symbol_for_binance(symbol)
            
            # Make internal request to Binance proxy
            binance_url = f"/api/proxy/binance/klines?symbol={binance_symbol}&interval={interval}&limit={limit}"
            print(f"Redirecting to Binance proxy: {binance_url}")
            
            # Use requests to make an internal request
            binance_response = requests.get(f"http://localhost:{request.host.split(':')[1]}{binance_url}")
            
            if binance_response.status_code == 200:
                return jsonify(binance_response.json())
            else:
                # If Binance proxy fails, try CoinGecko
                print(f"Binance proxy failed, trying CoinGecko")
                
                # Map symbol to CoinGecko coin ID
                coin_id = get_coingecko_coin_id(symbol)
                days = get_timeframe_days(timeframe, int(limit))
                interval = get_interval_from_timeframe(timeframe)
                
                # Make internal request to CoinGecko proxy
                coingecko_url = f"/api/proxy/coingecko?coin_id={coin_id}&vs_currency=usd&days={days}&interval={interval}"
                coingecko_response = requests.get(f"http://localhost:{request.host.split(':')[1]}{coingecko_url}")
                
                if coingecko_response.status_code == 200:
                    return jsonify(coingecko_response.json())
                else:
                    # If all APIs fail, generate mock data
                    print(f"All APIs failed, generating mock data")
                    mock_data = generate_mock_crypto_data(symbol.replace('USDT', '').lower(), int(days), interval)
                    return jsonify(mock_data)
        else:
            # For stocks and other assets, generate mock data
            print(f"Non-crypto symbol, generating mock data")
            mock_data = generate_mock_stock_data(symbol, timeframe, int(limit))
            return jsonify({
                'success': True,
                'symbol': symbol,
                'timeframe': timeframe,
                'data': mock_data
            })
    
    except Exception as e:
        print(f"Error in financial data endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

def generate_mock_crypto_data(coin_id, days, interval):
    """Generate mock cryptocurrency data for testing"""
    days = int(days)
    now = datetime.datetime.now()
    
    # Set base price based on coin
    if coin_id.lower() == 'bitcoin':
        base_price = 80000
        volatility = 2000
    elif coin_id.lower() == 'ethereum':
        base_price = 3000
        volatility = 100
    else:
        base_price = 100
        volatility = 5
    
    # Generate data points
    candles = []
    
    # Determine time interval
    if interval == 'daily':
        delta = datetime.timedelta(days=1)
        num_points = days
    elif interval == 'hourly':
        delta = datetime.timedelta(hours=1)
        num_points = min(days * 24, 168)  # Cap at 7 days of hourly data
    else:  # minutely
        delta = datetime.timedelta(minutes=1)
        num_points = min(days * 24 * 60, 1440)  # Cap at 1 day of minute data
    
    # Generate candles
    price = base_price
    for i in range(num_points):
        timestamp = int((now - delta * (num_points - i)).timestamp())
        
        # Random price movement
        change = (0.5 - random.random()) * volatility
        new_price = max(price + change, 1)  # Ensure price doesn't go below 1
        
        candle = {
            'time': timestamp,
            'open': price,
            'close': new_price,
            'high': max(price, new_price) + random.random() * volatility * 0.1,
            'low': min(price, new_price) - random.random() * volatility * 0.1,
            'volume': base_price * 10 * (0.5 + random.random())
        }
        
        candles.append(candle)
        price = new_price
    
    return {
        'success': True,
        'symbol': coin_id,
        'timeframe': interval,
        'data': candles
    }

def generate_mock_stock_data(symbol, timeframe, limit):
    """Generate mock stock data for testing"""
    now = datetime.datetime.now()
    data = []
    base_price = 100
    volatility = 5
    
    # Generate data points based on timeframe
    interval_seconds = get_interval_seconds(timeframe)
    
    # Generate candles
    price = base_price
    for i in range(limit):
        timestamp = int((now - datetime.timedelta(seconds=interval_seconds * (limit - i))).timestamp())
        
        # Random price movement
        change = (0.5 - random.random()) * volatility
        new_price = max(price + change, 1)  # Ensure price doesn't go below 1
        
        candle = {
            'time': timestamp,
            'open': price,
            'close': new_price,
            'high': max(price, new_price) + random.random() * volatility * 0.1,
            'low': min(price, new_price) - random.random() * volatility * 0.1,
            'volume': base_price * 10 * (0.5 + random.random())
        }
        
        data.append(candle)
        price = new_price
    
    return data

def get_interval_seconds(timeframe):
    """Convert timeframe to seconds"""
    tf = timeframe.lower()
    
    if tf in ['1m', '1min']:
        return 60
    elif tf in ['5m', '5min']:
        return 5 * 60
    elif tf in ['15m', '15min']:
        return 15 * 60
    elif tf in ['30m', '30min']:
        return 30 * 60
    elif tf in ['1h', '60min']:
        return 60 * 60
    elif tf in ['4h']:
        return 4 * 60 * 60
    elif tf in ['1d', 'd', 'daily']:
        return 24 * 60 * 60
    elif tf in ['1w', 'w', 'weekly']:
        return 7 * 24 * 60 * 60
    
    # Default to 1 hour
    return 60 * 60

def map_timeframe_to_binance_interval(timeframe):
    """Map timeframe to Binance interval"""
    tf = timeframe.lower()
    
    # Direct mappings
    if tf in ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M']:
        return tf
    
    # Other common formats
    if tf in ['1min']:
        return '1m'
    elif tf in ['5min']:
        return '5m'
    elif tf in ['15min']:
        return '15m'
    elif tf in ['30min']:
        return '30m'
    elif tf in ['60min', 'h']:
        return '1h'
    elif tf in ['d', 'daily']:
        return '1d'
    elif tf in ['w', 'weekly']:
        return '1w'
    elif tf in ['m', 'monthly']:
        return '1M'
    
    # Default to 1 hour
    return '1h'

def format_symbol_for_binance(symbol):
    """Format symbol for Binance API"""
    # Remove any spaces or special characters
    symbol = symbol.replace('-', '').replace('/', '').replace(' ', '')
    
    # Ensure USDT pairs are properly formatted
    if 'USDT' not in symbol.upper() and 'BTC' in symbol.upper():
        return symbol.upper()
    elif 'USDT' not in symbol.upper():
        return symbol.upper() + 'USDT'
    
    return symbol.upper()

def is_crypto_symbol(symbol):
    """Check if a symbol is a cryptocurrency"""
    crypto_symbols = ['BTC', 'ETH', 'XRP', 'LTC', 'BCH', 'ADA', 'DOT', 'LINK', 'XLM', 'DOGE', 'USDT']
    symbol = symbol.upper()
    
    # Check if the symbol contains any known crypto symbol
    return any(crypto in symbol for crypto in crypto_symbols) or 'USDT' in symbol

def get_coingecko_coin_id(symbol):
    """Convert symbol to CoinGecko coin ID"""
    symbol = symbol.upper().replace('USDT', '')
    
    # Common mappings
    symbol_map = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'XRP': 'ripple',
        'LTC': 'litecoin',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'BNB': 'binancecoin',
        'SOL': 'solana'
    }
    
    return symbol_map.get(symbol, 'bitcoin')

def get_timeframe_days(timeframe, limit):
    """Convert timeframe to days for CoinGecko API"""
    tf = timeframe.lower()
    
    # For daily timeframes, use the limit directly
    if tf in ['1d', 'daily', 'd']:
        return min(limit, 365)  # CoinGecko has a max of 365 days
    
    # For weekly timeframes
    if tf in ['1w', 'weekly', 'w']:
        return min(limit * 7, 365)
    
    # For monthly timeframes
    if tf in ['1m', 'monthly', 'm']:
        return min(limit * 30, 365)
    
    # For hourly timeframes
    if tf in ['1h', '60min']:
        return min(math.ceil(limit / 24), 90)  # CoinGecko has hourly data for up to 90 days
    
    if tf in ['4h']:
        return min(math.ceil(limit / 6), 90)
    
    # For minute timeframes, convert to hours then days
    if tf in ['1m', '1min']:
        return min(math.ceil(limit / 1440), 7)  # CoinGecko has minute data for up to 7 days
    
    if tf in ['5m', '5min']:
        return min(math.ceil(limit / 288), 7)
    
    if tf in ['15m', '15min']:
        return min(math.ceil(limit / 96), 7)
    
    if tf in ['30m', '30min']:
        return min(math.ceil(limit / 48), 7)
    
    # Default to 30 days
    return 30

def get_interval_from_timeframe(timeframe):
    """Get interval from timeframe for CoinGecko API"""
    tf = timeframe.lower()
    
    # For minute timeframes
    if tf in ['1m', '1min', '5m', '5min', '15m', '15min', '30m', '30min']:
        return 'minutely'
    
    # For hourly timeframes
    if tf in ['1h', '60min', '4h']:
        return 'hourly'
    
    # For daily, weekly, monthly timeframes
    return 'daily'

@app.route('/api/financial-data/realtime', methods=['GET'])
def get_realtime_data():
    """
    Get real-time financial data for a specific symbol
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        
    Returns:
        JSON: Latest financial data
    """
    try:
        # Get symbol from query parameters
        symbol = request.args.get('symbol', 'BTCUSDT')
        
        # Get current timestamp
        timestamp = int(time.time())
        
        # Generate mock data for the latest candle
        latest_data = {
            'time': timestamp,
            'open': 84000.0,
            'high': 84500.0,
            'low': 83500.0,
            'close': 84200.0,
            'volume': 1000000.0
        }
        
        # Return response
        return jsonify({
            'success': True,
            'symbol': symbol,
            'timestamp': timestamp,
            'latest_data': latest_data
        })
    
    except Exception as e:
        print(f"Error in real-time data endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    print("Starting simple test server on port 5002...")
    print("Available routes:")
    print("  - /api/proxy/coingecko")
    print("  - /api/proxy/binance/klines")
    print("  - /api/financial-data")
    print("  - /api/financial-data/realtime")
    app.run(host='0.0.0.0', port=5002, debug=True) 