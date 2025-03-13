from flask import request, jsonify
from app import app, socketio
from app.services import financial_data_service
from app.services.unified_ai_service import unified_ai_service
import asyncio
import json
import time
import traceback

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/api/financial-data', methods=['GET'])
def get_financial_data():
    """Get financial data for a specific symbol and timeframe"""
    symbol = request.args.get('symbol', 'AAPL')
    timeframe = request.args.get('timeframe', '1D')
    limit = request.args.get('limit', 100, type=int)
    
    try:
        data = financial_data_service.get_financial_data(symbol, timeframe, limit)
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
        # Create a system prompt based on the chart context
        system_prompt = get_system_prompt()
        
        # Use asyncio to run the async process_message function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(unified_ai_service.process_message(message, system_prompt, chart_context))
        loop.close()
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mistral/chat', methods=['POST'])
def process_mistral_chat():
    """Process a chat message with Mistral AI."""
    try:
        # Get the request data
        data = request.json
        
        # Validate the request data
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid request data"}), 400
        
        # Get the message from the request
        message = data.get("message")
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        # Get the system prompt from the request (optional)
        system_prompt = data.get("systemPrompt")
        
        # Get the chart context from the request (optional)
        chart_context = data.get("chartContext")
        
        # Debug the chart context
        if chart_context:
            print(f"DEBUG: Received chart context with keys: {list(chart_context.keys())}")
            if 'candles' in chart_context:
                candles = chart_context.get('candles', [])
                print(f"DEBUG: Received {len(candles)} candles in chart context")
                if candles and len(candles) > 0:
                    print(f"DEBUG: First candle: {candles[0]}")
                    print(f"DEBUG: Last candle: {candles[-1]}")
            if 'indicators' in chart_context:
                indicators = chart_context.get('indicators', [])
                print(f"DEBUG: Received {len(indicators)} indicators in chart context")
                for i, indicator in enumerate(indicators):
                    print(f"DEBUG: Indicator {i}: {indicator}")
            if 'symbol' in chart_context:
                print(f"DEBUG: Symbol: {chart_context['symbol']}")
            if 'timeframe' in chart_context:
                print(f"DEBUG: Timeframe: {chart_context['timeframe']}")
            if 'currentPrice' in chart_context:
                print(f"DEBUG: Current price: {chart_context['currentPrice']}")
        
        # Get the last user message from the conversation
        last_user_message = None
        conversation = data.get("conversation", [])
        for msg in reversed(conversation):
            if msg.get("role") == "user":
                last_user_message = msg.get("content")
                break
        
        # If no last user message found, use the current message
        if not last_user_message:
            last_user_message = message
        
        # Create a system prompt if not provided
        if not system_prompt:
            system_prompt = """You are a helpful AI assistant for financial chart analysis.
You can analyze charts, add indicators, and provide insights about market trends.
When the user asks you to perform actions on the chart, use the appropriate function calls.
Always be concise, accurate, and helpful."""
        
        # Process the message with the unified AI service
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(unified_ai_service.process_message(
            message=last_user_message,
            system_prompt=system_prompt,
            context=chart_context
        ))
        loop.close()
        
        # Return the response
        return jsonify(response)
    except Exception as e:
        print(f"Error processing chat: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error processing chat: {str(e)}"}), 500

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
        # Create a system prompt based on the chart context
        system_prompt = get_system_prompt()
        
        # Use asyncio to run the async process_message function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(unified_ai_service.process_message(message, system_prompt, chart_context))
        loop.close()
        
        socketio.emit('chat_response', response)
    except Exception as e:
        socketio.emit('error', {"error": str(e)})

def get_system_prompt():
    """
    Get the system prompt for the AI
    
    Returns:
        str: The system prompt
    """
    return """
You are an AI assistant for a financial charting application called cha(r)t. Your role is to help users analyze financial data, modify charts, and build trading strategies.

When responding to user messages, you should:
1. Provide helpful insights about the financial data or the user's request.
2. Generate commands to modify the chart when appropriate.
3. Format your responses with clear sections, bullet points, and line breaks for readability.
4. Use bold formatting (**text**) for important values and section headers.
5. Keep paragraphs short (2-3 sentences) and add spacing between sections.

Be concise, accurate, and helpful in your responses.
""" 