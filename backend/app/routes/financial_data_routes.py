from flask import Blueprint, request, jsonify
from app.services.financial_data_service import get_financial_data
from app.services.error_handling import handle_exception
import traceback
import requests
import time
from datetime import datetime

financial_data_bp = Blueprint('financial_data', __name__)

# Cache for Binance proxy data to reduce API calls
binance_proxy_cache = {}
binance_proxy_cache_expiry = {}
BINANCE_PROXY_CACHE_DURATION = 60 * 5  # 5 minutes in seconds for most timeframes
BINANCE_PROXY_CACHE_DURATION_LONG = 60 * 60 * 24  # 24 hours for daily and longer timeframes

@financial_data_bp.route('/api/financial-data', methods=['GET'])
def get_financial_data_route():
    """
    Get financial data for a specific symbol and timeframe
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        timeframe (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): The number of data points to return
        
    Returns:
        JSON: Financial data
    """
    try:
        symbol = request.args.get('symbol', 'BTCUSDT')
        timeframe = request.args.get('timeframe', '1d')
        limit = int(request.args.get('limit', 100))
        
        print(f"Fetching financial data for {symbol} on {timeframe} timeframe with limit {limit}")
        
        try:
            data = get_financial_data(symbol, timeframe, limit)
            
            # If data is a list, wrap it in a dictionary
            if isinstance(data, list):
                response_data = {
                    'success': True,
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'data': data
                }
            else:
                # If data is already a dictionary (e.g., from get_json_data), use it directly
                response_data = data
                if 'success' not in response_data:
                    response_data['success'] = True
                if 'symbol' not in response_data:
                    response_data['symbol'] = symbol
                if 'timeframe' not in response_data:
                    response_data['timeframe'] = timeframe
            
            return jsonify(response_data)
        except Exception as e:
            print(f"Error in get_financial_data_route: {str(e)}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': str(e),
                'symbol': symbol,
                'timeframe': timeframe
            }), 500
    except Exception as e:
        print(f"Error in get_financial_data_route: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@financial_data_bp.route('/api/financial-data/realtime', methods=['GET'])
def get_realtime_data_route():
    """
    Get real-time financial data for a specific symbol
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        
    Returns:
        JSON: Latest financial data
    """
    try:
        symbol = request.args.get('symbol', 'BTCUSDT')
        
        # For real-time data, we'll use a short timeframe with a small limit
        timeframe = "1m"
        limit = 1
        
        try:
            data = get_financial_data(symbol, timeframe, limit)
            
            # Get only the most recent candle
            latest_candle = data[-1] if data else None
            
            return jsonify({
                'success': True,
                'symbol': symbol,
                'timestamp': latest_candle.get('time'),
                'latest_data': latest_candle
            })
        except Exception as e:
            print(f"Error in get_realtime_data_route: {str(e)}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': str(e),
                'symbol': symbol
            }), 500
    except Exception as e:
        print(f"Error in get_realtime_data_route: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@financial_data_bp.route('/api/proxy/binance/klines', methods=['GET'])
def proxy_binance_klines():
    """
    Proxy endpoint for Binance API to fetch klines (candlestick) data
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT')
        interval (str): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit (int): The number of candles to fetch
        
    Returns:
        JSON: Candlestick data from Binance
    """
    try:
        # Get parameters from request
        symbol = request.args.get('symbol', 'BTCUSDT')
        interval = request.args.get('interval', '1d')
        limit = request.args.get('limit', '100')
        
        # Check for cache bypass parameters
        timestamp = request.args.get('_')
        random_param = request.args.get('random')
        force_bypass = request.args.get('force_bypass', 'false').lower() == 'true'
        
        # Create a cache key
        cache_key = f"binance_proxy_{symbol}_{interval}_{limit}"
        
        # Determine cache duration based on interval
        cache_duration = BINANCE_PROXY_CACHE_DURATION
        if interval in ['1d', '3d', '1w', '1M']:
            cache_duration = BINANCE_PROXY_CACHE_DURATION_LONG
        
        # Check if we should bypass cache
        should_bypass_cache = force_bypass
        
        # Check cache first
        cache_valid = (
            cache_key in binance_proxy_cache and 
            cache_key in binance_proxy_cache_expiry and
            time.time() - binance_proxy_cache_expiry.get(cache_key, 0) < cache_duration
        )
        
        if cache_valid and not should_bypass_cache:
            print(f"Using cached data for Binance proxy: {symbol} on {interval} timeframe with limit {limit}")
            print(f"Cache age: {time.time() - binance_proxy_cache_expiry.get(cache_key, 0)} seconds")
            return jsonify(binance_proxy_cache[cache_key])
        
        # If we're here, we need to fetch fresh data
        if not cache_valid:
            print(f"Cache invalid or expired for {symbol} on {interval} timeframe")
        elif should_bypass_cache:
            print(f"Bypassing cache for {symbol} on {interval} timeframe due to force_bypass={force_bypass}")
        
        # Build the Binance API URL
        url = "https://api.binance.com/api/v3/klines"
        
        # Prepare parameters
        params = {
            'symbol': symbol.upper(),
            'interval': interval,
            'limit': limit
        }
        
        print(f"Proxying request to Binance API: {url} with params: {params}")
        
        try:
            # Make the request to Binance API
            response = requests.get(url, params=params, timeout=10)
            
            # Check if the response is successful
            if response.status_code != 200:
                return jsonify({
                    'success': False,
                    'error': f"Binance API returned status code {response.status_code}: {response.text}"
                }), response.status_code
            
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
            
            response_data = {
                'success': True,
                'symbol': symbol,
                'timeframe': interval,
                'data': formatted_data
            }
            
            # Update cache
            binance_proxy_cache[cache_key] = response_data
            binance_proxy_cache_expiry[cache_key] = time.time()
            
            print(f"Updated cache for {symbol} on {interval} timeframe with {len(formatted_data)} candles")
            
            return jsonify(response_data)
        except Exception as e:
            print(f"Error in proxy_binance_klines: {str(e)}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': str(e),
                'symbol': symbol,
                'interval': interval
            }), 500
    except Exception as e:
        print(f"Error in proxy_binance_klines: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@financial_data_bp.route('/api/websocket/binance', methods=['GET'])
def get_binance_websocket_info():
    """
    Get WebSocket connection details for Binance streams
    
    Query parameters:
        symbol (str): The trading symbol (e.g., 'BTCUSDT')
        stream_type (str): The type of stream (e.g., 'kline_1m', 'trade', 'depth')
        
    Returns:
        JSON: WebSocket connection details
    """
    try:
        symbol = request.args.get('symbol', 'BTCUSDT').lower()
        stream_type = request.args.get('stream_type', 'kline_1m')
        
        # Format the WebSocket URL
        if stream_type.startswith('kline_'):
            # For kline streams
            ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@{stream_type}"
        elif stream_type == 'trade':
            # For trade streams
            ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@trade"
        elif stream_type == 'depth':
            # For depth streams (order book)
            ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@depth"
        else:
            # Default to kline_1m
            ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@kline_1m"
        
        # Return the WebSocket URL and connection details
        return jsonify({
            'success': True,
            'symbol': symbol,
            'stream_type': stream_type,
            'websocket_url': ws_url,
            'documentation': 'https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md'
        })
    except Exception as e:
        print(f"Error in get_binance_websocket_info: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'symbol': request.args.get('symbol', 'BTCUSDT').lower(),
            'stream_type': request.args.get('stream_type', 'kline_1m')
        }), 500

@financial_data_bp.route('/api/clear-cache', methods=['GET'])
def clear_cache_route():
    """
    Clear the cache for a specific symbol and timeframe or the entire cache
    
    Query parameters:
        symbol (str, optional): The trading symbol (e.g., 'BTCUSDT', 'AAPL')
        timeframe (str, optional): The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        clear_all (bool, optional): Whether to clear the entire cache
        
    Returns:
        JSON: Success message
    """
    try:
        symbol = request.args.get('symbol')
        timeframe = request.args.get('timeframe')
        clear_all = request.args.get('clear_all', 'false').lower() == 'true'
        
        # Import the data_cache and cache_expiry from the financial_data_service
        from app.services.financial_data_service import data_cache, cache_expiry
        
        cleared_keys = []
        
        if clear_all:
            # Clear all caches
            binance_proxy_cache.clear()
            binance_proxy_cache_expiry.clear()
            data_cache.clear()
            cache_expiry.clear()
            print("Cleared all caches")
            return jsonify({
                'success': True,
                'message': 'All caches cleared successfully'
            })
        
        # Clear specific caches based on symbol and timeframe
        if symbol:
            symbol = symbol.upper()
            
            # Clear from binance_proxy_cache by forcing expiration
            for key in list(binance_proxy_cache.keys()):
                if symbol in key:
                    if timeframe:
                        # If timeframe is specified, only clear matching timeframe
                        if timeframe in key:
                            # Force expiration by setting timestamp to 0
                            binance_proxy_cache_expiry[key] = 0
                            cleared_keys.append(key)
                    else:
                        # If no timeframe, clear all for this symbol
                        binance_proxy_cache_expiry[key] = 0
                        cleared_keys.append(key)
            
            # Clear from data_cache by forcing expiration
            for key in list(data_cache.keys()):
                if symbol in key:
                    if timeframe:
                        # If timeframe is specified, only clear matching timeframe
                        if timeframe in key:
                            # Force expiration by setting timestamp to 0
                            cache_expiry[key] = 0
                            cleared_keys.append(key)
                    else:
                        # If no timeframe, clear all for this symbol
                        cache_expiry[key] = 0
                        cleared_keys.append(key)
            
            print(f"Cleared cache for symbol {symbol}{' and timeframe ' + timeframe if timeframe else ''}")
            return jsonify({
                'success': True,
                'message': f"Cache cleared for symbol {symbol}{' and timeframe ' + timeframe if timeframe else ''}",
                'cleared_keys': cleared_keys
            })
        
        # If no symbol specified but timeframe is, clear all for that timeframe
        if timeframe and not symbol:
            # Clear from binance_proxy_cache by forcing expiration
            for key in list(binance_proxy_cache.keys()):
                if timeframe in key:
                    # Force expiration by setting timestamp to 0
                    binance_proxy_cache_expiry[key] = 0
                    cleared_keys.append(key)
            
            # Clear from data_cache by forcing expiration
            for key in list(data_cache.keys()):
                if timeframe in key:
                    # Force expiration by setting timestamp to 0
                    cache_expiry[key] = 0
                    cleared_keys.append(key)
            
            print(f"Cleared cache for timeframe {timeframe}")
            return jsonify({
                'success': True,
                'message': f"Cache cleared for timeframe {timeframe}",
                'cleared_keys': cleared_keys
            })
        
        # If neither symbol nor timeframe specified, return error
        if not symbol and not timeframe and not clear_all:
            return jsonify({
                'success': False,
                'error': 'Please specify symbol, timeframe, or set clear_all=true'
            }), 400
        
    except Exception as e:
        print(f"Error in clear_cache_route: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 