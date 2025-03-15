import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  StrategyBuilder, 
  BacktestResults, 
  StrategyOptimizer,
  StrategyRunner,
  Performance
} from '../components/strategy';
import * as strategyService from '../services/strategyService';
import { FaPlus, FaChartLine, FaRobot, FaPlay, FaChartBar, FaList } from 'react-icons/fa';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--primary-color);
  color: var(--text-color);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  margin-right: 16px;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button`
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent-color)' : 'var(--text-color)'};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    color: var(--accent-color);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: ${props => props.primary ? 'var(--accent-color)' : 'var(--secondary-color)'};
  color: var(--text-color);
  border: 1px solid ${props => props.primary ? 'var(--accent-color)' : 'var(--border-color)'};
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: auto;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-hover)' : 'var(--secondary-hover)'};
  }
`;

const StrategyList = styled.div`
  padding: 16px;
`;

const StrategyCard = styled.div`
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  
  &:hover {
    border-color: var(--accent-color);
  }
  
  &.selected {
    border-color: var(--accent-color);
    background-color: var(--accent-color-transparent);
  }
`;

const StrategyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StrategyName = styled.h3`
  font-size: 16px;
  margin: 0;
`;

const StrategyDetails = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const StrategyStats = styled.div`
  display: flex;
  margin-top: 8px;
  gap: 16px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

const StatValue = styled.div`
  font-size: 14px;
  color: ${props => {
    if (props.positive) return 'var(--success-color)';
    if (props.negative) return 'var(--error-color)';
    return 'var(--text-color)';
  }};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--text-secondary);
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 24px;
`;

const StrategyPage = ({ symbol, timeframe, indicators = [] }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  useEffect(() => {
    fetchStrategies();
  }, []);
  
  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const data = await strategyService.getStrategies();
      setStrategies(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      setIsLoading(false);
    }
  };
  
  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setBacktestResults(null);
    setOptimizationResults(null);
    setActiveTab('builder');
  };
  
  const handleSaveStrategy = async (strategy) => {
    try {
      setIsLoading(true);
      let savedStrategy;
      
      if (strategy.id) {
        // Update existing strategy
        savedStrategy = await strategyService.updateStrategy(strategy.id, strategy);
      } else {
        // Create new strategy
        savedStrategy = await strategyService.createStrategy(strategy);
      }
      
      setSelectedStrategy(savedStrategy);
      
      // Refresh strategies list
      await fetchStrategies();
      
      setIsLoading(false);
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving strategy:', error);
      setIsLoading(false);
    }
  };
  
  const handleSelectStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setBacktestResults(null);
    setOptimizationResults(null);
  };
  
  const handleEditStrategy = () => {
    setActiveTab('builder');
  };
  
  const handleBacktestStrategy = async (strategy) => {
    try {
      setIsLoading(true);
      setBacktestResults(null);
      
      const options = {
        timeframe: strategy.timeframe,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
        endDate: new Date().toISOString().split('T')[0] // today
      };
      
      const results = await strategyService.backtestStrategy(strategy, options);
      
      setBacktestResults(results);
      setSelectedStrategy(strategy);
      setActiveTab('backtest');
      setIsLoading(false);
    } catch (error) {
      console.error('Error backtesting strategy:', error);
      setIsLoading(false);
    }
  };
  
  const handleOptimizeStrategy = async (strategy, paramRanges) => {
    try {
      setIsOptimizing(true);
      setOptimizationProgress(0);
      setOptimizationResults(null);
      
      // Simulate optimization progress
      const progressInterval = setInterval(() => {
        setOptimizationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      
      const options = {
        timeframe: strategy.timeframe,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
        endDate: new Date().toISOString().split('T')[0] // today
      };
      
      const results = await strategyService.optimizeStrategy(strategy, paramRanges, options);
      
      clearInterval(progressInterval);
      setOptimizationProgress(100);
      setOptimizationResults(results);
      setIsOptimizing(false);
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      setIsOptimizing(false);
    }
  };
  
  const handleSaveOptimizedStrategy = async (optimizedStrategy) => {
    try {
      setIsLoading(true);
      
      // Create a new strategy based on the optimized one
      const newStrategy = {
        ...optimizedStrategy,
        name: `${optimizedStrategy.name} (Optimized)`,
        id: null // Remove ID to create a new strategy
      };
      
      const savedStrategy = await strategyService.createStrategy(newStrategy);
      
      setSelectedStrategy(savedStrategy);
      
      // Refresh strategies list
      await fetchStrategies();
      
      setIsLoading(false);
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving optimized strategy:', error);
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <StrategyList>
            {strategies.length > 0 ? (
              strategies.map(strategy => (
                <StrategyCard 
                  key={strategy.id} 
                  className={selectedStrategy && selectedStrategy.id === strategy.id ? 'selected' : ''}
                  onClick={() => handleSelectStrategy(strategy)}
                >
                  <StrategyHeader>
                    <StrategyName>{strategy.name}</StrategyName>
                  </StrategyHeader>
                  <StrategyDetails>
                    {strategy.symbol} - {strategy.timeframe}
                  </StrategyDetails>
                  <StrategyDetails>
                    {strategy.description}
                  </StrategyDetails>
                  {strategy.performance && (
                    <StrategyStats>
                      <StatItem>
                        <StatLabel>Net Profit</StatLabel>
                        <StatValue positive={strategy.performance.profitPercent > 0} negative={strategy.performance.profitPercent < 0}>
                          {strategy.performance.profitPercent.toFixed(2)}%
                        </StatValue>
                      </StatItem>
                      <StatItem>
                        <StatLabel>Win Rate</StatLabel>
                        <StatValue positive={strategy.performance.winRate > 0.5} negative={strategy.performance.winRate < 0.5}>
                          {(strategy.performance.winRate * 100).toFixed(2)}%
                        </StatValue>
                      </StatItem>
                      <StatItem>
                        <StatLabel>Profit Factor</StatLabel>
                        <StatValue positive={strategy.performance.profitFactor > 1} negative={strategy.performance.profitFactor < 1}>
                          {strategy.performance.profitFactor.toFixed(2)}
                        </StatValue>
                      </StatItem>
                    </StrategyStats>
                  )}
                </StrategyCard>
              ))
            ) : (
              <EmptyState>
                <EmptyStateIcon>
                  <FaChartLine />
                </EmptyStateIcon>
                <EmptyStateText>
                  You don't have any strategies yet. Create your first strategy to get started.
                </EmptyStateText>
                <Button primary onClick={handleCreateStrategy}>
                  <FaPlus /> Create Strategy
                </Button>
              </EmptyState>
            )}
          </StrategyList>
        );
        
      case 'builder':
        return (
          <StrategyBuilder 
            symbol={symbol}
            timeframe={timeframe}
            indicators={indicators}
            strategy={selectedStrategy}
            onSaveStrategy={handleSaveStrategy}
            onBacktestStrategy={handleBacktestStrategy}
          />
        );
        
      case 'backtest':
        return (
          <BacktestResults 
            strategy={selectedStrategy}
            results={backtestResults}
            onOptimize={() => setActiveTab('optimizer')}
            onRerun={() => handleBacktestStrategy(selectedStrategy)}
            onEditStrategy={handleEditStrategy}
            onExport={() => {}}
          />
        );
        
      case 'optimizer':
        return (
          <StrategyOptimizer 
            strategy={selectedStrategy}
            onOptimize={handleOptimizeStrategy}
            onSaveOptimizedStrategy={handleSaveOptimizedStrategy}
            isOptimizing={isOptimizing}
            optimizationProgress={optimizationProgress}
            optimizationResults={optimizationResults}
          />
        );
        
      case 'runner':
        return (
          <StrategyRunner 
            strategy={selectedStrategy}
            onAction={() => {}}
          />
        );
        
      case 'performance':
        return (
          <Performance 
            strategy={selectedStrategy}
            onAction={() => {}}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>Trading Strategies</Title>
        {activeTab === 'list' && (
          <Button primary onClick={handleCreateStrategy}>
            <FaPlus /> Create Strategy
          </Button>
        )}
      </Header>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'list'} 
          onClick={() => setActiveTab('list')}
        >
          <FaList /> Strategies
        </Tab>
        <Tab 
          active={activeTab === 'builder'} 
          onClick={() => setActiveTab('builder')}
        >
          <FaPlus /> Builder
        </Tab>
        <Tab 
          active={activeTab === 'backtest'} 
          onClick={() => setActiveTab('backtest')}
          disabled={!selectedStrategy}
        >
          <FaPlay /> Backtest
        </Tab>
        <Tab 
          active={activeTab === 'optimizer'} 
          onClick={() => setActiveTab('optimizer')}
          disabled={!selectedStrategy}
        >
          <FaRobot /> Optimizer
        </Tab>
        <Tab 
          active={activeTab === 'runner'} 
          onClick={() => setActiveTab('runner')}
          disabled={!selectedStrategy}
        >
          <FaPlay /> Runner
        </Tab>
        <Tab 
          active={activeTab === 'performance'} 
          onClick={() => setActiveTab('performance')}
          disabled={!selectedStrategy}
        >
          <FaChartBar /> Performance
        </Tab>
      </TabContainer>
      
      <Content>
        {renderContent()}
      </Content>
    </Container>
  );
};

export default StrategyPage; 