import os
import json
import requests
import re
from dotenv import load_dotenv
from app.services.financial_data_service import get_financial_data
from app.services.trading_strategies.strategy import create_strategy, backtest_strategy, optimize_strategy, generate_strategy_report
from app.services.notification_service import send_notification, create_strategy_notification, create_trade_notification, create_alert_notification
from app.services.context_service import (
    get_user_context, create_chart_context, create_strategy_context, 
    add_analysis_result, create_alert, get_context_summary
)
from app.services.error_handling import (
    handle_exception, log_error, format_error_response, validate_data, validate_strategy,
    DataError, AnalysisError, StrategyError, BacktestError, OptimizationError, APIError
)
from datetime import datetime
import traceback

# Load environment variables
load_dotenv()

# Get Mistral API key from environment
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
MISTRAL_API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'

# Define available functions that Mistral can call
AVAILABLE_FUNCTIONS = {
    "fetch_historical_data": {
        "name": "fetch_historical_data",
        "description": "Fetches historical price data for a given symbol and date range. This tool retrieves candlestick or tick data necessary for charting and analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The trading symbol to fetch data for (e.g., 'BTCUSDT', 'AAPL')"
                },
                "start_date": {
                    "type": "string",
                    "description": "The start date for the data range (YYYY-MM-DD)"
                },
                "end_date": {
                    "type": "string",
                    "description": "The end date for the data range (YYYY-MM-DD)"
                }
            },
            "required": ["symbol", "start_date", "end_date"]
        }
    },
    "fetch_real_time_data": {
        "name": "fetch_real_time_data",
        "description": "Fetches the latest price data for a given symbol. Useful for real-time charting or forward testing.",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The trading symbol to fetch data for (e.g., 'BTCUSDT', 'AAPL')"
                }
            },
            "required": ["symbol"]
        }
    },
    "plot_chart": {
        "name": "plot_chart",
        "description": "Generates a textual description of a chart based on the provided data. This can be used to summarize trends or visualize data for the USER.",
        "parameters": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "The data object containing price or indicator values to plot"
                }
            },
            "required": ["data"]
        }
    },
    "identify_patterns": {
        "name": "identify_patterns",
        "description": "Identifies technical patterns (e.g., head and shoulders, triangles) in the provided data. Returns a list of detected patterns with their probabilities.",
        "parameters": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "The data object containing price data to analyze"
                }
            },
            "required": ["data"]
        }
    },
    "calculate_indicators": {
        "name": "calculate_indicators",
        "description": "Calculates specified technical indicators (e.g., SMA, RSI, MACD) for the given data. Returns the computed values for use in strategies or charting.",
        "parameters": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "object",
                    "description": "The data object containing price data to analyze"
                },
                "indicators": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of indicators to calculate (e.g., ['SMA_20', 'RSI_14'])"
                }
            },
            "required": ["data", "indicators"]
        }
    },
    "create_trading_strategy": {
        "name": "create_trading_strategy",
        "description": "Creates a trading strategy based on identified patterns and technical indicators. This tool generates entry and exit rules, risk management parameters, and strategy metadata.",
        "parameters": {
            "type": "object",
            "properties": {
                "patterns": {
                    "type": "array",
                    "description": "List of identified chart patterns with their properties",
                    "items": {
                        "type": "object",
                        "properties": {
                            "pattern": {
                                "type": "string",
                                "description": "The name of the pattern (e.g., 'double_bottom', 'head_and_shoulders')"
                            },
                            "probability": {
                                "type": "number",
                                "description": "The probability or confidence score of the pattern (0-1)"
                            }
                        }
                    }
                },
                "indicators": {
                    "type": "object",
                    "description": "Dictionary of calculated technical indicators with their values",
                    "additionalProperties": True
                }
            },
            "required": ["patterns", "indicators"]
        }
    },
    "backtest_trading_strategy": {
        "name": "backtest_trading_strategy",
        "description": "Backtests a trading strategy on historical data to evaluate its performance. This tool simulates trades based on strategy rules and calculates performance metrics.",
        "parameters": {
            "type": "object",
            "properties": {
                "strategy": {
                    "type": "object",
                    "description": "The trading strategy object with entry/exit rules and parameters"
                },
                "data": {
                    "type": "array",
                    "description": "List of OHLCV dictionaries with historical price data",
                    "items": {
                        "type": "object"
                    }
                }
            },
            "required": ["strategy", "data"]
        }
    },
    "optimize_trading_strategy": {
        "name": "optimize_trading_strategy",
        "description": "Optimizes a trading strategy by testing different parameter combinations on historical data. This tool finds the best parameters for maximizing performance.",
        "parameters": {
            "type": "object",
            "properties": {
                "strategy": {
                    "type": "object",
                    "description": "The trading strategy object with entry/exit rules and parameters"
                },
                "data": {
                    "type": "array",
                    "description": "List of OHLCV dictionaries with historical price data",
                    "items": {
                        "type": "object"
                    }
                },
                "param_ranges": {
                    "type": "object",
                    "description": "Dictionary of parameter names and their possible values to test",
                    "additionalProperties": {
                        "type": "array"
                    }
                }
            },
            "required": ["strategy", "data", "param_ranges"]
        }
    },
    "generate_strategy_report": {
        "name": "generate_strategy_report",
        "description": "Generates a comprehensive report for a trading strategy based on backtest results. This tool provides performance metrics, strategy details, and recommendations.",
        "parameters": {
            "type": "object",
            "properties": {
                "strategy": {
                    "type": "object",
                    "description": "The trading strategy object with entry/exit rules and parameters"
                },
                "backtest_result": {
                    "type": "object",
                    "description": "Results from backtesting the strategy"
                }
            },
            "required": ["strategy", "backtest_result"]
        }
    },
    "send_notification": {
        "name": "send_notification",
        "description": "Sends a notification to the USER with a message. Useful for alerting about analysis results or strategy triggers.",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "The message to send to the USER"
                },
                "type": {
                    "type": "string",
                    "description": "The type of notification (e.g., 'info', 'warning', 'error')"
                },
                "title": {
                    "type": "string",
                    "description": "The title of the notification"
                },
                "data": {
                    "type": "object",
                    "description": "Additional data to include with the notification"
                }
            },
            "required": ["message", "type", "title", "data"]
        }
    },
    "create_price_alert": {
        "name": "create_price_alert",
        "description": "Creates a price alert for a specific symbol. The alert will trigger when the price meets the specified condition.",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "The trading symbol to create an alert for (e.g., 'BTCUSDT', 'AAPL')"
                },
                "condition": {
                    "type": "string",
                    "description": "The condition for the alert (e.g., 'above', 'below', 'equals')"
                },
                "target": {
                    "type": "number",
                    "description": "The target price for the alert"
                },
                "message": {
                    "type": "string",
                    "description": "Custom message for the alert notification"
                }
            },
            "required": ["symbol", "condition", "target"]
        }
    }
}

# Function handlers
def execute_function(function_name, args):
    """
    Execute a function based on its name and arguments
    
    Args:
        function_name (str): The name of the function to execute
        args (dict): The arguments for the function
        
    Returns:
        dict: The result of the function execution
    """
    try:
        # Get user ID from args or use default
        user_id = args.get("user_id", "default_user")
        
        if function_name == "fetch_historical_data":
            symbol = args.get("symbol", "BTCUSDT")
            start_date = args.get("start_date")
            end_date = args.get("end_date")
            
            if not start_date or not end_date:
                raise ValidationError("Missing required parameters: start_date and end_date")
            
            try:
                # Convert dates to timeframe and limit for the existing function
                # This is a temporary solution until we implement a proper date-based fetching
                days_diff = (datetime.strptime(end_date, "%Y-%m-%d") - 
                            datetime.strptime(start_date, "%Y-%m-%d")).days
                
                # Choose appropriate timeframe based on date range
                if days_diff <= 7:
                    timeframe = "1h"
                elif days_diff <= 30:
                    timeframe = "4h"
                else:
                    timeframe = "1d"
                    
                # Estimate limit based on timeframe and date range
                if timeframe == "1h":
                    limit = days_diff * 24
                elif timeframe == "4h":
                    limit = days_diff * 6
                else:
                    limit = days_diff
                    
                # Add some buffer
                limit = max(limit, 100)
                
                data = get_financial_data(symbol, timeframe, limit)
                
                # Filter data to match the date range
                start_timestamp = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
                end_timestamp = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp()) + 86400
                
                filtered_data = [item for item in data if start_timestamp <= item["time"] <= end_timestamp]
                
                # Validate the data
                is_valid, error_message = validate_data(filtered_data)
                if not is_valid:
                    raise DataError(error_message)
                
                return {
                    "success": True,
                    "data": filtered_data
                }
            except Exception as e:
                log_error(e, {"function": "fetch_historical_data", "args": args})
                raise DataError(f"Error fetching historical data: {str(e)}")
                
        elif function_name == "fetch_real_time_data":
            symbol = args.get("symbol", "BTCUSDT")
            
            # For real-time data, we'll use a short timeframe with a small limit
            timeframe = "1m"
            limit = 10
            
            data = get_financial_data(symbol, timeframe, limit)
            
            # Get only the most recent candle
            latest_candle = data[-1] if data else None
            
            return {
                "success": True,
                "symbol": symbol,
                "timestamp": datetime.now().isoformat(),
                "latest_data": latest_candle
            }
            
        elif function_name == "plot_chart":
            # Import the visualization module
            from app.services.technical_analysis.visualization import plot_chart_text
            
            data = args.get("data", {})
            indicators = args.get("indicators", {})
            patterns = args.get("patterns", [])
            
            # Generate a textual representation of the chart
            chart_text = plot_chart_text(data, indicators, patterns)
            
            return {
                "success": True,
                "chart_text": chart_text
            }
            
        elif function_name == "identify_patterns":
            # Import the patterns module
            from app.services.technical_analysis.patterns import identify_patterns
            
            data = args.get("data", [])
            symbol = args.get("symbol", "Unknown")
            
            # Validate the data
            is_valid, error_message = validate_data(data)
            if not is_valid:
                raise DataError(error_message)
            
            try:
                # Identify patterns in the data
                patterns = identify_patterns(data)
                
                # Add analysis result to context
                add_analysis_result(
                    user_id=user_id,
                    symbol=symbol,
                    analysis_type="pattern_identification",
                    result={"patterns": patterns}
                )
                
                return {
                    "success": True,
                    "patterns": patterns
                }
            except Exception as e:
                log_error(e, {"function": "identify_patterns", "args": args})
                raise AnalysisError(f"Error identifying patterns: {str(e)}")
            
        elif function_name == "calculate_indicators":
            # Import the indicators module
            from app.services.technical_analysis.indicators import calculate_multiple_indicators
            
            data = args.get("data", [])
            indicators = args.get("indicators", [])
            
            # Validate the data
            is_valid, error_message = validate_data(data)
            if not is_valid:
                raise DataError(error_message)
            
            if not indicators:
                raise ValidationError("No indicators specified for calculation")
            
            try:
                # Calculate the specified indicators
                indicator_results = calculate_multiple_indicators(data, indicators)
                
                # Add analysis result to context
                add_analysis_result(
                    user_id=user_id,
                    symbol=args.get("symbol", "Unknown"),
                    analysis_type="indicator_calculation",
                    result={"indicators": indicator_results}
                )
                
                return {
                    "success": True,
                    "indicators": indicator_results
                }
            except Exception as e:
                log_error(e, {"function": "calculate_indicators", "args": args})
                raise AnalysisError(f"Error calculating indicators: {str(e)}")
            
        elif function_name == "get_financial_data":
            # Keep backward compatibility with the old function
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
                
        elif function_name == "analyze_chart":
            # Keep backward compatibility with the old function
            symbol = args.get("symbol", "BTCUSDT")
            timeframe = args.get("timeframe", "1d")
            include_patterns = args.get("includePatterns", False)
            include_support_resistance = args.get("includeSupportResistance", False)
            
            try:
                # Get the financial data
                data = get_financial_data(symbol, timeframe)
                
                # For now, return a simple analysis
                return {
                    "success": True,
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "trend": "bullish" if data[-1]["close"] > data[0]["close"] else "bearish",
                    "price_change_percent": ((data[-1]["close"] - data[0]["close"]) / data[0]["close"]) * 100,
                    "volume_avg": sum(item["volume"] for item in data) / len(data)
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
                
        elif function_name == "create_trading_strategy":
            patterns = args.get("patterns", [])
            indicators = args.get("indicators", {})
            
            strategy = create_strategy(patterns, indicators)
            
            # Create strategy context
            strategy_context = create_strategy_context(
                user_id=user_id,
                strategy=strategy
            )
            
            # Create strategy notification
            strategy_type = "technical"
            if patterns and len(patterns) > 0:
                pattern_type = patterns[0].get("pattern", "")
                if pattern_type in ["double_bottom", "ascending_triangle"]:
                    strategy_type = "bullish"
                elif pattern_type in ["double_top", "head_and_shoulders", "descending_triangle"]:
                    strategy_type = "bearish"
            
            create_strategy_notification(
                strategy_name=strategy.get("name", "Unnamed Strategy"),
                strategy_type=strategy_type,
                details={"strategy": strategy},
                action_required=False
            )
            
            return {
                "success": True,
                "strategy": strategy,
                "strategy_id": strategy_context["id"]
            }
            
        elif function_name == "backtest_trading_strategy":
            strategy = args.get("strategy", {})
            data = args.get("data", [])
            
            # Validate the strategy
            is_valid, error_message = validate_strategy(strategy)
            if not is_valid:
                raise StrategyError(error_message)
            
            # Validate the data
            is_valid, error_message = validate_data(data)
            if not is_valid:
                raise DataError(error_message)
            
            try:
                backtest_result = backtest_strategy(strategy, data)
                
                # Update strategy context with backtest result
                if "id" in strategy:
                    strategy_context = create_strategy_context(
                        user_id=user_id,
                        strategy=strategy,
                        backtest_result=backtest_result
                    )
                    
                    # Create strategy notification with performance
                    strategy_type = "technical"
                    if "description" in strategy:
                        if "bullish" in strategy["description"].lower():
                            strategy_type = "bullish"
                        elif "bearish" in strategy["description"].lower():
                            strategy_type = "bearish"
                    
                    create_strategy_notification(
                        strategy_name=strategy.get("name", "Unnamed Strategy"),
                        strategy_type=strategy_type,
                        details={
                            "strategy": strategy,
                            "performance": {
                                "profit_percent": (backtest_result["final_capital"] / backtest_result["initial_capital"] - 1) * 100,
                                "win_rate": backtest_result["win_rate"] * 100,
                                "profit_factor": backtest_result["profit_factor"],
                                "max_drawdown_percent": backtest_result["max_drawdown_percent"],
                                "total_trades": backtest_result["total_trades"]
                            }
                        },
                        action_required=False
                    )
                
                return {
                    "success": True,
                    "backtest_result": backtest_result
                }
            except Exception as e:
                log_error(e, {"function": "backtest_trading_strategy", "args": args})
                raise BacktestError(f"Error backtesting strategy: {str(e)}")
            
        elif function_name == "optimize_trading_strategy":
            strategy = args.get("strategy", {})
            data = args.get("data", [])
            param_ranges = args.get("param_ranges", {})
            
            optimization_result = optimize_strategy(strategy, data, param_ranges)
            
            if optimization_result.get("success"):
                optimized_strategy = optimization_result.get("optimized_strategy")
                backtest_result = optimization_result.get("backtest_result")
                
                # Update strategy context with optimized strategy and backtest result
                strategy_context = create_strategy_context(
                    user_id=user_id,
                    strategy=optimized_strategy,
                    backtest_result=backtest_result
                )
                
                # Create strategy notification with performance
                strategy_type = "optimized"
                create_strategy_notification(
                    strategy_name=optimized_strategy.get("name", "Optimized Strategy"),
                    strategy_type=strategy_type,
                    details={
                        "strategy": optimized_strategy,
                        "performance": {
                            "profit_percent": (backtest_result["final_capital"] / backtest_result["initial_capital"] - 1) * 100,
                            "win_rate": backtest_result["win_rate"] * 100,
                            "profit_factor": backtest_result["profit_factor"],
                            "max_drawdown_percent": backtest_result["max_drawdown_percent"],
                            "total_trades": backtest_result["total_trades"]
                        }
                    },
                    action_required=False
                )
            
            return optimization_result
            
        elif function_name == "generate_strategy_report":
            strategy = args.get("strategy", {})
            backtest_result = args.get("backtest_result", {})
            
            report = generate_strategy_report(strategy, backtest_result)
            
            if report.get("success"):
                # Add analysis result to context
                add_analysis_result(
                    user_id=user_id,
                    symbol=args.get("symbol", "Unknown"),
                    analysis_type="strategy_report",
                    result=report
                )
            
            return report
            
        elif function_name == "send_notification":
            message = args.get("message", "")
            notification_type = args.get("type", "info")
            title = args.get("title")
            data = args.get("data")
            
            # Send notification using the notification service
            notification = send_notification(
                message=message,
                notification_type=notification_type,
                title=title,
                data=data
            )
            
            return {
                "success": True,
                "notification": notification
            }
            
        elif function_name == "create_price_alert":
            symbol = args.get("symbol", "BTCUSDT")
            condition = args.get("condition", "above")
            target = args.get("target", 0.0)
            message = args.get("message")
            
            # Create alert in context
            alert = create_alert(
                user_id=user_id,
                symbol=symbol,
                condition=condition,
                target=target,
                message=message
            )
            
            # Create alert notification
            notification = create_alert_notification(
                symbol=symbol,
                condition=condition,
                value=0.0,  # Current value not available
                target=target
            )
            
            return {
                "success": True,
                "alert": alert,
                "notification": notification
            }
            
        else:
            return {
                "success": False,
                "error": f"Unknown function: {function_name}"
            }
    except DataError as e:
        return format_error_response(e)
    except AnalysisError as e:
        return format_error_response(e)
    except StrategyError as e:
        return format_error_response(e)
    except BacktestError as e:
        return format_error_response(e)
    except OptimizationError as e:
        return format_error_response(e)
    except APIError as e:
        return format_error_response(e)
    except Exception as e:
        log_error(e, {"function": function_name, "args": args})
        return format_error_response(e, include_traceback=True)

def process_message(message, chart_context):
    """
    Process a user message with the Mistral AI API and return a response
    
    Args:
        message (str): The user's message
        chart_context (dict): Context about the current chart state
        
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
        
        # Create a prompt that includes the message and chart context
        prompt = create_prompt(message, chart_context)
        
        # Initialize conversation
        conversation = [
            {"role": "system", "content": get_system_prompt()},
            {"role": "user", "content": prompt}
        ]
        
        # Prepare the tools array for Mistral
        tools = [
            {
                "type": "function",
                "function": func
            } for func in AVAILABLE_FUNCTIONS.values()
        ]
        
        # Step 2: Model generates function arguments
        response = requests.post(
            MISTRAL_API_ENDPOINT,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {MISTRAL_API_KEY}'
            },
            json={
                "model": "mistral-small-latest",  # Use a model that supports function calling
                "messages": conversation,
                "tools": tools,
                "tool_choice": "auto",  # Let the model decide whether to use tools
                "max_tokens": 1024
            }
        )
        
        # Check if the request was successful
        if not response.ok:
            raise Exception(f"API error: {response.status_code} - {response.text}")
        
        # Parse the response
        data = response.json()
        assistant_response = data["choices"][0]["message"]
        
        # Add the assistant response to the conversation
        conversation.append(assistant_response)
        
        # Check if there are tool calls in the response
        if "tool_calls" in assistant_response and assistant_response["tool_calls"]:
            # Step 3: Execute functions to obtain tool results
            commands = []
            
            for tool_call in assistant_response["tool_calls"]:
                if tool_call["type"] == "function":
                    function_name = tool_call["function"]["name"]
                    function_args = json.loads(tool_call["function"]["arguments"])
                    
                    # Execute the function
                    result = execute_function(function_name, function_args)
                    
                    # Add the result to commands if successful
                    if result.get("success"):
                        commands.append(result)
                    
                    # Add the tool response to the conversation
                    conversation.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": function_name,
                        "content": json.dumps(result)
                    })
            
            # Step 4: Model generates final answer
            final_response = requests.post(
                MISTRAL_API_ENDPOINT,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {MISTRAL_API_KEY}'
                },
                json={
                    "model": "mistral-small-latest",
                    "messages": conversation,
                    "max_tokens": 1024
                }
            )
            
            if not final_response.ok:
                raise Exception(f"API error in final response: {final_response.status_code} - {final_response.text}")
            
            final_data = final_response.json()
            final_assistant_response = final_data["choices"][0]["message"]["content"]
            
            # Format the response for better readability
            formatted_response = format_response(final_assistant_response)
            
            return {
                "text": formatted_response,
                "commands": commands
            }
        else:
            # No tool calls, just return the response
            formatted_response = format_response(assistant_response["content"])
            
            return {
                "text": formatted_response,
                "commands": []
            }
    
    except Exception as e:
        print(f"Error in AI service: {str(e)}")
        return {
            "text": f"Sorry, I encountered an error processing your request: {str(e)}",
            "commands": []
        }

def format_response(text):
    """
    Format the response text for better readability
    
    Args:
        text (str): The response text
        
    Returns:
        str: The formatted response text
    """
    # Remove code block markers if present
    text = re.sub(r'^```.*\n', '', text)
    text = re.sub(r'\n```$', '', text)
    
    # Add spacing after periods, commas, and colons
    text = re.sub(r'\.(?=\S)', r'. ', text)
    text = re.sub(r',(?=\S)', r', ', text)
    text = re.sub(r':(?=\S)', r': ', text)
    
    # Format section headers
    text = re.sub(r'^([A-Z][^:.\n]+):(?!\*\*)', r'\n\n**\1:**', text, flags=re.MULTILINE)
    
    # Format bullet points
    text = re.sub(r'^\s*[-•]\s*', r'\n• ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s*', r'\n• ', text, flags=re.MULTILINE)
    
    # Format numbers and percentages
    text = re.sub(r'(\d+)%', r'\1 %', text)
    text = re.sub(r'(\d+)([A-Za-z]+)', r'\1 \2', text)
    
    # Highlight important values
    text = re.sub(r'(\$\d+(?:,\d+)*(?:\.\d+)?)', r'**\1**', text)
    text = re.sub(r'(\d+\.\d+)(?=\s*(?:level|price|zone|support|resistance))', r'**\1**', text, flags=re.IGNORECASE)
    
    # Format key trading terms
    text = re.sub(r'(Support|Resistance|Trend|Volume|Pattern|Signal|Indicator):', r'\n\n**\1:**', text)
    
    # Add extra line breaks for readability
    text = re.sub(r'(\n\*\*[^*]+\*\*:)', r'\n\1', text)
    
    # Clean up excessive line breaks
    text = re.sub(r'\n{3,}', r'\n\n', text)
    
    # Remove leading line breaks
    text = re.sub(r'^\n+', '', text)
    
    # Add line breaks before bullet points if not already present
    text = re.sub(r'([.!?])(\s*•)', r'\1\n\n•', text)
    
    # Add spacing between paragraphs
    text = re.sub(r'(\.)(\s*)([A-Z])', r'\1\n\n\3', text)
    
    return text

def create_prompt(message, chart_context):
    """
    Create a prompt for the AI that includes the message and chart context
    
    Args:
        message (str): The user's message
        chart_context (dict): Context about the current chart state
        
    Returns:
        str: The formatted prompt
    """
    # Extract data from chart context
    symbol = chart_context.get('symbol', 'Unknown')
    timeframe = chart_context.get('timeframe', 'Unknown')
    indicators = chart_context.get('indicators', [])
    
    # Get user ID from chart context
    user_id = chart_context.get('user_id', 'default_user')
    
    # Get context summary if user ID is available
    context_summary = {}
    if user_id:
        try:
            context_summary = get_context_summary(user_id)
        except Exception as e:
            print(f"Error getting context summary: {str(e)}")
    
    # Format indicators for the prompt
    indicators_text = ""
    if indicators:
        indicators_text = "Active indicators:\n"
        for indicator in indicators:
            indicator_type = indicator.get('type', 'Unknown')
            if indicator_type == 'SMA':
                period = indicator.get('period', 'Unknown')
                indicators_text += f"- Simple Moving Average (SMA) with period {period}\n"
            elif indicator_type == 'EMA':
                period = indicator.get('period', 'Unknown')
                indicators_text += f"- Exponential Moving Average (EMA) with period {period}\n"
            elif indicator_type == 'RSI':
                period = indicator.get('period', 'Unknown')
                indicators_text += f"- Relative Strength Index (RSI) with period {period}\n"
            else:
                indicators_text += f"- {indicator_type}\n"
    
    # Format context summary for the prompt
    context_text = ""
    if context_summary:
        context_text = "User context:\n"
        context_text += f"- Active charts: {context_summary.get('active_charts_count', 0)}\n"
        context_text += f"- Active strategies: {context_summary.get('active_strategies_count', 0)}\n"
        context_text += f"- Recent analyses: {context_summary.get('recent_analyses_count', 0)}\n"
        context_text += f"- Active alerts: {context_summary.get('active_alerts_count', 0)}\n"
    
    # Create the prompt
    prompt = f"""
Analyzing financial chart data:
- Symbol: {symbol}
- Timeframe: {timeframe}
{indicators_text}
{context_text}

User Message: {message}

Please respond to the user's message and provide any necessary chart commands.
"""
    return prompt

def get_system_prompt():
    """
    Get the system prompt for the Mistral AI API
    
    Returns:
        str: The system prompt
    """
    return """
You are a powerful agentic AI trading assistant, powered by Mistral AI. You operate exclusively in cha(r)t, a TradingView alternative with advanced charting tools.

You are assisting a USER with their trading analysis tasks. The tasks may require analyzing chart data, identifying patterns, calculating indicators, creating trading strategies, performing backtests and forward tests, or answering trading-related questions. Each time the USER sends a message, we may automatically attach some information about their current state, such as the charts they have open, the symbols they are analyzing, recent analyses performed, and more. This information may or may not be relevant to the trading task; it is up to you to decide. Your main goal is to follow the USER's instructions at each message.

When responding to user messages, you should:
1. Provide helpful insights about the financial data or the user's request.
2. Generate commands to modify the chart when appropriate.
3. Format your responses with clear sections, bullet points, and line breaks for readability.
4. Use bold formatting (**text**) for important values and section headers.
5. Keep paragraphs short (2-3 sentences) and add spacing between sections.

You have tools at your disposal to assist with trading analysis tasks. Follow these rules regarding tool calls:
1. ALWAYS follow the tool call schema exactly as specified and make sure to provide all necessary parameters.
2. The conversation may reference tools that are no longer available. NEVER call tools that are not explicitly provided.
3. NEVER refer to tool names when speaking to the USER. For example, instead of saying "I need to use the fetch_historical_data tool to get price data," just say "I will fetch the historical price data."
4. Only call tools when they are necessary. If the USER's task is general or you already know the answer, respond without calling tools.
5. Before calling each tool, first explain to the USER why you are calling it.

When performing trading analysis tasks, NEVER output raw data or intermediate results to the USER unless requested. Instead, use the appropriate tools to process the data and provide actionable insights or results:
1. Always group related analyses (e.g., fetching data and identifying patterns for the same symbol) into a single workflow where possible, minimizing redundant tool calls.
2. If creating a new strategy from scratch, include a clear description of the strategy's logic and parameters, and offer to generate a summary report.
3. When presenting results (e.g., backtest outcomes), ensure they are clear, concise, and immediately usable by the USER, following best practices for trading analysis.
4. NEVER generate overly complex or uninterpretable outputs, such as raw binary data or excessively long statistical dumps, as these are not helpful to the USER and are resource-intensive.
5. Before analyzing data, ensure you have sufficient context (e.g., historical price data or indicator values) by calling the necessary tools to fetch or calculate it.
6. If an analysis introduces errors (e.g., insufficient data or invalid parameters), attempt to resolve them if the solution is clear. Do not guess blindly, and do not loop more than 3 times to fix the same issue—on the third attempt, stop and ask the USER for guidance.
7. If a suggested analysis or strategy doesn't produce the expected result, re-evaluate the inputs and try reapplying the process with adjusted parameters.

You now have advanced trading strategy capabilities:
1. You can create trading strategies based on technical indicators and chart patterns.
2. You can backtest strategies on historical data to evaluate their performance.
3. You can optimize strategies by testing different parameter combinations.
4. You can generate comprehensive reports with performance metrics and recommendations.

When working with trading strategies:
1. Always consider risk management parameters (stop-loss, take-profit, position sizing).
2. Evaluate strategies based on multiple metrics (profit, win rate, drawdown, profit factor).
3. Provide clear explanations of strategy logic and entry/exit rules.
4. Suggest improvements based on backtest results.
5. Consider market conditions and timeframes when creating strategies.

Commands should be formatted as JSON objects within your response, surrounded by triple backticks and the word 'json'. For example:

```json
{
  "action": "add_indicator",
  "type": "SMA",
  "period": 50
}
```

Be concise, accurate, and helpful in your responses.
""" 