import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { 
  FaPaperPlane, 
  FaMicrophone, 
  FaRobot,
  FaLightbulb,
  FaChartLine
} from 'react-icons/fa';

// Styled components for the AI Assistant Panel
const AssistantPanelContainer = styled.div`
  display: flex;
  height: 100%;
  flex-shrink: 0;
  z-index: 100;
  width: ${props => props.$isVisible ? '33.33%' : '40px'};
  transition: width 0.3s ease;
  background-color: var(--primary-color);
  border-left: 1px solid var(--border-color);
`;

const ToggleButton = styled.button`
  width: 40px;
  height: 40px;
  background-color: var(--primary-color);
  border: none;
  border-right: ${props => props.$isVisible ? '1px solid var(--border-color)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color);
  flex-shrink: 0;
  padding: 0;
  
  &:hover {
    color: var(--accent-color);
  }
  
  svg {
    font-size: 18px;
  }
`;

const AssistantContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: ${props => props.$isVisible ? 'calc(100% - 40px)' : '0'};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transition: width 0.3s ease, visibility 0.3s;
`;

const AssistantHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-color);
`;

const AssistantTitle = styled.div`
  color: var(--text-color);
  font-weight: 500;
  font-size: 16px;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
`;

const Message = styled.div`
  display: flex;
  margin-bottom: 12px;
  justify-content: ${props => props.type === 'system' ? 'center' : 'flex-start'};
  
  ${props => props.type === 'user' && `
    justify-content: flex-end;
  `}
  
  ${props => props.type === 'system' && `
    max-width: 80%;
    margin-left: auto;
    margin-right: auto;
  `}
`;

const MessageContent = styled.div`
  padding: ${props => props.type === 'system' ? '6px 10px' : '12px 16px'};
  border-radius: 12px;
  max-width: ${props => props.type === 'system' ? '100%' : '80%'};
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
    white-space: normal;
    width: auto;
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
    color: var(--text-color);
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
    border-left: 4px solid var(--text-secondary);
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
    background-color: var(--text-secondary);
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
`;

const ChatInput = styled.input`
  flex: 1;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 10px 16px;
  color: var(--text-color);
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: var(--accent-color);
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SendButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--accent-color);
  }
  
  &:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
  }
  
  svg {
    font-size: 16px;
  }
`;

const MicButton = styled(SendButton)`
  background-color: var(--secondary-color);
  
  &:hover {
    background-color: var(--accent-color);
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }
`;

const QuickActionButton = styled.button`
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 6px 12px;
  color: var(--text-color);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: var(--secondary-color);
    border-color: var(--text-secondary);
  }
  
  svg {
    margin-right: 6px;
    font-size: 12px;
  }
`;

const AIAssistantPanel = ({ 
  messages, 
  onSendMessage, 
  connected = false,
  isAiTyping = false,
  agentMemory = {}
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  
  // Quick actions for the AI assistant
  const quickActions = [
    { icon: FaLightbulb, label: 'Explain this chart', action: 'explain_chart' },
    { icon: FaChartLine, label: 'Add SMA indicator', action: 'add_sma' },
    { icon: FaChartLine, label: 'Add RSI indicator', action: 'add_rsi' },
    { icon: FaChartLine, label: 'Add MACD indicator', action: 'add_macd' }
  ];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const handleQuickAction = (action) => {
    if (onSendMessage) {
      switch (action) {
        case 'explain_chart':
          onSendMessage("Explain what I'm seeing in this chart");
          break;
        case 'add_sma':
          onSendMessage("Add a Simple Moving Average indicator with period 20");
          break;
        case 'add_rsi':
          onSendMessage("Add a Relative Strength Index indicator");
          break;
        case 'add_macd':
          onSendMessage("Add a MACD indicator");
          break;
        default:
          break;
      }
    }
  };
  
  const renderMessageContent = (message) => {
    if (message.type === 'ai') {
      return (
        <AIMessageContent>
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </AIMessageContent>
      );
    } else if (message.type === 'system') {
      // For system messages, ensure they display properly in a single line
      return <p style={{ margin: 0, whiteSpace: 'normal' }}>{message.text}</p>;
    }
    
    return <p>{message.text}</p>;
  };
  
  return (
    <AssistantPanelContainer $isVisible={isVisible}>
      <ToggleButton onClick={toggleVisibility} $isVisible={isVisible}>
        <FaRobot />
      </ToggleButton>
      
      <AssistantContent $isVisible={isVisible}>
        <AssistantHeader>
          <AssistantTitle>
            AI Assistant
          </AssistantTitle>
        </AssistantHeader>
        
        <ChatMessages>
          {messages.map((message, index) => (
            <Message key={index} type={message.type}>
              <MessageContent type={message.type}>
                {renderMessageContent(message)}
              </MessageContent>
            </Message>
          ))}
          
          {isAiTyping && (
            <Message type="ai">
              <MessageContent type="ai">
                <TypingIndicator>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </TypingIndicator>
              </MessageContent>
            </Message>
          )}
          
          <div ref={messagesEndRef} />
        </ChatMessages>
        
        <QuickActions>
          {quickActions.map((action, index) => (
            <QuickActionButton 
              key={index}
              onClick={() => handleQuickAction(action.action)}
            >
              <action.icon />
              {action.label}
            </QuickActionButton>
          ))}
        </QuickActions>
        
        <ChatInputContainer>
          <ChatInput
            type="text"
            placeholder="Ask me anything about your chart..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <MicButton title="Voice input">
            <FaMicrophone />
          </MicButton>
          <SendButton 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !connected}
            title={!connected ? "Not connected to AI service" : "Send message"}
          >
            <FaPaperPlane />
          </SendButton>
        </ChatInputContainer>
      </AssistantContent>
    </AssistantPanelContainer>
  );
};

export default AIAssistantPanel; 