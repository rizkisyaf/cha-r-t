import { io } from 'socket.io-client';
import { sendMessageToMistral, initMistralService, clearMistralConversation } from './mistralIntegration';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

let socket = null;
let isConnected = false;
let mockResponseCallback = null;
let mistralInitialized = false;
let useHttpFallback = false; // Flag to indicate if we should use HTTP fallback

// Define available actions for the AI agent
const AVAILABLE_ACTIONS = {
  ANALYZE_CHART: 'analyze_chart',
  ADD_INDICATOR: 'add_indicator',
  REMOVE_INDICATOR: 'remove_indicator',
  CHANGE_SYMBOL: 'change_symbol',
  CHANGE_TIMEFRAME: 'change_timeframe',
  CREATE_STRATEGY: 'create_strategy',
  RUN_STRATEGY: 'run_strategy',
  STOP_STRATEGY: 'stop_strategy',
  RUN_BACKTEST: 'run_backtest',
  DRAW_PATTERN: 'draw_pattern'
};

// Initialize Mistral service with handlers
const initMistralHandlers = (chartContext) => {
  return {
    analyzeChart: (args, context) => {
      console.log('Analyzing chart with args:', args);
      // Return a command to be executed by the app
      return {
        success: true,
        action: AVAILABLE_ACTIONS.ANALYZE_CHART,
        includePatterns: args.includePatterns || false,
        includeSupportResistance: args.includeSupportResistance || false
      };
    },
    
    addIndicator: (args, context) => {
      console.log('Adding indicator with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.ADD_INDICATOR,
        type: args.type,
        period: args.period || (args.type === 'SMA' ? 20 : args.type === 'EMA' ? 12 : 14),
        color: args.color || '#2962FF'
      };
    },
    
    removeIndicator: (args, context) => {
      console.log('Removing indicator with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.REMOVE_INDICATOR,
        type: args.type,
        period: args.period
      };
    },
    
    drawPattern: (args, context) => {
      console.log('Drawing pattern with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.DRAW_PATTERN,
        patternTypes: args.patternTypes || ['triangle'],
        includeIndicators: args.includeIndicators || false
      };
    },
    
    changeSymbol: (args, context) => {
      console.log('Changing symbol with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.CHANGE_SYMBOL,
        symbol: args.symbol
      };
    },
    
    changeTimeframe: (args, context) => {
      console.log('Changing timeframe with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.CHANGE_TIMEFRAME,
        timeframe: args.timeframe
      };
    },
    
    createStrategy: (args, context) => {
      console.log('Creating strategy with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.CREATE_STRATEGY,
        name: args.name,
        description: args.description || 'Automatically created strategy',
        conditions: args.conditions || [],
        actions: args.actions || []
      };
    },
    
    runStrategy: (args, context) => {
      console.log('Running strategy with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.RUN_STRATEGY,
        strategyId: args.strategyId
      };
    },
    
    stopStrategy: (args, context) => {
      console.log('Stopping strategy with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.STOP_STRATEGY,
        strategyId: args.strategyId
      };
    },
    
    runBacktest: (args, context) => {
      console.log('Running backtest with args:', args);
      return {
        success: true,
        action: AVAILABLE_ACTIONS.RUN_BACKTEST,
        strategyId: args.strategyId,
        startDate: args.startDate,
        endDate: args.endDate
      };
    },
    
    // Callback for when Mistral responds
    onResponse: (response) => {
      console.log('Mistral response:', response);
      
      // If there's a callback registered, call it with the response
      if (mockResponseCallback) {
        mockResponseCallback(response);
      }
      
      return response;
    }
  };
};

// Check if a message is a direct command
const isDirectCommand = (message) => {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.startsWith('@execute') ||
    lowerMessage.includes('add sma') ||
    lowerMessage.includes('add ema') ||
    lowerMessage.includes('add rsi') ||
    lowerMessage.includes('analyze chart') ||
    lowerMessage.includes('change timeframe') ||
    lowerMessage.includes('create strategy') ||
    lowerMessage.includes('add indicator') ||
    lowerMessage.includes('remove indicator')
  );
};

// Mock AI responses for demo mode with agentic capabilities
const generateMockResponse = (message, chartContext) => {
  console.log('Generating mock response for:', message);
  
  // Check if message is a direct command
  if (isDirectCommand(message)) {
    const action = message.startsWith('@execute') 
      ? message.replace('@execute', '').trim() 
      : message;
    return handleDirectCommand(action, chartContext);
  }
  
  // Initialize Mistral if not already done
  if (!mistralInitialized) {
    console.log('Initializing Mistral service...');
    initMistralService(initMistralHandlers(chartContext));
    mistralInitialized = true;
  } else {
    // Clear previous conversation to start fresh
    clearMistralConversation();
  }
  
  // Use Mistral for natural language processing
  console.log('Sending message to Mistral:', message);
  sendMessageToMistral(message, chartContext);
  
  // Return a placeholder response - the actual response will come through the callback
  return {
    text: 'Processing...',
    commands: []
  };
};

// Handle direct command execution with agentic capabilities
const handleDirectCommand = (action, chartContext) => {
  const lowerAction = action.toLowerCase();
  
  if (lowerAction.includes('add sma')) {
    const periodMatch = action.match(/\b(\d+)\b/);
    const period = periodMatch ? parseInt(periodMatch[0]) : 20;
    
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.ADD_INDICATOR,
          type: 'SMA',
          period: period,
          color: '#2962FF'
        }
      ]
    };
  }
  
  if (lowerAction.includes('add ema')) {
    const periodMatch = action.match(/\b(\d+)\b/);
    const period = periodMatch ? parseInt(periodMatch[0]) : 12;
    
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.ADD_INDICATOR,
          type: 'EMA',
          period: period,
          color: '#FF6D00'
        }
      ]
    };
  }
  
  if (lowerAction.includes('add rsi')) {
    const periodMatch = action.match(/\b(\d+)\b/);
    const period = periodMatch ? parseInt(periodMatch[0]) : 14;
    
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.ADD_INDICATOR,
          type: 'RSI',
          period: period,
          color: '#E91E63'
        }
      ]
    };
  }
  
  if (lowerAction.includes('analyze chart')) {
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.ANALYZE_CHART,
          includePatterns: true,
          includeSupportResistance: true
        }
      ]
    };
  }
  
  if (lowerAction.includes('change timeframe')) {
    let timeframe = '1h';
    
    if (lowerAction.includes('1m')) {
      timeframe = '1m';
    } else if (lowerAction.includes('5m')) {
      timeframe = '5m';
    } else if (lowerAction.includes('15m')) {
      timeframe = '15m';
    } else if (lowerAction.includes('1h')) {
      timeframe = '1h';
    } else if (lowerAction.includes('4h')) {
      timeframe = '4h';
    } else if (lowerAction.includes('1d')) {
      timeframe = '1d';
    }
    
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.CHANGE_TIMEFRAME,
          timeframe: timeframe
        }
      ]
    };
  }
  
  if (lowerAction.includes('create strategy')) {
    const strategyName = `Strategy ${Math.floor(Math.random() * 1000)}`;
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.CREATE_STRATEGY,
          name: strategyName,
          description: 'Automatically created strategy',
          // After creating strategy, automatically run a backtest
          onComplete: [
            {
              action: AVAILABLE_ACTIONS.RUN_BACKTEST,
              strategyId: 'latest'
            }
          ]
        }
      ]
    };
  }
  
  // Default action - try to interpret as an indicator request
  if (lowerAction.includes('10') || lowerAction.includes('ten')) {
    return {
      text: null, // No text response, just execute the command
      commands: [
        {
          action: AVAILABLE_ACTIONS.ADD_INDICATOR,
          type: 'SMA',
          period: 10,
          color: '#2962FF'
        }
      ]
    };
  }
  
  // If we can't handle it directly, use Mistral
  if (mistralInitialized) {
    // Clear previous conversation to start fresh
    clearMistralConversation();
    sendMessageToMistral(action, chartContext);
    return {
      text: 'Processing...',
      commands: []
    };
  }
  
  return {
    text: 'What would you like me to do?',
    commands: []
  };
};

export const initSocket = (callbacks = {}) => {
  if (socket) {
    socket.disconnect();
  }
  
  // Store the callback for mock responses
  mockResponseCallback = callbacks.onChatResponse;
  
  // Initialize Mistral service with handlers
  console.log('Initializing Mistral service in initSocket...');
  initMistralService(initMistralHandlers());
  mistralInitialized = true;
  
  try {
    // If we've had connection issues, use HTTP-only mode
    if (useHttpFallback) {
      console.log('Using HTTP-only mode due to previous WebSocket connection failures');
      // Simulate a connected state even though we're not using WebSockets
      isConnected = true;
      if (callbacks.onConnect) {
        callbacks.onConnect();
      }
      return;
    }
    
    socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      isConnected = true;
      if (callbacks.onConnect) {
        callbacks.onConnect();
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      isConnected = false;
      if (callbacks.onDisconnect) {
        callbacks.onDisconnect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected = false;
      
      // After multiple connection errors, switch to HTTP-only mode
      if (socket.io.backoff.attempts >= 3) {
        console.log('Multiple connection failures, switching to HTTP-only mode');
        useHttpFallback = true;
        socket.disconnect();
        
        // Simulate a connected state
        isConnected = true;
        if (callbacks.onConnect) {
          callbacks.onConnect();
        }
      }
      
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    });
    
    // Chat response event
    socket.on('chat_response', (response) => {
      console.log('Received chat response:', response);
      if (callbacks.onChatResponse) {
        callbacks.onChatResponse(response);
      }
    });
    
    // Error event
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    });
    
    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    
    // Switch to HTTP-only mode on initialization error
    useHttpFallback = true;
    isConnected = true;
    
    if (callbacks.onConnect) {
      callbacks.onConnect();
    }
    
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  }
};

export const sendChatMessage = (message, chartContext) => {
  if (!socket || !isConnected) {
    console.warn('Socket not connected, using mock response');
    
    // Generate mock response
    if (mockResponseCallback) {
      setTimeout(() => {
        const response = generateMockResponse(message, chartContext);
        mockResponseCallback(response);
      }, 1000);
    }
    
    return false;
  }
  
  try {
    socket.emit('chat_message', { message, chartContext });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
      socket = null;
      isConnected = false;
    } catch (error) {
      console.error('Error disconnecting socket:', error);
    }
  }
};

export default {
  initSocket,
  sendChatMessage,
  disconnectSocket,
  AVAILABLE_ACTIONS
}; 