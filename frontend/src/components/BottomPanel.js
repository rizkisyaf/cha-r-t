import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaCode, 
  FaChartLine, 
  FaBell, 
  FaChartBar, 
  FaForward, 
  FaChartPie,
  FaChevronUp,
  FaChevronDown
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

const BottomPanelContainer = styled.div`
  height: ${props => props.$isVisible ? '300px' : '40px'};
  background-color: var(--primary-color);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: height 0.3s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: ${props => props.$isVisible ? '1px solid var(--border-color)' : 'none'};
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  background: ${props => props.$active ? 'var(--secondary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--accent-color)' : 'var(--text-secondary)'};
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.$active ? 'var(--secondary-color)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? 'var(--accent-color)' : 'var(--text-color)'};
  }
  
  svg {
    font-size: 14px;
  }
`;

const ToggleButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  
  &:hover {
    color: var(--text-color);
  }
  
  svg {
    font-size: 16px;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  display: ${props => props.$isVisible ? 'block' : 'none'};
  
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

const CodeEditorPlaceholder = styled.div`
  padding: 16px;
  color: var(--text-color);
`;

const BottomPanel = ({ strategyState, onStrategyAction, onResize }) => {
  const [activeTab, setActiveTab] = useState('code');
  const [isVisible, setIsVisible] = useState(true);
  
  // Call onResize callback when component mounts or visibility changes
  useEffect(() => {
    if (onResize) {
      onResize(isVisible ? 300 : 40);
    }
  }, [isVisible, onResize]);
  
  const tabs = [
    { id: 'code', label: 'Code Editor', icon: FaCode },
    { id: 'strategy', label: 'Strategy Builder', icon: FaChartLine },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'backtest', label: 'Backtest', icon: FaChartBar },
    { id: 'forwardtest', label: 'Forward Test', icon: FaForward },
    { id: 'performance', label: 'Performance', icon: FaChartPie }
  ];
  
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    // Call onResize callback with the new height
    if (onResize) {
      onResize(newVisibility ? 300 : 40);
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'code':
        return (
          <CodeEditorPlaceholder>
            <h2>Code Editor</h2>
            <p>Write and execute trading algorithms</p>
          </CodeEditorPlaceholder>
        );
      case 'strategy':
        return <StrategyBuilder state={strategyState} onAction={onStrategyAction} />;
      case 'notifications':
        return <Notifications state={strategyState} onAction={onStrategyAction} />;
      case 'backtest':
        return <Backtest state={strategyState} onAction={onStrategyAction} />;
      case 'forwardtest':
        return <ForwardTest state={strategyState} onAction={onStrategyAction} />;
      case 'performance':
        return <Performance state={strategyState} onAction={onStrategyAction} />;
      default:
        return null;
    }
  };
  
  return (
    <BottomPanelContainer $isVisible={isVisible}>
      <PanelHeader $isVisible={isVisible}>
        <TabsContainer>
          {tabs.map(tab => (
            <Tab 
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
            </Tab>
          ))}
        </TabsContainer>
        <ToggleButton onClick={toggleVisibility}>
          {isVisible ? <FaChevronDown /> : <FaChevronUp />}
        </ToggleButton>
      </PanelHeader>
      <PanelContent $isVisible={isVisible}>
        {renderContent()}
      </PanelContent>
    </BottomPanelContainer>
  );
};

export default BottomPanel; 