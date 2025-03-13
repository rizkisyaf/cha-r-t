import axios from 'axios';

// API configuration
const API_ENDPOINT = '/api/mistral/chat'; // Use our backend endpoint instead of calling Mistral directly
const MISTRAL_API_KEY = process.env.REACT_APP_MISTRAL_API_KEY || '';

// Define the available functions that Mistral can call
const AVAILABLE_FUNCTIONS = {
  // Chart analysis functions
  analyze_chart: {
    name: "analyze_chart",
    description: "Analyzes chart data and returns insights about trends, patterns, and key levels.",
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The trading symbol to analyze (e.g., 'BTCUSDT', 'AAPL')"
        },
        timeframe: {
          type: "string",
          description: "The timeframe to analyze (e.g., '1m', '5m', '15m', '1h', '4h', '1d')"
        },
        includePatterns: {
          type: "boolean",
          description: "Whether to include pattern detection in the analysis"
        },
        includeSupportResistance: {
          type: "boolean",
          description: "Whether to include support and resistance levels in the analysis"
        }
      },
      required: ["symbol", "timeframe"]
    }
  },
  
  // Indicator functions
  add_indicator: {
    name: "add_indicator",
    description: "Adds a technical indicator to the chart.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "The type of indicator to add (e.g., 'SMA', 'EMA', 'RSI', 'MACD')"
        },
        period: {
          type: "integer",
          description: "The period for the indicator (e.g., 20 for SMA20)"
        },
        color: {
          type: "string",
          description: "The color for the indicator (hex code)"
        }
      },
      required: ["type"]
    }
  },
  
  remove_indicator: {
    name: "remove_indicator",
    description: "Removes a technical indicator from the chart.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "The type of indicator to remove (e.g., 'SMA', 'EMA', 'RSI', 'MACD')"
        },
        period: {
          type: "integer",
          description: "The period for the indicator (e.g., 20 for SMA20)"
        }
      },
      required: ["type"]
    }
  },
  
  // Pattern detection
  draw_pattern: {
    name: "draw_pattern",
    description: "Detects and draws chart patterns on the chart.",
    parameters: {
      type: "object",
      properties: {
        patternTypes: {
          type: "array",
          items: {
            type: "string"
          },
          description: "The types of patterns to detect (e.g., 'triangle', 'head_and_shoulders', 'double_top', 'double_bottom', 'bullish', 'bearish')"
        },
        includeIndicators: {
          type: "boolean",
          description: "Whether to add relevant indicators for the pattern"
        }
      },
      required: ["patternTypes"]
    }
  },
  
  // Symbol and timeframe functions
  change_symbol: {
    name: "change_symbol",
    description: "Changes the trading symbol being displayed.",
    parameters: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "The new symbol to display (e.g., 'BTCUSDT', 'AAPL')"
        }
      },
      required: ["symbol"]
    }
  },
  
  change_timeframe: {
    name: "change_timeframe",
    description: "Changes the chart timeframe.",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          description: "The new timeframe to display (e.g., '1m', '5m', '15m', '1h', '4h', '1d')"
        }
      },
      required: ["timeframe"]
    }
  },
  
  // Strategy functions
  create_strategy: {
    name: "create_strategy",
    description: "Creates a new trading strategy.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the strategy"
        },
        description: {
          type: "string",
          description: "A description of the strategy"
        },
        conditions: {
          type: "array",
          items: {
            type: "object"
          },
          description: "The conditions for the strategy"
        },
        actions: {
          type: "array",
          items: {
            type: "object"
          },
          description: "The actions for the strategy"
        }
      },
      required: ["name"]
    }
  },
  
  run_strategy: {
    name: "run_strategy",
    description: "Runs a trading strategy.",
    parameters: {
      type: "object",
      properties: {
        strategyId: {
          type: "string",
          description: "The ID of the strategy to run"
        }
      },
      required: ["strategyId"]
    }
  },
  
  stop_strategy: {
    name: "stop_strategy",
    description: "Stops a running trading strategy.",
    parameters: {
      type: "object",
      properties: {
        strategyId: {
          type: "string",
          description: "The ID of the strategy to stop"
        }
      },
      required: ["strategyId"]
    }
  },
  
  run_backtest: {
    name: "run_backtest",
    description: "Runs a backtest on a trading strategy.",
    parameters: {
      type: "object",
      properties: {
        strategyId: {
          type: "string",
          description: "The ID of the strategy to backtest"
        },
        startDate: {
          type: "string",
          description: "The start date for the backtest (ISO format)"
        },
        endDate: {
          type: "string",
          description: "The end date for the backtest (ISO format)"
        }
      },
      required: ["strategyId"]
    }
  }
};

// Class to handle Mistral AI interactions
class MistralService {
  constructor() {
    this.conversation = [];
    this.functionHandlers = {};
    this.onResponseCallback = null;
  }
  
  // Register function handlers that will be executed when Mistral calls them
  registerFunctionHandler(functionName, handler) {
    this.functionHandlers[functionName] = handler;
  }
  
  // Set callback for when Mistral responds
  setResponseCallback(callback) {
    this.onResponseCallback = callback;
  }
  
  // Add a message to the conversation history
  addMessage(role, content, name = null, tool_call_id = null) {
    const message = { role, content };
    
    if (name) {
      message.name = name;
    }
    
    if (tool_call_id) {
      message.tool_call_id = tool_call_id;
    }
    
    this.conversation.push(message);
    console.log('Added message to conversation:', message);
  }
  
  // Send a message to Mistral AI and process the response
  async sendMessage(message, chartContext) {
    try {
      // Add user message to conversation
      this.addMessage('user', message);
      
      // Prepare the tools array for Mistral
      const tools = Object.values(AVAILABLE_FUNCTIONS).map(func => ({
        type: "function",
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters
        }
      }));
      
      console.log('Sending request to backend API with conversation:', this.conversation);
      console.log('Chart context:', chartContext);
      
      // Make the API call to our backend instead of directly to Mistral
      const response = await axios.post(
        API_ENDPOINT, 
        {
          model: "mistral-small-latest", // Use a model that supports function calling
          messages: this.conversation,
          tools: tools,
          tool_choice: "auto", // Let the model decide whether to use tools
          max_tokens: 1024,
          chartContext: chartContext // Include the chart context in the request
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Received response from backend API:', response.data);
      
      // Extract the assistant's response
      const assistantResponse = response.data.choices[0].message;
      
      // Add the assistant response to the conversation
      this.conversation.push(assistantResponse);
      
      // Check if there are tool calls in the response
      if (assistantResponse.tool_calls && assistantResponse.tool_calls.length > 0) {
        console.log('Tool calls detected:', assistantResponse.tool_calls);
        
        // Execute the function handlers
        const commands = [];
        for (const toolCall of assistantResponse.tool_calls) {
          // Execute the function handler
          const result = await this.processToolCall(toolCall, chartContext);
          
          // Convert the result to a command format that can be executed
          if (result && !result.error) {
            commands.push(result);
          }
          
          // Add the tool response to the conversation
          this.addMessage(
            'tool', 
            JSON.stringify(result), 
            toolCall.function.name, 
            toolCall.id
          );
        }
        
        // Get the final response after tool calls
        console.log('Sending final request with tool results:', this.conversation);
        
        const finalResponse = await axios.post(
          API_ENDPOINT, 
          {
            model: "mistral-small-latest",
            messages: this.conversation,
            max_tokens: 1024,
            chartContext: chartContext // Include the chart context in the final request too
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Received final response:', finalResponse.data);
        
        const finalAssistantResponse = finalResponse.data.choices[0].message;
        this.conversation.push(finalAssistantResponse);
        
        // Call the response callback with the final response and commands
        if (this.onResponseCallback) {
          // Return a minimal response with just the commands
          this.onResponseCallback({
            text: null, // No text response, just execute the command
            commands: commands
          });
        }
      } else {
        // No tool calls, just return the response
        if (this.onResponseCallback) {
          this.onResponseCallback({
            text: assistantResponse.content,
            commands: []
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error sending message to backend API:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      
      // Call the response callback with an error message
      if (this.onResponseCallback) {
        this.onResponseCallback({
          text: `Error: ${error.response?.data?.error || error.message || 'Unknown error occurred'}`,
          commands: []
        });
      }
      
      return false;
    }
  }
  
  // Process a tool call from Mistral
  async processToolCall(toolCall, chartContext) {
    try {
      if (!toolCall || typeof toolCall !== 'object') {
        console.error('Invalid tool call:', toolCall);
        return { error: 'Invalid tool call object' };
      }
      
      if (!toolCall.function || typeof toolCall.function !== 'object') {
        console.error('Invalid function in tool call:', toolCall);
        return { error: 'Invalid function object in tool call' };
      }
      
      const functionName = toolCall.function.name;
      if (!functionName) {
        console.error('Missing function name in tool call:', toolCall);
        return { error: 'Missing function name in tool call' };
      }
      
      let functionArgs = {};
      
      try {
        if (toolCall.function.arguments) {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } else {
          console.warn('No arguments provided for function:', functionName);
        }
      } catch (e) {
        console.error('Error parsing function arguments:', e);
        console.log('Raw arguments:', toolCall.function.arguments);
        // Continue with empty args instead of failing
      }
      
      console.log(`Processing tool call: ${functionName}`, functionArgs);
      
      // Check if we have a handler for this function
      if (this.functionHandlers[functionName]) {
        try {
          // Execute the function handler
          const result = await this.functionHandlers[functionName](functionArgs, chartContext);
          
          // Convert the result to a command format
          if (result && result.success && result.action) {
            // The result is already in the correct format
            return result;
          } else if (functionName === 'add_indicator') {
            // Convert to a standard command format
            return {
              action: 'add_indicator',
              type: functionArgs.type || 'SMA',
              period: functionArgs.period || 20,
              color: functionArgs.color || '#2962FF'
            };
          } else if (functionName === 'analyze_chart') {
            return {
              action: 'analyze_chart',
              includePatterns: functionArgs.includePatterns || false,
              includeSupportResistance: functionArgs.includeSupportResistance || false
            };
          } else {
            // Return the result as is
            return result;
          }
        } catch (error) {
          console.error(`Error executing function ${functionName}:`, error);
          return { error: error.message || 'Unknown error occurred' };
        }
      } else {
        console.warn(`No handler registered for function: ${functionName}`);
        return { error: `Function ${functionName} not implemented` };
      }
    } catch (error) {
      console.error('Error in processToolCall:', error);
      return { error: error.message || 'Unknown error in tool call processing' };
    }
  }
  
  // Clear the conversation history
  clearConversation() {
    this.conversation = [];
    console.log('Conversation history cleared');
  }
}

// Create and export a singleton instance
const mistralService = new MistralService();
export default mistralService;
export { AVAILABLE_FUNCTIONS }; 