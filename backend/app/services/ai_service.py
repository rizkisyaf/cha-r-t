import os
import json
import requests
import re
from dotenv import load_dotenv
from app.services.financial_data_service import get_financial_data

# Load environment variables
load_dotenv()

# Get Mistral API key from environment
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
MISTRAL_API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions'

# Define available functions that Mistral can call
AVAILABLE_FUNCTIONS = {
    "get_financial_data": {
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
    "analyze_chart": {
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
    if function_name == "get_financial_data":
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
        # Implement chart analysis logic here
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
    else:
        return {
            "success": False,
            "error": f"Function {function_name} not implemented"
        }

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
    
    # Create the prompt
    prompt = f"""
Analyzing financial chart data:
- Symbol: {symbol}
- Timeframe: {timeframe}
{indicators_text}

User Message: {message}

Please respond to the user's message and provide any necessary chart commands.
"""
    return prompt

def get_system_prompt():
    """
    Get the system prompt for the OpenAI API
    
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

Commands should be formatted as JSON objects within your response, surrounded by triple backticks and the word 'json'. For example:

```json
{
  "action": "add_indicator",
  "type": "SMA",
  "period": 50
}
```

Available actions include:
- add_indicator: Add a technical indicator to the chart
- remove_indicator: Remove an indicator from the chart
- draw_line: Draw a line on the chart
- draw_rectangle: Draw a rectangle on the chart
- draw_fibonacci: Draw Fibonacci retracement levels
- add_strategy: Create a trading strategy
- run_backtest: Run a backtest on a strategy

Be concise, accurate, and helpful in your responses.
""" 