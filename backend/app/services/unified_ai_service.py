import os
import json
import requests
import time
import random
from dotenv import load_dotenv
from app.services.financial_data_service import get_financial_data
import traceback

# Load environment variables
load_dotenv()

# Get Mistral API key from environment
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
MISTRAL_API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'

# Retry configuration
MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 2  # seconds

def make_api_request_with_retry(endpoint, headers, data, max_retries=MAX_RETRIES, initial_delay=INITIAL_RETRY_DELAY):
    """
    Make an API request with retry logic and exponential backoff
    
    Args:
        endpoint (str): The API endpoint
        headers (dict): The request headers
        data (dict): The request data
        max_retries (int): Maximum number of retries
        initial_delay (float): Initial delay between retries in seconds
        
    Returns:
        requests.Response: The API response
    """
    retries = 0
    delay = initial_delay
    
    while retries <= max_retries:
        try:
            response = requests.post(endpoint, headers=headers, json=data)
            
            # If the request was successful or it's not a rate limit error, return the response
            if response.ok or response.status_code != 429:
                return response
            
            # If we've reached the maximum number of retries, return the response
            if retries == max_retries:
                return response
            
            # Calculate the delay with exponential backoff and jitter
            delay = delay * (1.5 + random.random() * 0.5)
            
            # Get retry-after header if available
            retry_after = response.headers.get('Retry-After')
            if retry_after:
                try:
                    # Use the retry-after header if it's a valid number
                    delay = float(retry_after)
                except (ValueError, TypeError):
                    # Otherwise, use our calculated delay
                    pass
            
            print(f"Rate limited. Retrying in {delay:.2f} seconds... (Attempt {retries + 1}/{max_retries})")
            time.sleep(delay)
            retries += 1
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            if retries == max_retries:
                raise
            
            print(f"Retrying in {delay:.2f} seconds... (Attempt {retries + 1}/{max_retries})")
            time.sleep(delay)
            retries += 1
            delay = delay * 2
    
    # This should not be reached, but just in case
    raise Exception("Maximum retries exceeded")

class UnifiedAIService:
    """
    A unified AI service that can be used by both frontend and backend
    to interact with Mistral AI with function calling capabilities.
    """
    
    def __init__(self):
        """Initialize the service with empty conversation history and function handlers."""
        self.conversation = []
        self.function_handlers = {}
        self.available_functions = {}
    
    def register_function(self, function_name, function_schema, handler):
        """
        Register a function with its schema and handler
        
        Args:
            function_name (str): The name of the function
            function_schema (dict): The JSON schema for the function
            handler (callable): The function handler
        """
        self.available_functions[function_name] = function_schema
        self.function_handlers[function_name] = handler
    
    def register_default_functions(self):
        """Register the default functions for the service."""
        # Financial data function
        self.register_function(
            "get_financial_data",
            {
                "name": "get_financial_data",
                "description": "Get financial data for a specific symbol and timeframe",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "symbol": {
                            "type": "string",
                            "description": "The trading symbol (e.g., 'BTCUSDT', 'AAPL')"
                        },
                        "timeframe": {
                            "type": "string",
                            "description": "The timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')"
                        }
                    },
                    "required": ["symbol", "timeframe"]
                }
            },
            lambda args: self._get_financial_data_handler(args)
        )
        
        # Add indicator function
        self.register_function(
            "add_indicator",
            {
                "name": "add_indicator",
                "description": "Adds a technical indicator to the chart",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "description": "The type of indicator to add (e.g., 'SMA', 'EMA', 'RSI', 'MACD')"
                        },
                        "period": {
                            "type": "integer",
                            "description": "The period for the indicator (e.g., 20 for SMA20)"
                        },
                        "color": {
                            "type": "string",
                            "description": "The color for the indicator (hex code)"
                        }
                    },
                    "required": ["type"]
                }
            },
            lambda args: self._add_indicator_handler(args)
        )
        
        # Chart analysis function
        self.register_function(
            "analyze_chart",
            {
                "name": "analyze_chart",
                "description": "Analyzes chart data and returns insights about trends, patterns, and key levels.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "symbol": {
                            "type": "string",
                            "description": "The trading symbol to analyze (e.g., 'BTCUSDT', 'AAPL')"
                        },
                        "timeframe": {
                            "type": "string",
                            "description": "The timeframe to analyze (e.g., '1m', '5m', '15m', '1h', '4h', '1d')"
                        },
                        "includePatterns": {
                            "type": "boolean",
                            "description": "Whether to include pattern detection in the analysis"
                        },
                        "includeSupportResistance": {
                            "type": "boolean",
                            "description": "Whether to include support and resistance levels in the analysis"
                        }
                    },
                    "required": ["symbol", "timeframe"]
                }
            },
            lambda args: self._analyze_chart_handler(args)
        )
        
        # Get current chart data function
        self.register_function(
            "get_current_chart_data",
            {
                "name": "get_current_chart_data",
                "description": "Get the current chart data and state",
                "parameters": {
                    "type": "object",
                    "properties": {}  # No parameters needed as it uses the current chart context
                }
            },
            lambda args: self._get_current_chart_data_handler(args)
        )
        
        # Get real-time price data
        self.register_function(
            "get_real_time_price",
            {
                "name": "get_real_time_price",
                "description": "Get the real-time price data for the current or specified symbol",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "symbol": {
                            "type": "string",
                            "description": "The trading symbol (e.g., 'BTCUSDT', 'AAPL'). If not provided, uses the current chart symbol."
                        }
                    }
                }
            },
            lambda args: self._get_real_time_price_handler(args)
        )
    
    def _get_financial_data_handler(self, args):
        """Handler for the get_financial_data function."""
        try:
            data = get_financial_data(args.get("symbol", "BTCUSDT"), args.get("timeframe", "1d"))
            return {
                "success": True,
                "data": data
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _add_indicator_handler(self, args):
        """Handler for the add_indicator function."""
        try:
            # Extract parameters with defaults
            indicator_type = args.get("type", "SMA")
            period = args.get("period", 20)
            color = args.get("color", "#2962FF")
            
            print(f"DEBUG: Adding indicator {indicator_type} with period {period}")
            
            # Get the symbol and timeframe from the current chart context
            symbol = "Unknown"
            timeframe = "Unknown"
            
            if hasattr(self, 'current_chart_context') and self.current_chart_context:
                symbol = self.current_chart_context.get('symbol', 'Unknown')
                timeframe = self.current_chart_context.get('timeframe', 'Unknown')
            
            # Return a command to add the indicator
            return {
                "success": True,
                "action": "add_indicator",
                "type": indicator_type,
                "period": period,
                "color": color,
                "symbol": symbol,
                "timeframe": timeframe
            }
        except Exception as e:
            print(f"Error in _add_indicator_handler: {str(e)}")
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def _analyze_chart_handler(self, args):
        """Handler for the analyze_chart function."""
        try:
            # Get the symbol from args or use the current chart context
            symbol = args.get("symbol")
            if not symbol and hasattr(self, 'current_chart_context') and self.current_chart_context:
                symbol = self.current_chart_context.get('symbol')
            
            symbol = symbol or "BTCUSDT"  # Default to BTCUSDT if no symbol provided
            
            # Get the timeframe from args or use the current chart context
            timeframe = args.get("timeframe")
            if not timeframe and hasattr(self, 'current_chart_context') and self.current_chart_context:
                timeframe = self.current_chart_context.get('timeframe')
            
            timeframe = timeframe or "1d"  # Default to 1d if no timeframe provided
            
            # Map frontend timeframe format to backend format if needed
            timeframe_mapping = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '1h',
                '4h': '4h',
                '1d': '1d'
            }
            
            backend_timeframe = timeframe_mapping.get(timeframe, timeframe)
            
            include_patterns = args.get("includePatterns", False)
            include_support_resistance = args.get("includeSupportResistance", False)
            
            print(f"DEBUG: Analyzing chart for {symbol} on {timeframe} timeframe (backend format: {backend_timeframe})")
            
            # Check if we have candles in the chart context
            has_valid_candles = False
            if (hasattr(self, 'current_chart_context') and 
                self.current_chart_context and 
                isinstance(self.current_chart_context, dict) and
                'candles' in self.current_chart_context):
                
                candles = self.current_chart_context.get('candles', [])
                if candles and isinstance(candles, list) and len(candles) > 0:
                    print(f"DEBUG: Using candles from chart context: {len(candles)} candles")
                    
                    # Validate the first candle to ensure it has the required fields
                    first_candle = candles[0]
                    if isinstance(first_candle, dict) and all(k in first_candle for k in ['time', 'open', 'high', 'low', 'close']):
                        print(f"DEBUG: First candle is valid: {first_candle}")
                        data = candles
                        has_valid_candles = True
                    else:
                        print(f"DEBUG: First candle is missing required fields: {first_candle}")
            
            if not has_valid_candles:
                # Try to get data from the financial data service
                print(f"DEBUG: Fetching financial data for {symbol} on {backend_timeframe} timeframe")
                try:
                    data = get_financial_data(symbol, backend_timeframe)
                    print(f"DEBUG: Got {len(data) if data else 0} candles from financial data service")
                    
                    if not data or len(data) == 0:
                        # If we have a current price in the context, create a minimal candle
                        if (hasattr(self, 'current_chart_context') and 
                            self.current_chart_context and 
                            isinstance(self.current_chart_context, dict) and
                            'currentPrice' in self.current_chart_context):
                            
                            current_price = self.current_chart_context['currentPrice']
                            print(f"DEBUG: Using current price from context: {current_price}")
                            
                            # Create a minimal candle with the current price
                            data = [{
                                "time": int(time.time()),
                                "open": current_price,
                                "high": current_price,
                                "low": current_price,
                                "close": current_price,
                                "volume": 0
                            }]
                        else:
                            # No data available
                            return {
                                "success": False,
                                "error": f"No data available for {symbol} on {timeframe} timeframe"
                            }
                except Exception as e:
                    print(f"DEBUG: Error fetching financial data: {str(e)}")
                    traceback.print_exc()
                    
                    # If we have a current price in the context, create a minimal candle
                    if (hasattr(self, 'current_chart_context') and 
                        self.current_chart_context and 
                        isinstance(self.current_chart_context, dict) and
                        'currentPrice' in self.current_chart_context):
                        
                        current_price = self.current_chart_context['currentPrice']
                        print(f"DEBUG: Using current price from context: {current_price}")
                        
                        # Create a minimal candle with the current price
                        data = [{
                            "time": int(time.time()),
                            "open": current_price,
                            "high": current_price,
                            "low": current_price,
                            "close": current_price,
                            "volume": 0
                        }]
                    else:
                        # No data available
                        return {
                            "success": False,
                            "error": f"Error fetching data for {symbol} on {timeframe} timeframe: {str(e)}"
                        }
            
            if not data or not isinstance(data, list) or len(data) == 0:
                return {
                    "success": False,
                    "error": f"No data available for {symbol} on {timeframe} timeframe"
                }
            
            print(f"DEBUG: Got {len(data)} candles for analysis")
            
            # Print the first and last candle for debugging
            if len(data) > 0:
                print(f"DEBUG: First candle: {data[0]}")
                print(f"DEBUG: Last candle: {data[-1]}")
            
            # Calculate basic trend
            first_close = data[0].get("close") if isinstance(data[0], dict) else None
            last_close = data[-1].get("close") if isinstance(data[-1], dict) else None
            
            if first_close is None or last_close is None:
                return {
                    "success": False,
                    "error": "Invalid candle data: missing close prices"
                }
            
            trend = "bullish" if last_close > first_close else "bearish"
            price_change = last_close - first_close
            price_change_percent = (price_change / first_close) * 100 if first_close > 0 else 0
            
            # Calculate volume average
            volume_sum = 0
            valid_volumes = 0
            
            for candle in data:
                if isinstance(candle, dict) and "volume" in candle and candle["volume"] is not None:
                    volume_sum += candle["volume"]
                    valid_volumes += 1
            
            volume_avg = volume_sum / valid_volumes if valid_volumes > 0 else 0
            
            # For now, return a simple analysis
            result = {
                "success": True,
                "symbol": symbol,
                "timeframe": timeframe,
                "trend": trend,
                "price_change": price_change,
                "price_change_percent": price_change_percent,
                "volume_avg": volume_avg,
                "current_price": last_close,
                "data_source": "chart_context" if has_valid_candles else "financial_data_service",
                "candle_count": len(data)
            }
            
            # Add additional analysis if requested
            if include_patterns:
                result["patterns"] = "Pattern detection not implemented yet"
            
            if include_support_resistance:
                result["support_resistance"] = "Support/resistance detection not implemented yet"
            
            print(f"DEBUG: Analysis result: {result}")
            return result
            
        except Exception as e:
            print(f"Error in _analyze_chart_handler: {str(e)}")
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_current_chart_data_handler(self, args):
        """Handler for the get_current_chart_data function."""
        try:
            # This function will use the chart context that was passed to process_message
            if not hasattr(self, 'current_chart_context') or not self.current_chart_context:
                return {
                    "success": False,
                    "error": "No chart context available"
                }
            
            # Validate the chart context
            if not isinstance(self.current_chart_context, dict):
                return {
                    "success": False,
                    "error": f"Chart context is not a dictionary: {type(self.current_chart_context)}"
                }
            
            # Create a safe copy of the chart context with only the essential data
            safe_context = {
                "symbol": self.current_chart_context.get("symbol", "Unknown"),
                "timeframe": self.current_chart_context.get("timeframe", "Unknown"),
            }
            
            # Add current price if available
            if "currentPrice" in self.current_chart_context:
                safe_context["currentPrice"] = self.current_chart_context["currentPrice"]
            
            # Add indicators if available and valid
            if "indicators" in self.current_chart_context and isinstance(self.current_chart_context["indicators"], list):
                safe_context["indicators"] = []
                for indicator in self.current_chart_context["indicators"]:
                    if isinstance(indicator, dict) and "type" in indicator:
                        safe_indicator = {
                            "type": indicator.get("type", "Unknown"),
                            "period": indicator.get("period")
                        }
                        safe_context["indicators"].append(safe_indicator)
            
            # Return the safe chart context
            return {
                "success": True,
                "data": safe_context
            }
        except Exception as e:
            print(f"Error in _get_current_chart_data_handler: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_real_time_price_handler(self, args):
        """Handler for the get_real_time_price function."""
        try:
            # Get the symbol from args or use the current chart context
            symbol = args.get("symbol")
            if not symbol and hasattr(self, 'current_chart_context') and self.current_chart_context:
                symbol = self.current_chart_context.get('symbol')
            
            if not symbol:
                return {
                    "success": False,
                    "error": "No symbol provided and no current chart context available"
                }
            
            # Get the latest price data
            try:
                # If we have candles in the chart context, use the last candle
                if (hasattr(self, 'current_chart_context') and 
                    self.current_chart_context and 
                    isinstance(self.current_chart_context, dict) and
                    'candles' in self.current_chart_context and 
                    self.current_chart_context['candles'] and
                    isinstance(self.current_chart_context['candles'], list)):
                    
                    candles = self.current_chart_context['candles']
                    if not candles:
                        return {
                            "success": False,
                            "error": "Candles list is empty"
                        }
                    
                    last_candle = candles[-1]
                    if not isinstance(last_candle, dict):
                        return {
                            "success": False,
                            "error": "Last candle is not a dictionary"
                        }
                    
                    # Check if we have a current price directly in the context
                    if 'currentPrice' in self.current_chart_context:
                        current_price = self.current_chart_context['currentPrice']
                        return {
                            "success": True,
                            "symbol": symbol,
                            "price": current_price,
                            "open": last_candle.get('open'),
                            "high": last_candle.get('high'),
                            "low": last_candle.get('low'),
                            "volume": last_candle.get('volume'),
                            "timestamp": last_candle.get('timestamp')
                        }
                    
                    return {
                        "success": True,
                        "symbol": symbol,
                        "price": last_candle.get('close'),
                        "open": last_candle.get('open'),
                        "high": last_candle.get('high'),
                        "low": last_candle.get('low'),
                        "volume": last_candle.get('volume'),
                        "timestamp": last_candle.get('timestamp')
                    }
                else:
                    # Otherwise, get the latest data from the financial data service
                    data = get_financial_data(symbol, "1m", limit=1)
                    if data and len(data) > 0:
                        last_data = data[-1]
                        return {
                            "success": True,
                            "symbol": symbol,
                            "price": last_data.get('close'),
                            "open": last_data.get('open'),
                            "high": last_data.get('high'),
                            "low": last_data.get('low'),
                            "volume": last_data.get('volume'),
                            "timestamp": last_data.get('timestamp')
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"No data available for symbol {symbol}"
                        }
            except Exception as e:
                print(f"Error getting price data: {str(e)}")
                return {
                    "success": False,
                    "error": f"Error getting price data: {str(e)}"
                }
        except Exception as e:
            print(f"Error in _get_real_time_price_handler: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def clear_conversation(self):
        """Clear the conversation history."""
        self.conversation = []
    
    def add_message(self, role, content, name=None, tool_call_id=None):
        """
        Add a message to the conversation history
        
        Args:
            role (str): The role of the message sender (user, assistant, system, tool)
            content (str): The content of the message
            name (str, optional): The name of the tool for tool messages
            tool_call_id (str, optional): The ID of the tool call for tool messages
        """
        message = {"role": role, "content": content}
        
        if name:
            message["name"] = name
        
        if tool_call_id:
            message["tool_call_id"] = tool_call_id
        
        self.conversation.append(message)
    
    async def process_message(self, message, system_prompt=None, context=None):
        """
        Process a message with Mistral AI and return a response
        
        Args:
            message (str): The user's message
            system_prompt (str, optional): The system prompt to use
            context (dict, optional): Additional context for the message
            
        Returns:
            dict: Response containing text and/or commands
        """
        try:
            # Check if Mistral API key is set
            if not MISTRAL_API_KEY:
                return {
                    "text": "Mistral API key is not configured. Please set MISTRAL_API_KEY in your environment.",
                    "commands": []
                }
            
            # Store the chart context for use by functions
            print(f"DEBUG: Storing chart context: {type(context)}")
            if context is not None:
                print(f"DEBUG: Context keys: {list(context.keys()) if isinstance(context, dict) and hasattr(context, 'keys') else 'No keys method'}")
                self.current_chart_context = context
            else:
                print("DEBUG: Context is None")
                self.current_chart_context = {}
            
            # Clear conversation if it's empty (new conversation)
            if not self.conversation:
                # Add system message if provided
                if system_prompt:
                    self.add_message("system", system_prompt)
            
            # Format the message with chart context if available
            formatted_message = message
            if context:
                try:
                    # Create a formatted message that includes chart context
                    symbol = context.get('symbol', 'Unknown')
                    timeframe = context.get('timeframe', 'Unknown')
                    
                    print(f"DEBUG: Symbol: {symbol}, Timeframe: {timeframe}")
                    
                    # Debug indicators
                    print(f"DEBUG: Context keys: {list(context.keys()) if isinstance(context, dict) and hasattr(context, 'keys') else 'No keys method'}")
                    
                    # Safely get indicators with detailed error handling
                    indicators = []
                    try:
                        if 'indicators' in context:
                            indicators_value = context['indicators']
                            print(f"DEBUG: Indicators type: {type(indicators_value)}")
                            
                            if indicators_value is None:
                                print("DEBUG: Indicators is None")
                                indicators = []
                            elif isinstance(indicators_value, list):
                                print(f"DEBUG: Indicators list length: {len(indicators_value)}")
                                indicators = indicators_value
                                
                                # Debug each indicator
                                for i, ind in enumerate(indicators_value):
                                    print(f"DEBUG: Indicator {i} type: {type(ind)}")
                                    if isinstance(ind, dict):
                                        print(f"DEBUG: Indicator {i} keys: {list(ind.keys())}")
                                    else:
                                        print(f"DEBUG: Indicator {i} is not a dict")
                            else:
                                print(f"DEBUG: Indicators is not a list: {type(indicators_value)}")
                                indicators = []
                        else:
                            print("DEBUG: No indicators key in context")
                    except Exception as e:
                        print(f"DEBUG: Error accessing indicators: {str(e)}")
                        traceback.print_exc()
                        indicators = []
                    
                    # Format indicators for the prompt with better error handling
                    indicators_text = ""
                    if indicators and isinstance(indicators, list):
                        indicators_text = "Active indicators:\n"
                        for i, indicator in enumerate(indicators):
                            try:
                                print(f"DEBUG: Processing indicator {i}: {type(indicator)}")
                                
                                if not isinstance(indicator, dict):
                                    print(f"DEBUG: Indicator {i} is not a dict: {type(indicator)}")
                                    continue  # Skip non-dict indicators
                                
                                print(f"DEBUG: Indicator {i} keys: {list(indicator.keys())}")
                                
                                if 'type' not in indicator:
                                    print(f"DEBUG: Indicator {i} has no 'type' key. Keys: {list(indicator.keys())}")
                                    continue
                                    
                                indicator_type = indicator.get('type', 'Unknown')
                                period = indicator.get('period', 'Unknown')
                                
                                print(f"DEBUG: Indicator {i} type: {indicator_type}, period: {period}")
                                
                                if indicator_type == 'SMA':
                                    indicators_text += f"- Simple Moving Average (SMA) with period {period}\n"
                                elif indicator_type == 'EMA':
                                    indicators_text += f"- Exponential Moving Average (EMA) with period {period}\n"
                                elif indicator_type == 'RSI':
                                    indicators_text += f"- Relative Strength Index (RSI) with period {period}\n"
                                else:
                                    indicators_text += f"- {indicator_type}\n"
                            except Exception as e:
                                print(f"DEBUG: Error processing indicator {i}: {str(e)}")
                                traceback.print_exc()
                    
                    # Add current price if available
                    current_price_text = ""
                    if 'currentPrice' in context:
                        current_price_text = f"Current price: {context['currentPrice']}\n"
                    
                    # Create the formatted message
                    formatted_message = f"""
Analyzing financial chart data:
- Symbol: {symbol}
- Timeframe: {timeframe}
{current_price_text}
{indicators_text}

User Message: {message}

Please respond to the user's message and provide any necessary chart commands.
"""
                    print(f"Formatted message with chart context: {formatted_message}")
                except Exception as e:
                    print(f"Error formatting message with chart context: {str(e)}")
                    print(f"Error traceback: {traceback.format_exc()}")
                    # Fall back to the original message if there's an error
                    formatted_message = message
            
            # Add user message
            self.add_message("user", formatted_message)
            
            # Prepare the tools array for Mistral
            tools = [
                {
                    "type": "function",
                    "function": func
                } for func in self.available_functions.values()
            ]
            
            print("DEBUG: Sending request to Mistral API")
            
            # Step 2: Model generates function arguments with retry logic
            request_data = {
                "model": "mistral-small-latest",  # Use a model that supports function calling
                "messages": self.conversation,
                "tools": tools,
                "tool_choice": "auto",  # Let the model decide whether to use tools
                "max_tokens": 1024
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {MISTRAL_API_KEY}'
            }
            
            response = make_api_request_with_retry(
                MISTRAL_API_ENDPOINT,
                headers,
                request_data
            )
            
            # Check if the request was successful
            if not response.ok:
                raise Exception(f"API error: {response.status_code} - {response.text}")
            
            # Parse the response
            data = response.json()
            assistant_response = data["choices"][0]["message"]
            
            print(f"DEBUG: Received response from Mistral API: {assistant_response.get('content', '')[:100]}...")
            
            # Add the assistant response to the conversation
            self.conversation.append(assistant_response)
            
            # Check if there are tool calls in the response
            if "tool_calls" in assistant_response and assistant_response["tool_calls"]:
                print(f"DEBUG: Tool calls detected: {len(assistant_response['tool_calls'])}")
                
                # Step 3: Execute functions to obtain tool results
                commands = []
                
                for tool_call in assistant_response["tool_calls"]:
                    print(f"DEBUG: Tool call structure: {tool_call.keys()}")
                    
                    # Check if the tool call has the expected structure
                    if "function" in tool_call:
                        function_name = tool_call["function"].get("name")
                        
                        if not function_name:
                            print(f"DEBUG: Missing function name in tool call: {tool_call}")
                            continue
                        
                        print(f"DEBUG: Processing tool call for function: {function_name}")
                        
                        try:
                            function_args = json.loads(tool_call["function"].get("arguments", "{}"))
                            print(f"DEBUG: Function arguments: {function_args}")
                        except Exception as e:
                            print(f"DEBUG: Error parsing function arguments: {str(e)}")
                            print(f"DEBUG: Raw arguments: {tool_call['function'].get('arguments', 'None')}")
                            function_args = {}
                        
                        # Execute the function if we have a handler for it
                        if function_name in self.function_handlers:
                            try:
                                print(f"DEBUG: Executing function handler for {function_name}")
                                result = self.function_handlers[function_name](function_args)
                                print(f"DEBUG: Function result: {result}")
                                
                                # Add the result to commands if successful
                                if result.get("success"):
                                    commands.append(result)
                                
                                # Add the tool response to the conversation
                                self.add_message(
                                    "tool", 
                                    json.dumps(result), 
                                    function_name, 
                                    tool_call.get("id", "unknown_id")
                                )
                            except Exception as e:
                                print(f"DEBUG: Error executing function {function_name}: {str(e)}")
                                traceback.print_exc()
                                
                                # Add error response
                                error_result = {
                                    "success": False,
                                    "error": f"Error executing function {function_name}: {str(e)}"
                                }
                                
                                self.add_message(
                                    "tool", 
                                    json.dumps(error_result), 
                                    function_name, 
                                    tool_call.get("id", "unknown_id")
                                )
                        else:
                            # Function not implemented
                            print(f"DEBUG: Function {function_name} not implemented")
                            error_result = {
                                "success": False,
                                "error": f"Function {function_name} not implemented"
                            }
                            
                            self.add_message(
                                "tool", 
                                json.dumps(error_result), 
                                function_name, 
                                tool_call.get("id", "unknown_id")
                            )
                    else:
                        print(f"DEBUG: Invalid tool call structure: {tool_call}")
                        continue
                
                print("DEBUG: Sending final request to Mistral API")
                
                # Step 4: Model generates final answer with retry logic
                final_request_data = {
                    "model": "mistral-small-latest",
                    "messages": self.conversation,
                    "max_tokens": 1024
                }
                
                final_response = make_api_request_with_retry(
                    MISTRAL_API_ENDPOINT,
                    headers,
                    final_request_data
                )
                
                if not final_response.ok:
                    # If we still get an error after retries, handle it gracefully
                    if final_response.status_code == 429:
                        print("Rate limit exceeded even after retries. Returning partial response.")
                        return {
                            "text": "I've processed your request, but I'm currently experiencing high demand. Here's what I found so far.",
                            "commands": commands
                        }
                    else:
                        raise Exception(f"API error in final response: {final_response.status_code} - {final_response.text}")
                
                final_data = final_response.json()
                final_assistant_response = final_data["choices"][0]["message"]["content"]
                
                print(f"DEBUG: Received final response: {final_assistant_response[:100]}...")
                
                # Add the final response to the conversation
                self.add_message("assistant", final_assistant_response)
                
                return {
                    "text": final_assistant_response,
                    "commands": commands
                }
            else:
                # No tool calls, just return the response
                return {
                    "text": assistant_response["content"],
                    "commands": []
                }
        
        except Exception as e:
            print(f"Error in AI service: {str(e)}")
            traceback.print_exc()
            return {
                "text": f"Sorry, I encountered an error processing your request: {str(e)}",
                "commands": []
            }

# Create a singleton instance
unified_ai_service = UnifiedAIService()
unified_ai_service.register_default_functions() 