import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Sidebar, { VIEWS } from './components/sidebar';
import ChartContainer from './components/ChartContainer';
import ChatPanel from './components/ChatPanel';
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
  const [strategyState, setStrategyState] = useState({
    strategies: [],
    activeStrategy: null,
    notifications: [],
    backtestResults: null,
    forwardTestResults: null,
    performance: null
  });

  // Initialize socket connection
  useEffect(() => {
    const socket = initSocket({
      onConnect: () => {
        console.log('Socket connected');
        setSocketConnected(true);
      },
      onDisconnect: () => {
        console.log('Socket disconnected');
        setSocketConnected(false);
      },
      onChatResponse: handleChatResponse,
      onError: (error) => {
        console.error('Socket error:', error);
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'system',
            text: `Error: ${error.message || 'Unknown error occurred'}`
          }
        ]);
      }
    });

    return () => {
      socket.disconnect();
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
      } catch (error) {
        console.log('Error fetching from API, using mock data instead');
        data = { candles: generateMockData() };
      }
      
      setChartData(data.candles || generateMockData());
      
      // Update chart context
      setChartContext(prev => ({
        ...prev,
        symbol,
        timeframe
      }));
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Use mock data as fallback
      setChartData(generateMockData());
    }
  };

  const handleChatResponse = (data) => {
    // Add the AI response to chat messages
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'ai',
        text: data.text
      }
    ]);

    // Process any commands in the response
    if (data.commands && data.commands.length > 0) {
      data.commands.forEach(command => {
        processCommand(command);
      });
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

    // Try to send message to server via socket
    const sent = sendChatMessage(message, chartContext);
    
    // If not connected or message not sent, use mock response
    if (!sent) {
      setTimeout(() => {
        handleChatResponse({
          text: `I'm currently running in demo mode without a backend connection. In a real deployment, I would analyze your request: "${message}" and provide insights about ${symbol}.`,
          commands: []
        });
      }, 1000);
    }
  };

  const processCommand = (command) => {
    // Process commands from the AI
    console.log('Processing command:', command);
    
    switch (command.action) {
      case 'add_indicator':
        // Add indicator to chart
        setChartContext(prev => ({
          ...prev,
          indicators: [...prev.indicators, command]
        }));
        break;
      case 'remove_indicator':
        // Remove indicator from chart
        setChartContext(prev => ({
          ...prev,
          indicators: prev.indicators.filter(ind => 
            ind.type !== command.type || ind.period !== command.period
          )
        }));
        break;
      case 'change_symbol':
        // Change the symbol
        setSymbol(command.symbol);
        break;
      case 'change_timeframe':
        // Change the timeframe
        setTimeframe(command.timeframe);
        break;
      default:
        console.log('Unknown command:', command);
    }
  };

  // Generate mock data for testing
  const generateMockData = () => {
    const data = [];
    const basePrice = 1340;
    const baseVolume = 500000;
    
    const now = new Date();
    for (let i = 100; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const volatility = Math.random() * 50;
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const high = open + Math.random() * 20;
      const low = open - Math.random() * 20;
      const close = (open + high + low) / 3 + (Math.random() - 0.5) * 10;
      const volume = baseVolume + Math.random() * baseVolume;
      
      data.push({
        time: date.getTime() / 1000,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return data;
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
                <ChatPanel
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  connected={socketConnected}
                  strategyState={strategyState}
                  onStrategyAction={handleStrategyAction}
                />
              </>
            } />
          </Routes>
        </ContentArea>
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