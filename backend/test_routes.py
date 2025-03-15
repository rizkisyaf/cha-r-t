from flask import Flask, jsonify, request
from app.routes.financial_data_routes import financial_data_bp
import time

# Create a test app
app = Flask(__name__)

# Register the original blueprint
app.register_blueprint(financial_data_bp)

# Add a simple implementation of the realtime endpoint
@app.route('/api/financial-data/realtime', methods=['GET'])
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
        
        # Create a mock candle with current timestamp
        current_time = int(time.time())
        latest_candle = {
            'time': current_time,
            'open': 84000.0,
            'high': 84500.0,
            'low': 83500.0,
            'close': 84200.0,
            'volume': 1000000.0
        }
        
        return jsonify({
            'success': True,
            'symbol': symbol,
            'timestamp': current_time,
            'latest_data': latest_candle
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Run the app
if __name__ == '__main__':
    print("Starting test server on port 5002...")
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} {rule.methods}")
    app.run(host='0.0.0.0', port=5002, debug=True) 