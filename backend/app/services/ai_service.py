import os
import json
import openai
import requests
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

def process_message(message, chart_context):
    """
    Process a user message with the OpenAI API or zirodelta.com and return a response
    
    Args:
        message (str): The user's message
        chart_context (dict): Context about the current chart state
        
    Returns:
        dict: Response containing text and/or commands
    """
    try:
        # Create a prompt that includes the message and chart context
        prompt = create_prompt(message, chart_context)
        
        # Check if OpenAI API key is set
        if not openai.api_key or openai.api_key == "your_openai_api_key_here":
            # Use zirodelta.com endpoint instead
            return call_zirodelta_ai(prompt)
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Extract the response text
        response_text = response.choices[0].message.content
        
        # Format the response for better readability
        response_text = format_response(response_text)
        
        # Parse the response to extract commands if any
        return parse_response(response_text)
    
    except Exception as e:
        print(f"Error in AI service: {str(e)}")
        return {
            "text": f"Sorry, I encountered an error processing your request: {str(e)}",
            "commands": []
        }

def call_zirodelta_ai(prompt):
    """
    Call the zirodelta.com AI endpoint
    
    Args:
        prompt (str): The prompt text
        
    Returns:
        dict: Response containing text and commands
    """
    try:
        # Format the prompt as a direct question/instruction
        formatted_prompt = f"""You are a financial market analyst and AI assistant for a charting application. 
Based on the following market data and user request, provide a clear and concise analysis. 

Format your response with:
1. Clear section headings (use ** for bold)
2. Bullet points for lists (use • symbol)
3. Line breaks between sections
4. Highlight important numbers and values
5. Use short paragraphs with 2-3 sentences maximum
6. Add spacing between paragraphs and sections

Here's the data and request:

{prompt}"""
        
        # Make the API request
        response = requests.post(
            'https://ai.zirodelta.com/generate',
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            json={
                'model': 'mistral',
                'prompt': formatted_prompt,
                'stream': False,
                'max_tokens': 500,
                'temperature': 0.7
            },
            timeout=10
        )
        
        # Check if the request was successful
        if not response.ok:
            raise Exception(f"API error: {response.status_code}")
        
        # Parse the response
        data = response.json()
        
        # Extract the AI response
        if data and 'response' in data:
            ai_response = data['response'].strip()
            
            # Format the response for better readability
            ai_response = format_response(ai_response)
            
            # Parse the response to extract commands if any
            return parse_response(ai_response)
        else:
            raise Exception("Invalid response format from AI service")
    
    except Exception as e:
        print(f"Error calling zirodelta AI: {str(e)}")
        return {
            "text": "Sorry, I couldn't connect to the analysis service. Please try again later.",
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

def parse_response(response_text):
    """
    Parse the response text to extract commands
    
    Args:
        response_text (str): The response text from the AI
        
    Returns:
        dict: Response containing text and commands
    """
    # Initialize response
    result = {
        "text": response_text,
        "commands": []
    }
    
    # Check if there are any JSON code blocks
    json_blocks = re.findall(r'```json\n(.*?)\n```', response_text, re.DOTALL)
    
    # Parse each JSON block as a command
    for block in json_blocks:
        try:
            command = json.loads(block)
            result["commands"].append(command)
            
            # Remove the JSON block from the text response
            result["text"] = result["text"].replace(f"```json\n{block}\n```", "")
        except json.JSONDecodeError:
            print(f"Error parsing JSON: {block}")
    
    # Clean up the text response
    result["text"] = result["text"].strip()
    
    return result 