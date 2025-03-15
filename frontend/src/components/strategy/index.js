import React from 'react';
import styled from 'styled-components';
import StrategyBuilder from './StrategyBuilder';
import BacktestResults from './BacktestResults';
import StrategyOptimizer from './StrategyOptimizer';

const Container = styled.div`
  padding: 16px;
  color: var(--text-color);
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-color);
`;

const Message = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
`;

export { StrategyBuilder, BacktestResults, StrategyOptimizer };

export const StrategyRunner = ({ state, onAction }) => (
  <Container>
    <Title>Strategy Runner</Title>
    <Message>Run and monitor your active trading strategies</Message>
  </Container>
);

export const Notifications = ({ state, onAction }) => (
  <Container>
    <Title>Strategy Notifications</Title>
    <Message>Configure and view strategy notifications</Message>
  </Container>
);

export const Backtest = ({ state, onAction }) => (
  <Container>
    <Title>Strategy Backtest</Title>
    <Message>Test your strategies against historical data</Message>
  </Container>
);

export const ForwardTest = ({ state, onAction }) => (
  <Container>
    <Title>Strategy Forward Test</Title>
    <Message>Test your strategies in real-time with paper trading</Message>
  </Container>
);

export const Performance = ({ state, onAction }) => (
  <Container>
    <Title>Strategy Performance</Title>
    <Message>View detailed performance metrics for your strategies</Message>
  </Container>
);