import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChartLine, FaChartBar, FaDownload, FaRedo, FaEdit } from 'react-icons/fa';

const Container = styled.div`
  padding: 16px;
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
`;

const Card = styled.div`
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const MetricCard = styled.div`
  background-color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${props => {
    if (props.positive) return 'var(--success-color)';
    if (props.negative) return 'var(--error-color)';
    return 'var(--text-color)';
  }};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
`;

const Td = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
  color: var(--text-color);
`;

const Tr = styled.tr`
  &:hover {
    background-color: var(--hover-color);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  margin-top: 16px;
  gap: 8px;
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
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-hover)' : 'var(--secondary-hover)'};
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button`
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent-color)' : 'var(--text-color)'};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const ChartPlaceholder = styled.div`
  width: 100%;
  height: 300px;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
`;

const BacktestResults = ({ 
  strategy, 
  results, 
  onOptimize, 
  onRerun, 
  onEditStrategy, 
  onExport 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!results) {
    return (
      <Container>
        <Title><FaChartLine /> Backtest Results</Title>
        <p>No backtest results available. Run a backtest first.</p>
      </Container>
    );
  }
  
  const {
    initialCapital,
    finalCapital,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdownPercent,
    averageProfit,
    averageLoss,
    trades
  } = results;
  
  const profitPercent = ((finalCapital / initialCapital) - 1) * 100;
  
  const renderOverview = () => (
    <>
      <Section>
        <SectionTitle>Performance Metrics</SectionTitle>
        <Grid>
          <MetricCard>
            <MetricLabel>Net Profit</MetricLabel>
            <MetricValue positive={profitPercent > 0} negative={profitPercent < 0}>
              {profitPercent.toFixed(2)}%
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Win Rate</MetricLabel>
            <MetricValue positive={winRate > 0.5} negative={winRate < 0.5}>
              {(winRate * 100).toFixed(2)}%
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Profit Factor</MetricLabel>
            <MetricValue positive={profitFactor > 1} negative={profitFactor < 1}>
              {profitFactor.toFixed(2)}
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Max Drawdown</MetricLabel>
            <MetricValue negative={true}>
              {maxDrawdownPercent.toFixed(2)}%
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Total Trades</MetricLabel>
            <MetricValue>
              {totalTrades}
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Winning Trades</MetricLabel>
            <MetricValue positive={true}>
              {winningTrades}
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Losing Trades</MetricLabel>
            <MetricValue negative={true}>
              {losingTrades}
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Avg. Profit</MetricLabel>
            <MetricValue positive={true}>
              {averageProfit.toFixed(2)}%
            </MetricValue>
          </MetricCard>
          
          <MetricCard>
            <MetricLabel>Avg. Loss</MetricLabel>
            <MetricValue negative={true}>
              {averageLoss.toFixed(2)}%
            </MetricValue>
          </MetricCard>
        </Grid>
      </Section>
      
      <Section>
        <SectionTitle>Equity Curve</SectionTitle>
        <ChartPlaceholder>
          Equity curve chart will be displayed here
        </ChartPlaceholder>
      </Section>
    </>
  );
  
  const renderTrades = () => (
    <Section>
      <SectionTitle>Trade History</SectionTitle>
      <Table>
        <thead>
          <Tr>
            <Th>#</Th>
            <Th>Entry Date</Th>
            <Th>Exit Date</Th>
            <Th>Direction</Th>
            <Th>Entry Price</Th>
            <Th>Exit Price</Th>
            <Th>Profit/Loss</Th>
            <Th>P/L %</Th>
          </Tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <Tr key={index}>
              <Td>{index + 1}</Td>
              <Td>{new Date(trade.entryTime).toLocaleString()}</Td>
              <Td>{new Date(trade.exitTime).toLocaleString()}</Td>
              <Td>{trade.direction}</Td>
              <Td>{trade.entryPrice.toFixed(2)}</Td>
              <Td>{trade.exitPrice.toFixed(2)}</Td>
              <Td style={{ color: trade.profit > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                {trade.profit.toFixed(2)}
              </Td>
              <Td style={{ color: trade.profitPercent > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                {trade.profitPercent.toFixed(2)}%
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Section>
  );
  
  const renderAnalysis = () => (
    <Section>
      <SectionTitle>Strategy Analysis</SectionTitle>
      <Card>
        <p>
          This strategy performed {profitPercent > 0 ? 'well' : 'poorly'} during the backtest period, 
          generating a {profitPercent.toFixed(2)}% return on investment.
        </p>
        <p>
          With a win rate of {(winRate * 100).toFixed(2)}% and a profit factor of {profitFactor.toFixed(2)}, 
          the strategy {profitFactor > 1.5 ? 'shows promise' : 'needs improvement'}.
        </p>
        <p>
          The maximum drawdown was {maxDrawdownPercent.toFixed(2)}%, which is 
          {maxDrawdownPercent < 20 ? ' acceptable' : ' concerning'}.
        </p>
        
        <SectionTitle>Recommendations</SectionTitle>
        <ul>
          {profitFactor < 1.5 && (
            <li>Consider adjusting your entry rules to improve the win rate.</li>
          )}
          {maxDrawdownPercent > 20 && (
            <li>Implement tighter stop-loss rules to reduce maximum drawdown.</li>
          )}
          {averageLoss > 5 && (
            <li>Your average loss is high. Consider using smaller position sizes or tighter stop losses.</li>
          )}
          {winRate < 0.4 && (
            <li>The win rate is low. Consider using more conservative entry criteria.</li>
          )}
          {winRate > 0.6 && averageProfit < averageLoss * 0.5 && (
            <li>Your win rate is good, but your average profit is small compared to your average loss. Consider letting profits run longer.</li>
          )}
        </ul>
      </Card>
    </Section>
  );
  
  return (
    <Container>
      <Title><FaChartLine /> Backtest Results: {strategy.name}</Title>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Tab>
        <Tab 
          active={activeTab === 'trades'} 
          onClick={() => setActiveTab('trades')}
        >
          Trades
        </Tab>
        <Tab 
          active={activeTab === 'analysis'} 
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </Tab>
      </TabContainer>
      
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'trades' && renderTrades()}
      {activeTab === 'analysis' && renderAnalysis()}
      
      <ButtonGroup>
        <Button onClick={onRerun}>
          <FaRedo /> Re-run Backtest
        </Button>
        <Button onClick={onOptimize}>
          <FaChartBar /> Optimize Strategy
        </Button>
        <Button onClick={onEditStrategy}>
          <FaEdit /> Edit Strategy
        </Button>
        <Button onClick={onExport}>
          <FaDownload /> Export Results
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default BacktestResults; 