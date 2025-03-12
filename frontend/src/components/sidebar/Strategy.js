import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaRobot, 
  FaPlay, 
  FaBell, 
  FaChartLine, 
  FaForward,
  FaChartArea
} from 'react-icons/fa';

const StrategyContainer = styled.div`
  width: 100%;
`;

const StrategyButton = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: ${props => props.$active ? 'var(--accent-color)' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color);
  }
  
  ${props => props.$active && `
    background: rgba(41, 98, 255, 0.1);
  `}
  
  svg {
    margin-right: 12px;
    font-size: 16px;
  }
`;

const StrategyDescription = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const Strategy = ({ activeView, onViewChange }) => {
  const navigate = useNavigate();
  
  const strategies = [
    { 
      id: 'STRATEGY_BUILDER', 
      icon: FaRobot, 
      label: 'Strategy Builder AI',
      description: 'Create trading strategies using AI assistance',
      route: '/strategy/builder'
    },
    { 
      id: 'STRATEGY_RUNNER', 
      icon: FaPlay, 
      label: 'Strategy Runner',
      description: 'Run and monitor your active strategies',
      route: '/strategy/runner'
    },
    { 
      id: 'STRATEGY_NOTIFICATION', 
      icon: FaBell, 
      label: 'Notifications',
      description: 'Configure alerts and notifications for your strategies',
      route: '/strategy/notifications'
    },
    { 
      id: 'STRATEGY_BACKTEST', 
      icon: FaChartLine, 
      label: 'Backtest',
      description: 'Test strategies against historical data',
      route: '/strategy/backtest'
    },
    { 
      id: 'STRATEGY_FORWARD_TEST', 
      icon: FaForward, 
      label: 'Forward Test',
      description: 'Test strategies with paper trading',
      route: '/strategy/forward-test'
    },
    { 
      id: 'STRATEGY_PERFORMANCE', 
      icon: FaChartArea, 
      label: 'Performance',
      description: 'View performance metrics for your strategies',
      route: '/strategy/performance'
    }
  ];

  const handleStrategyClick = (strategy) => {
    onViewChange(strategy.id);
    navigate(strategy.route);
  };

  return (
    <StrategyContainer>
      {strategies.map(strategy => (
        <StrategyButton
          key={strategy.id}
          $active={activeView === strategy.id}
          onClick={() => handleStrategyClick(strategy)}
        >
          <strategy.icon />
          <div>
            {strategy.label}
            <StrategyDescription>{strategy.description}</StrategyDescription>
          </div>
        </StrategyButton>
      ))}
    </StrategyContainer>
  );
};

export default Strategy; 