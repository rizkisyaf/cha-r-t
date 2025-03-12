from flask import request, jsonify
from app import app, socketio
from app.services import ai_service, financial_data_service

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/api/financial-data', methods=['GET'])
def get_financial_data():
    """Get financial data for a specific symbol and timeframe"""
    symbol = request.args.get('symbol', 'AAPL')
    timeframe = request.args.get('timeframe', '1D')
    
    try:
        data = financial_data_service.get_financial_data(symbol, timeframe)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def process_chat():
    """Process a chat message and return AI response"""
    data = request.json
    message = data.get('message', '')
    chart_context = data.get('chartContext', {})
    
    try:
        response = ai_service.process_message(message, chart_context)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle incoming chat messages via WebSocket"""
    message = data.get('message', '')
    chart_context = data.get('chartContext', {})
    
    try:
        response = ai_service.process_message(message, chart_context)
        socketio.emit('chat_response', response)
    except Exception as e:
        socketio.emit('error', {"error": str(e)}) 