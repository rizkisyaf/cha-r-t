import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Sidebar, { VIEWS } from './components/sidebar';
import ChartContainer from './components/ChartContainer';
import AIAssistantPanel from './components/AIAssistantPanel';
import BottomPanel from './components/BottomPanel';
import { getFinancialData } from './services/api';
import { initSocket, sendChatMessage, disconnectSocket } from './services/socket';

// Import pages
import CodeEditor from './pages/tools/CodeEditor';

import './App.css';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--secondary-color);
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

// Map view IDs to routes
const VIEW_ROUTES = {
  [VIEWS.CODE_EDITOR]: '/tools/code-editor',
  [VIEWS.HISTORY]: '/history',
  [VIEWS.FAVORITES]: '/favorites',
  [VIEWS.SETTINGS]: '/settings',
};

// Map routes back to view IDs
const ROUTE_VIEWS = Object.entries(VIEW_ROUTES).reduce((acc, [view, route]) => {
  acc[route] = view;
  return acc;
}, {});

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [chartData, setChartData] = useState([]);
  const [chartContext, setChartContext] = useState({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    indicators: []
  });
  const [activeView, setActiveView] = useState('CHART');
  const [chatMessages, setChatMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [strategyState, setStrategyState] = useState({
    strategies: [],
    activeStrategy: null,
    notifications: [],
    backtestResults: null,
    forwardTestResults: null,
    performance: null
  });
  
  // Add agent memory to track context and state
  const [agentMemory, setAgentMemory] = useState({
    lastCommands: [],
    pendingActions: [],
    context: {},
    analysisResults: null
  });

  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);

  // Initialize socket connection
  useEffect(() => {
    const socket = initSocket({
      onConnect: () => {
        console.log('Socket connected');
        setSocketConnected(true);
        
        // Add a system message about the connection
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'system',
            text: 'Connected to the server. You can now chat with the AI assistant.'
          }
        ]);
      },
      onDisconnect: () => {
        console.log('Socket disconnected');
        setSocketConnected(false);
        
        // Add a system message about the disconnection
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'system',
            text: 'Disconnected from the server. Some features may be limited.'
          }
        ]);
      },
      onChatResponse: handleChatResponse,
      onError: (error) => {
        console.error('Socket error:', error);
        
        // Only add the error message if we haven't already shown a connection message
        if (!socketConnected) {
          setChatMessages(prev => {
            // Check if we already have a system error message
            const hasErrorMessage = prev.some(msg => 
              msg.type === 'system' && 
              (msg.text || '').includes('Unable to connect')
            );
            
            if (!hasErrorMessage) {
              return [
                ...prev,
                {
                  id: Date.now(),
                  type: 'system',
                  text: 'Unable to connect to the server. Using local processing mode. The application will continue to work, but some features may be limited.'
                }
              ];
            }
            return prev;
          });
        }
      }
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  // Fetch initial chart data
  useEffect(() => {
    fetchChartData(symbol, timeframe);
  }, [symbol, timeframe]);

  const fetchChartData = async (symbol, timeframe) => {
    try {
      // Try to fetch from the backend
      let data;
      try {
        data = await getFinancialData(symbol, timeframe);
        if (data.error) {
          console.error('Error from backend:', data.error);
          return;
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
        return;
      }
      
      setChartData(data.candles || []);
      
      // Update chart context
      setChartContext(prev => ({
        ...prev,
        symbol: data.symbol || symbol,
        timeframe
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    }
  };

  const handleChatResponse = (data) => {
    // AI has responded, so it's no longer typing
    setIsAiTyping(false);
    
    console.log('Received chat response:', data);
    
    // For action-oriented responses, don't show the AI text message at all
    // Only show system messages for actions
    const isActionCommand = data.commands && data.commands.length > 0;
    
    if (!isActionCommand && data.text) {
      // Add the AI response to chat messages only if it's not an action command and has text
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'ai',
          text: data.text
        }
      ]);
    } else if (isActionCommand) {
      // For action commands, just show a minimal loading indicator
      const commandId = Date.now();
      setChatMessages(prev => [
        ...prev,
        {
          id: commandId,
          type: 'system',
          text: `Working...`
        }
      ]);
      
      // Store commands in agent memory for context
      setAgentMemory(prev => ({
        ...prev,
        lastCommands: data.commands,
        pendingActions: []
      }));
      
      // Process commands sequentially with proper state management
      processCommandSequence(data.commands, commandId);
    }
  };

  // New function to process a sequence of commands
  const processCommandSequence = (commands, systemMessageId) => {
    if (!commands || commands.length === 0) return;
    
    // Process the first command immediately
    const firstCommand = commands[0];
    
    // Store any follow-up actions in the agent memory
    if (firstCommand.onComplete && firstCommand.onComplete.length > 0) {
      setAgentMemory(prev => ({
        ...prev,
        pendingActions: [...prev.pendingActions, ...firstCommand.onComplete]
      }));
    }
    
    // Process the command with initial retry count of 0
    processCommand(firstCommand, systemMessageId, 0);
    
    // If there are more commands in the sequence, queue them with a slight delay
    if (commands.length > 1) {
      const remainingCommands = commands.slice(1);
      setTimeout(() => {
        processCommandSequence(remainingCommands, systemMessageId);
      }, 1000);
    }
  };

  const handleSendMessage = (message) => {
    // Add user message to chat
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        text: message
      }
    ]);

    // Set AI as typing to show the indicator
    setIsAiTyping(true);

    // Try to send message to server via socket
    sendChatMessage(message, chartContext);
  };

  const processCommand = (command, commandId, retryCount = 0) => {
    // Process commands from the AI
    console.log('Processing command:', command);
    
    // Prevent infinite recursion with a retry limit
    const MAX_RETRIES = 3;
    if (retryCount > MAX_RETRIES) {
      console.warn(`Maximum retry count (${MAX_RETRIES}) reached for command:`, command);
      updateSystemMessage(commandId, '⚠️ Failed to execute command after multiple attempts');
      return;
    }
    
    // Store command in memory for context
    setAgentMemory(prev => ({
      ...prev,
      context: {
        ...prev.context,
        lastCommand: command
      }
    }));
    
    // If the command comes from Mistral's function calling, it will have a success property
    if (command.success) {
      // Extract the action and args from the command
      const { action, success, ...args } = command;
      
      // Use the extracted action and args directly
      command = { action, ...args };
    }
    
    switch (command.action) {
      case 'add_indicator':
        // Add indicator to chart
        console.log(`AI Action: Adding ${command.type} indicator with period ${command.period}`);
        
        // Check if indicator already exists to prevent duplicates
        const indicatorAlreadyExists = chartContext.indicators.some(
          ind => ind.type === command.type && ind.period === command.period
        );
        
        if (indicatorAlreadyExists) {
          console.log(`Indicator ${command.type} with period ${command.period} already exists, skipping...`);
          updateSystemMessage(commandId, '✅ Indicator already added');
          return;
        }
        
        // Add the indicator using a state update callback to ensure we have the latest state
        setChartContext(prev => {
          const newIndicators = [...prev.indicators, {...command, id: commandId || Date.now()}];
          
          // Update the system message to show completion
          updateSystemMessage(commandId, '✅ Done');
          
          // Check for pending actions after state update
          setTimeout(checkAndExecutePendingActions, 100);
          
          return {
            ...prev,
            indicators: newIndicators
          };
        });
        break;
        
      case 'remove_indicator':
        // Remove indicator from chart
        console.log(`AI Action: Removing ${command.type} indicator`);
        setChartContext(prev => ({
          ...prev,
          indicators: prev.indicators.filter(ind => 
            ind.type !== command.type || ind.period !== command.period
          )
        }));
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Done');
        checkAndExecutePendingActions();
        break;
        
      case 'change_symbol':
        // Change the symbol
        console.log(`AI Action: Changing symbol to ${command.symbol}`);
        setSymbol(command.symbol);
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Done');
        checkAndExecutePendingActions();
        break;
        
      case 'change_timeframe':
        // Change the timeframe
        console.log(`AI Action: Changing timeframe to ${command.timeframe}`);
        setTimeframe(command.timeframe);
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Done');
        checkAndExecutePendingActions();
        break;
        
      case 'analyze_chart':
        // Perform chart analysis - more action-oriented
        console.log(`AI Action: Analyzing chart for ${symbol} on ${timeframe} timeframe`);
        
        // Add support and resistance lines directly to the chart
        const supportLevel = chartData[0]?.close * 0.95;
        const resistanceLevel = chartData[0]?.close * 1.05;
        
        // Store analysis results in agent memory
        setAgentMemory(prev => ({
          ...prev,
          analysisResults: {
            supportLevel,
            resistanceLevel,
            trend: supportLevel < chartData[0]?.close ? 'bullish' : 'bearish',
            volatility: 'medium',
            timestamp: new Date().toISOString()
          }
        }));
        
        // Update system message to show completion
        updateSystemMessage(commandId, '✅ Done');
        checkAndExecutePendingActions();
        break;
        
      case 'draw_pattern':
        // Draw chart patterns
        console.log(`AI Action: Drawing ${command.patternTypes.join(', ')} patterns`);
        
        // Simulate pattern detection
        const patternFound = Math.random() > 0.3; // 70% chance to find a pattern
        
        if (patternFound) {
          // Choose a random pattern type from the requested types
          const patternType = command.patternTypes[Math.floor(Math.random() * command.patternTypes.length)];
          
          // Add pattern visualization to the chart
          // This is a simplified example - in a real app, you'd use actual pattern detection algorithms
          const startIndex = Math.floor(chartData.length * 0.7);
          const endIndex = chartData.length - 1;
          
          // Add pattern to chart context
          setChartContext(prev => ({
            ...prev,
            indicators: [...prev.indicators, 
              {
                type: 'Pattern',
                patternType: patternType,
                startIndex: startIndex,
                endIndex: endIndex,
                color: patternType.includes('bullish') ? '#4CAF50' : '#F44336'
              }
            ]
          }));
          
          // Add indicators if requested
          if (command.includeIndicators) {
            const hasRSI = chartContext.indicators.some(ind => ind.type === 'RSI');
            if (!hasRSI) {
              setChartContext(prev => ({
                ...prev,
                indicators: [...prev.indicators, 
                  {
                    type: 'RSI',
                    period: 14,
                    color: '#E91E63'
                  }
                ]
              }));
            }
          }
          
          updateSystemMessage(commandId, `✅ Found ${patternType.replace('_', ' ')} pattern`);
        } else {
          updateSystemMessage(commandId, `✅ No clear patterns found`);
        }
        
        // Check for pending actions
        checkAndExecutePendingActions();
        break;
        
      case 'run_strategy':
        // Run a trading strategy
        console.log(`AI Action: Running strategy ${command.strategyId}`);
        handleStrategyAction({
          type: 'START_STRATEGY',
          payload: command.strategyId
        });
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Strategy started');
        checkAndExecutePendingActions();
        break;
        
      case 'stop_strategy':
        // Stop a trading strategy
        console.log(`AI Action: Stopping strategy ${command.strategyId}`);
        handleStrategyAction({
          type: 'STOP_STRATEGY',
          payload: command.strategyId
        });
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Strategy stopped');
        checkAndExecutePendingActions();
        break;
        
      case 'create_strategy':
        // Create a new strategy
        console.log(`AI Action: Creating new strategy "${command.name}"`);
        const newStrategyId = Date.now().toString();
        
        handleStrategyAction({
          type: 'CREATE_STRATEGY',
          payload: {
            id: newStrategyId,
            name: command.name,
            description: command.description,
            conditions: command.conditions || [],
            actions: command.actions || [],
            running: false,
            createdAt: new Date().toISOString()
          }
        });
        
        // Store the new strategy ID in memory for follow-up actions
        setAgentMemory(prev => ({
          ...prev,
          context: {
            ...prev.context,
            latestStrategyId: newStrategyId
          }
        }));
        
        // Update system message and check for pending actions
        updateSystemMessage(commandId, '✅ Strategy created');
        checkAndExecutePendingActions();
        break;
        
      case 'run_backtest':
        // Run backtest on a strategy
        console.log(`AI Action: Running backtest for strategy ${command.strategyId}`);
        
        // If strategyId is 'latest', use the one from memory
        const strategyId = command.strategyId === 'latest' 
          ? agentMemory.context.latestStrategyId 
          : command.strategyId;
        
        // Simulate backtest results
        setTimeout(() => {
          handleStrategyAction({
            type: 'UPDATE_BACKTEST',
            payload: {
              strategyId: strategyId,
              startDate: command.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: command.endDate || new Date().toISOString(),
              trades: generateMockTrades(20),
              performance: {
                totalReturn: Math.random() * 30 - 5,
                winRate: Math.random() * 0.4 + 0.4,
                maxDrawdown: Math.random() * 15 + 5,
                sharpeRatio: Math.random() * 1.5 + 0.5
              }
            }
          });
          
          // Update system message and check for pending actions
          updateSystemMessage(commandId, '✅ Backtest complete');
          checkAndExecutePendingActions();
        }, 1500);
        break;
        
      default:
        console.warn(`Unknown command action: ${command.action}`);
        updateSystemMessage(commandId, '❌ Unknown command');
    }
  };
  
  // Helper function to update the system message
  const updateSystemMessage = (messageId, text) => {
    setChatMessages(prev => {
      const updatedMessages = [...prev];
      const systemMessageIndex = updatedMessages.findIndex(
        msg => msg.id === messageId && msg.type === 'system'
      );
      
      if (systemMessageIndex !== -1) {
        updatedMessages[systemMessageIndex] = {
          ...updatedMessages[systemMessageIndex],
          text: text
        };
      } else {
        // If we can't find the message by ID, try to find the last "Working..." message
        const lastSystemMessage = updatedMessages.findIndex(
          msg => msg.type === 'system' && msg.text === 'Working...'
        );
        
        if (lastSystemMessage !== -1) {
          updatedMessages[lastSystemMessage] = {
            ...updatedMessages[lastSystemMessage],
            text: text
          };
        }
      }
      
      return updatedMessages;
    });
  };
  
  // Helper function to check and execute pending actions
  const checkAndExecutePendingActions = () => {
    setTimeout(() => {
      setAgentMemory(prev => {
        if (prev.pendingActions && prev.pendingActions.length > 0) {
          // Get the next action
          const nextAction = prev.pendingActions[0];
          const remainingActions = prev.pendingActions.slice(1);
          
          // Process the next action
          if (nextAction) {
            // Add a new system message for the next action
            setChatMessages(prevMsgs => [
              ...prevMsgs,
              {
                id: Date.now(),
                type: 'system',
                text: `Working...`
              }
            ]);
            
            // Process the command
            processCommand(nextAction, Date.now(), 0);
          }
          
          // Update the pending actions
          return {
            ...prev,
            pendingActions: remainingActions
          };
        }
        return prev;
      });
    }, 500);
  };

  // Helper function to generate mock trades for backtesting
  const generateMockTrades = (count) => {
    const trades = [];
    const basePrice = chartData[0]?.close || 1000;
    
    for (let i = 0; i < count; i++) {
      const entryPrice = basePrice * (1 + (Math.random() - 0.5) * 0.1);
      const exitPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.05);
      const profit = exitPrice - entryPrice;
      
      trades.push({
        id: i,
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        entryTime: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice,
        exitTime: new Date(Date.now() - (count - i - 1) * 24 * 60 * 60 * 1000).toISOString(),
        exitPrice,
        profit,
        profitPercent: (profit / entryPrice) * 100
      });
    }
    
    return trades;
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    console.log(`App: Changing timeframe to ${newTimeframe}`);
    setTimeframe(newTimeframe);
    
    // Update chart context with new timeframe
    setChartContext(prevContext => ({
      ...prevContext,
      timeframe: newTimeframe
    }));
    
    // Fetch new data for the selected timeframe
    fetchChartData(symbol, newTimeframe);
  };

  // Handle view change from sidebar
  const handleViewChange = (view) => {
    setActiveView(view);
    const route = VIEW_ROUTES[view];
    if (route) {
      navigate(route);
    }
  };

  // Handle symbol change
  const handleSymbolChange = (newSymbol) => {
    console.log(`App: Changing symbol to ${newSymbol}`);
    setSymbol(newSymbol);
    
    // Update chart context with new symbol
    setChartContext(prevContext => ({
      ...prevContext,
      symbol: newSymbol
    }));
    
    // Fetch new data for the selected symbol
    fetchChartData(newSymbol, timeframe);
  };

  const handleIndicatorAdd = (indicator) => {
    // If indicator is an array, it's a complete replacement of the indicators
    // This happens when toggling visibility or removing indicators
    if (Array.isArray(indicator)) {
      setChartContext(prev => ({
        ...prev,
        indicators: indicator
      }));
    } else {
      // If it's a single indicator, add it to the array
      // This happens when adding a new indicator
      setChartContext(prev => ({
        ...prev,
        indicators: [...(prev.indicators || []), indicator]
      }));
    }
  };

  const handleStrategyAction = (action) => {
    switch (action.type) {
      case 'CREATE_STRATEGY':
        setStrategyState(prev => ({
          ...prev,
          strategies: [...prev.strategies, action.payload],
          activeStrategy: action.payload
        }));
        break;
      case 'UPDATE_STRATEGY':
        setStrategyState(prev => ({
          ...prev,
          strategies: prev.strategies.map(s => 
            s.id === action.payload.id ? action.payload : s
          ),
          activeStrategy: action.payload
        }));
        break;
      case 'DELETE_STRATEGY':
        setStrategyState(prev => ({
          ...prev,
          strategies: prev.strategies.filter(s => s.id !== action.payload),
          activeStrategy: prev.activeStrategy?.id === action.payload ? null : prev.activeStrategy
        }));
        break;
      case 'START_STRATEGY':
      case 'STOP_STRATEGY':
        setStrategyState(prev => ({
          ...prev,
          strategies: prev.strategies.map(s => 
            s.id === action.payload ? { ...s, running: action.type === 'START_STRATEGY' } : s
          )
        }));
        break;
      case 'ADD_NOTIFICATION':
        setStrategyState(prev => ({
          ...prev,
          notifications: [action.payload, ...prev.notifications]
        }));
        break;
      case 'UPDATE_BACKTEST':
        setStrategyState(prev => ({
          ...prev,
          backtestResults: action.payload
        }));
        break;
      case 'UPDATE_FORWARD_TEST':
        setStrategyState(prev => ({
          ...prev,
          forwardTestResults: action.payload
        }));
        break;
      case 'UPDATE_PERFORMANCE':
        setStrategyState(prev => ({
          ...prev,
          performance: action.payload
        }));
        break;
      default:
        console.warn('Unknown strategy action:', action);
    }
  };

  const handleBottomPanelResize = (height) => {
    setBottomPanelHeight(height);
  };

  return (
    <AppContainer>
      <Header 
        symbol={symbol} 
        timeframe={timeframe}
        onSymbolChange={handleSymbolChange}
        onTimeframeChange={handleTimeframeChange}
      />
      <MainContent>
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        <ContentArea>
          <Routes>
            {/* Tool Routes */}
            <Route path="/tools/code-editor" element={<CodeEditor />} />
            
            {/* Navigation Routes */}
            <Route path="/history" element={<div>History Page</div>} />
            <Route path="/favorites" element={<div>Favorites Page</div>} />
            <Route path="/settings" element={<div>Settings Page</div>} />
            
            {/* Default Route */}
            <Route path="/" element={
              <>
                <ChartContainer 
                  data={chartData}
                  context={chartContext}
                  onIndicatorAdd={handleIndicatorAdd}
                />
                <BottomPanel
                  strategyState={strategyState}
                  onStrategyAction={handleStrategyAction}
                  onResize={handleBottomPanelResize}
                />
              </>
            } />
          </Routes>
        </ContentArea>
        <AIAssistantPanel
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          connected={socketConnected}
          isAiTyping={isAiTyping}
          agentMemory={agentMemory}
        />
      </MainContent>
    </AppContainer>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 