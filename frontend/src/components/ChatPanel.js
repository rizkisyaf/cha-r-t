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
  FaCode
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
  flex-direction: column;
  max-width: ${props => props.$maximized === 'true' ? '90%' : '80%'};
  
  ${props => props.type === 'user' && `
    align-self: flex-end;
  `}
  
  ${props => props.type === 'ai' && `
    align-self: flex-start;
    width: 100%;
  `}
  
  ${props => props.type === 'system' && `
    align-self: center;
    max-width: 90%;
  `}
`;

const MessageContent = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  
  ${props => props.type === 'user' && `
    background-color: var(--accent-color);
    color: white;
    border-bottom-right-radius: 0;
  `}
  
  ${props => props.type === 'system' && `
    background-color: rgba(41, 98, 255, 0.1);
    color: var(--text-color);
    border: 1px solid rgba(41, 98, 255, 0.2);
  `}
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
  background-color: var(--secondary-color);
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  color: var(--text-color);
  outline: none;
  
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

const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  connected = false,
  strategyState,
  onStrategyAction
}) => {
  const [inputValue, setInputValue] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.CHAT);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !minimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);
  
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
  
  // Render message content based on type
  const renderMessageContent = (message) => {
    if (message.type === 'ai') {
      return (
        <AIMessageContent>
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </AIMessageContent>
      );
    } else {
      return (
        <MessageContent type={message.type}>
          {message.text}
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
              <div ref={messagesEndRef} />
            </ChatMessages>
            
            <ChatInputContainer $minimized={minimized.toString()}>
              <ChatInput
                type="text"
                placeholder="Ask anything about the chart..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <InputButton title="Voice input">
                <FaMicrophone />
              </InputButton>
              <InputButton 
                title="Send message" 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
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