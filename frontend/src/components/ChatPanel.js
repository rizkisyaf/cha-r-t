import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { 
  FaPaperPlane, 
  FaMicrophone, 
  FaRegLightbulb, 
  FaChevronDown, 
  FaChevronUp, 
  FaCircle, 
  FaExpand, 
  FaCompress,
  FaRobot,
  FaChartLine,
  FaPlay,
  FaBell,
  FaChartBar,
  FaForward,
  FaChartPie,
  FaCode,
  FaSearch,
  FaLightbulb,
  FaDrawPolygon,
  FaCog
} from 'react-icons/fa';

// Import strategy components
import {
  StrategyBuilder,
  StrategyRunner,
  Notifications,
  Backtest,
  ForwardTest,
  Performance
} from './strategy';

const ChatPanelContainer = styled.div`
  height: ${props => props.$maximized === 'true' ? '80vh' : '300px'};
  background-color: var(--primary-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: ${props => props.$maximized === 'true' ? 'fixed' : 'relative'};
  bottom: ${props => props.$maximized === 'true' ? '0' : 'auto'};
  left: ${props => props.$maximized === 'true' ? '0' : 'auto'};
  right: ${props => props.$maximized === 'true' ? '0' : 'auto'};
  z-index: ${props => props.$maximized === 'true' ? '1000' : '1'};
  box-shadow: ${props => props.$maximized === 'true' ? '0 -4px 10px rgba(0, 0, 0, 0.1)' : 'none'};
  
  ${props => props.$minimized === 'true' && `
    height: 48px;
  `}
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  
  svg {
    color: var(--accent-color);
    margin-right: 8px;
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  
  svg {
    margin-right: 4px;
    color: ${props => props.$connected ? 'var(--success-color)' : 'var(--danger-color)'};
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  margin-left: 8px;
  
  &:hover {
    color: var(--text-color);
  }
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  ${props => props.$minimized === 'true' && `
    display: none;
  `}
`;

const Message = styled.div`
  display: flex;
  margin-bottom: 12px;
  justify-content: ${props => props.type === 'system' ? 'center' : 'flex-start'};
  
  ${props => props.type === 'user' && `
    justify-content: flex-end;
  `}
  
  ${props => props.type === 'system' && `
    max-width: 120px;
    margin-left: auto;
    margin-right: auto;
  `}
`;

const MessageContent = styled.div`
  padding: ${props => props.type === 'system' ? '6px 10px' : '12px 16px'};
  border-radius: 12px;
  max-width: 80%;
  font-size: ${props => props.type === 'system' ? '12px' : '14px'};
  line-height: 1.5;
  
  ${props => props.type === 'user' && `
    background-color: var(--accent-color);
    color: white;
    border-top-right-radius: 4px;
    align-self: flex-end;
  `}
  
  ${props => props.type === 'ai' && `
    background-color: var(--message-bg);
    color: var(--text-primary);
    border-top-left-radius: 4px;
  `}
  
  ${props => props.type === 'system' && `
    background-color: var(--system-message-bg);
    color: var(--text-secondary);
    font-style: italic;
    text-align: center;
  `}
  
  p {
    margin: 0;
  }
  
  code {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
  
  pre {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    
    code {
      background-color: transparent;
      padding: 0;
    }
  }
`;

const AIMessageContent = styled.div`
  padding: 12px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
  
  /* Markdown styling */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
  }
  
  h1 {
    font-size: 1.5em;
  }
  
  h2 {
    font-size: 1.3em;
  }
  
  p {
    margin-bottom: 12px;
  }
  
  ul, ol {
    margin-left: 20px;
    margin-bottom: 12px;
  }
  
  li {
    margin-bottom: 4px;
  }
  
  strong {
    font-weight: 600;
    color: var(--accent-color);
  }
  
  code {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
  }
  
  pre {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 12px;
  }
  
  blockquote {
    border-left: 4px solid var(--accent-color);
    padding-left: 12px;
    margin-left: 0;
    color: var(--text-secondary);
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--accent-color);
    margin-right: 4px;
    opacity: 0.6;
    animation: pulse 1.4s infinite ease-in-out;
  }
  
  .dot:nth-child(1) {
    animation-delay: 0s;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes pulse {
    0%, 60%, 100% {
      transform: scale(1);
      opacity: 0.6;
    }
    30% {
      transform: scale(1.5);
      opacity: 1;
    }
  }
`;

const ChatInputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  
  ${props => props.$minimized === 'true' && `
    display: none;
  `}
`;

const ChatInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  padding: 0 12px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
`;

const InputButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  margin-left: 12px;
  cursor: pointer;
  
  &:hover {
    color: var(--text-color);
  }
  
  &:disabled {
    color: var(--border-color);
    cursor: not-allowed;
  }
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-color);
  overflow-x: auto;
  gap: 4px;
  
  &::-webkit-scrollbar {
    height: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 1px;
  }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: ${props => props.$active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.$active ? '#fff' : 'var(--text-color)'};
  border: none;
  border-radius: 4px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  svg {
    margin-right: 6px;
    font-size: 14px;
  }
`;

const TABS = {
  CHAT: 'CHAT',
  CODE_EDITOR: 'CODE_EDITOR',
  BUILDER: 'BUILDER',
  RUNNER: 'RUNNER',
  NOTIFICATIONS: 'NOTIFICATIONS',
  BACKTEST: 'BACKTEST',
  FORWARD_TEST: 'FORWARD_TEST',
  PERFORMANCE: 'PERFORMANCE'
};

const ActionButton = styled.button`
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  margin-top: 8px;
  margin-right: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--accent-hover);
  }
  
  svg {
    margin-right: 6px;
    font-size: 14px;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
`;

// Add a loading spinner component
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  border: 2px solid var(--accent-color);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Add a Quick Action Bar component for common AI commands
const QuickActionBar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
  overflow-x: auto;
  gap: 8px;
  
  &::-webkit-scrollbar {
    height: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 1px;
  }
  
  ${props => props.$minimized === 'true' && `
    display: none;
  `}
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: var(--secondary-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--accent-color);
    color: white;
  }
  
  svg {
    margin-right: 6px;
    font-size: 12px;
  }
`;

// Add a memory indicator to show the AI is remembering context
const MemoryIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(41, 98, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent-color);
  margin-top: 4px;
  
  svg {
    margin-right: 4px;
    font-size: 10px;
  }
`;

const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  connected = false,
  strategyState,
  onStrategyAction,
  isAiTyping = false,
  agentMemory = {} // Add agent memory prop
}) => {
  const [inputValue, setInputValue] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.CHAT);
  const inputRef = useRef(null);
  
  // Scroll to bottom when messages change or when AI starts/stops typing
  useEffect(() => {
    if (inputRef.current && !minimized) {
      inputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized, isAiTyping]);
  
  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const toggleMaximize = () => {
    setMaximized(!maximized);
    // If minimized, un-minimize when maximizing
    if (minimized && !maximized) {
      setMinimized(false);
    }
  };
  
  // Execute a predefined action
  const executeAction = (action) => {
    // This would trigger the AI to perform a specific action
    onSendMessage(`@execute ${action}`);
  };
  
  // Quick action handlers
  const handleQuickAction = (action) => {
    onSendMessage(action);
  };
  
  // Render message content based on type
  const renderMessageContent = (message) => {
    // Get the message content from either text or content property
    const messageText = message.text || message.content || '';
    
    if (message.type === 'ai') {
      // Extract action buttons if present in the message
      const hasActionButtons = messageText.includes('[Action:');
      let textContent = messageText;
      let actionButtons = [];
      
      if (hasActionButtons) {
        // Extract action buttons using regex
        const actionRegex = /\[Action:(.*?)\]/g;
        let match;
        
        while ((match = actionRegex.exec(messageText)) !== null) {
          actionButtons.push(match[1].trim());
        }
        
        // Remove action buttons from text
        textContent = messageText.replace(actionRegex, '');
      }
      
      return (
        <>
          <AIMessageContent>
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </AIMessageContent>
          
          {actionButtons.length > 0 && (
            <ActionButtonGroup>
              {actionButtons.map((action, index) => (
                <ActionButton key={index} onClick={() => executeAction(action)}>
                  <FaPlay /> {action}
                </ActionButton>
              ))}
            </ActionButtonGroup>
          )}
          
          {/* Show memory indicator if the AI has context */}
          {agentMemory && agentMemory.analysisResults && (
            <MemoryIndicator>
              <FaRegLightbulb /> AI remembers your chart analysis from {new Date(agentMemory.analysisResults.timestamp).toLocaleTimeString()}
            </MemoryIndicator>
          )}
        </>
      );
    } else if (message.type === 'system') {
      // Add loading spinner for executing commands
      const isExecuting = messageText.toLowerCase().includes('working');
      
      return (
        <MessageContent type={message.type}>
          {isExecuting && <LoadingSpinner />}
          {messageText}
        </MessageContent>
      );
    } else {
      return (
        <MessageContent type={message.type}>
          {messageText}
        </MessageContent>
      );
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case TABS.CHAT:
        return (
          <>
            <ChatMessages $minimized={minimized.toString()}>
              {messages.map(message => (
                <Message key={message.id} type={message.type} $maximized={maximized.toString()}>
                  {renderMessageContent(message)}
                </Message>
              ))}
              
              {/* Show typing indicator when AI is processing */}
              {isAiTyping && (
                <Message type="ai" $maximized={maximized.toString()}>
                  <TypingIndicator>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </TypingIndicator>
                </Message>
              )}
              
              <div ref={inputRef} />
            </ChatMessages>
            
            {/* Quick Action Bar for common commands */}
            <QuickActionBar $minimized={minimized.toString()}>
              <QuickActionButton onClick={() => handleQuickAction("add SMA 20")}>
                <FaChartLine /> SMA 20
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("add EMA 12")}>
                <FaChartLine /> EMA 12
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("add RSI")}>
                <FaChartBar /> RSI
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("analyze chart")}>
                <FaSearch /> Analyze
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("find trading opportunity")}>
                <FaLightbulb /> Find Opportunity
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("detect patterns")}>
                <FaDrawPolygon /> Patterns
              </QuickActionButton>
              <QuickActionButton onClick={() => handleQuickAction("create strategy")}>
                <FaCog /> Create Strategy
              </QuickActionButton>
            </QuickActionBar>
            
            <ChatInputContainer $minimized={minimized.toString()}>
              <ChatInput
                type="text"
                placeholder="Command the AI (e.g., 'add SMA 10')"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                ref={inputRef}
                disabled={isAiTyping}
              />
              <InputButton title="Voice input" disabled={isAiTyping}>
                <FaMicrophone />
              </InputButton>
              <InputButton 
                title="Send message" 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAiTyping}
              >
                <FaPaperPlane />
              </InputButton>
            </ChatInputContainer>
          </>
        );
      case TABS.CODE_EDITOR:
        return (
          <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
            <CodeEditor />
          </div>
        );
      case TABS.BUILDER:
        return <StrategyBuilder state={strategyState} onAction={onStrategyAction} />;
      case TABS.RUNNER:
        return <StrategyRunner state={strategyState} onAction={onStrategyAction} />;
      case TABS.NOTIFICATIONS:
        return <Notifications state={strategyState} onAction={onStrategyAction} />;
      case TABS.BACKTEST:
        return <Backtest state={strategyState} onAction={onStrategyAction} />;
      case TABS.FORWARD_TEST:
        return <ForwardTest state={strategyState} onAction={onStrategyAction} />;
      case TABS.PERFORMANCE:
        return <Performance state={strategyState} onAction={onStrategyAction} />;
      default:
        return null;
    }
  };
  
  return (
    <ChatPanelContainer 
      $minimized={minimized.toString()} 
      $maximized={maximized.toString()}
    >
      <ChatHeader>
        <ChatTitle>
          <FaRegLightbulb />
          Trading Assistant
          <ConnectionStatus $connected={connected}>
            <FaCircle size={8} />
            {connected ? 'Connected' : 'Demo Mode'}
          </ConnectionStatus>
        </ChatTitle>
        <HeaderButtons>
          <ToggleButton 
            title={maximized ? "Minimize window" : "Maximize window"} 
            onClick={toggleMaximize}
          >
            {maximized ? <FaCompress /> : <FaExpand />}
          </ToggleButton>
          <ToggleButton 
            title={minimized ? "Expand chat" : "Collapse chat"} 
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? <FaChevronUp /> : <FaChevronDown />}
          </ToggleButton>
        </HeaderButtons>
      </ChatHeader>

      <TabBar>
        <Tab 
          $active={activeTab === TABS.CHAT}
          onClick={() => setActiveTab(TABS.CHAT)}
        >
          <FaRobot />
          AI Assistant
        </Tab>
        <Tab 
          $active={activeTab === TABS.CODE_EDITOR}
          onClick={() => setActiveTab(TABS.CODE_EDITOR)}
        >
          <FaCode />
          Code Editor
        </Tab>
        <Tab 
          $active={activeTab === TABS.BUILDER}
          onClick={() => setActiveTab(TABS.BUILDER)}
        >
          <FaChartLine />
          Strategy Builder
        </Tab>
        <Tab 
          $active={activeTab === TABS.RUNNER}
          onClick={() => setActiveTab(TABS.RUNNER)}
        >
          <FaPlay />
          Strategy Runner
        </Tab>
        <Tab 
          $active={activeTab === TABS.NOTIFICATIONS}
          onClick={() => setActiveTab(TABS.NOTIFICATIONS)}
        >
          <FaBell />
          Notifications
        </Tab>
        <Tab 
          $active={activeTab === TABS.BACKTEST}
          onClick={() => setActiveTab(TABS.BACKTEST)}
        >
          <FaChartBar />
          Backtest
        </Tab>
        <Tab 
          $active={activeTab === TABS.FORWARD_TEST}
          onClick={() => setActiveTab(TABS.FORWARD_TEST)}
        >
          <FaForward />
          Forward Test
        </Tab>
        <Tab 
          $active={activeTab === TABS.PERFORMANCE}
          onClick={() => setActiveTab(TABS.PERFORMANCE)}
        >
          <FaChartPie />
          Performance
        </Tab>
      </TabBar>
      
      {!minimized && renderContent()}
    </ChatPanelContainer>
  );
};

export default ChatPanel; 