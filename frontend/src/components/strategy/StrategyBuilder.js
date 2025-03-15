import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaMinus, FaSave, FaPlay, FaTrash, FaChartLine, FaRobot } from 'react-icons/fa';

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

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
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
  margin-right: 8px;
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-hover)' : 'var(--secondary-hover)'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  margin-top: 24px;
`;

const RuleContainer = styled.div`
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
`;

const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const RuleTitle = styled.h4`
  font-size: 14px;
  margin: 0;
`;

const RuleActions = styled.div`
  display: flex;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: var(--accent-color);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StrategyBuilder = ({ symbol, timeframe, indicators = [], onSaveStrategy, onBacktestStrategy }) => {
  const [strategy, setStrategy] = useState({
    name: '',
    description: '',
    symbol: symbol || 'BTCUSDT',
    timeframe: timeframe || '1d',
    initialCapital: 10000,
    entryRules: [],
    exitRules: [],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 5,
      positionSize: 10,
      maxOpenPositions: 1
    }
  });
  
  const [newRule, setNewRule] = useState({
    type: 'entry',
    indicator: '',
    condition: 'crosses_above',
    value: '',
    valueType: 'fixed'
  });
  
  useEffect(() => {
    if (symbol) {
      setStrategy(prev => ({ ...prev, symbol }));
    }
    if (timeframe) {
      setStrategy(prev => ({ ...prev, timeframe }));
    }
  }, [symbol, timeframe]);
  
  const handleStrategyChange = (e) => {
    const { name, value } = e.target;
    setStrategy(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRiskManagementChange = (e) => {
    const { name, value } = e.target;
    setStrategy(prev => ({
      ...prev,
      riskManagement: {
        ...prev.riskManagement,
        [name]: parseFloat(value)
      }
    }));
  };
  
  const handleNewRuleChange = (e) => {
    const { name, value } = e.target;
    setNewRule(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addRule = () => {
    const rulesList = newRule.type === 'entry' ? 'entryRules' : 'exitRules';
    
    setStrategy(prev => ({
      ...prev,
      [rulesList]: [...prev[rulesList], { ...newRule, id: Date.now() }]
    }));
    
    // Reset the new rule form
    setNewRule({
      type: 'entry',
      indicator: '',
      condition: 'crosses_above',
      value: '',
      valueType: 'fixed'
    });
  };
  
  const removeRule = (type, id) => {
    const rulesList = type === 'entry' ? 'entryRules' : 'exitRules';
    
    setStrategy(prev => ({
      ...prev,
      [rulesList]: prev[rulesList].filter(rule => rule.id !== id)
    }));
  };
  
  const handleSaveStrategy = () => {
    if (onSaveStrategy) {
      onSaveStrategy(strategy);
    }
  };
  
  const handleBacktestStrategy = () => {
    if (onBacktestStrategy) {
      onBacktestStrategy(strategy);
    }
  };
  
  const getConditionText = (condition) => {
    switch (condition) {
      case 'crosses_above': return 'crosses above';
      case 'crosses_below': return 'crosses below';
      case 'is_above': return 'is above';
      case 'is_below': return 'is below';
      case 'equals': return 'equals';
      default: return condition;
    }
  };
  
  const renderRule = (rule, type) => {
    const indicatorName = rule.indicator;
    const conditionText = getConditionText(rule.condition);
    const valueText = rule.valueType === 'indicator' ? rule.value : rule.value;
    
    return (
      <RuleContainer key={rule.id}>
        <RuleHeader>
          <RuleTitle>{type === 'entry' ? 'Entry Rule' : 'Exit Rule'}</RuleTitle>
          <RuleActions>
            <IconButton onClick={() => removeRule(type, rule.id)}>
              <FaTrash />
            </IconButton>
          </RuleActions>
        </RuleHeader>
        <p>{indicatorName} {conditionText} {valueText}</p>
      </RuleContainer>
    );
  };
  
  return (
    <Container>
      <Title>Strategy Builder</Title>
      
      <Section>
        <SectionTitle>Strategy Details</SectionTitle>
        <FormGroup>
          <Label>Strategy Name</Label>
          <Input 
            type="text" 
            name="name" 
            value={strategy.name} 
            onChange={handleStrategyChange} 
            placeholder="My Trading Strategy"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Description</Label>
          <TextArea 
            name="description" 
            value={strategy.description} 
            onChange={handleStrategyChange} 
            placeholder="Describe your strategy..."
          />
        </FormGroup>
        
        <Grid>
          <FormGroup>
            <Label>Symbol</Label>
            <Input 
              type="text" 
              name="symbol" 
              value={strategy.symbol} 
              onChange={handleStrategyChange} 
              placeholder="BTCUSDT"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Timeframe</Label>
            <Select name="timeframe" value={strategy.timeframe} onChange={handleStrategyChange}>
              <option value="1m">1 minute</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="4h">4 hours</option>
              <option value="1d">1 day</option>
              <option value="1w">1 week</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Initial Capital</Label>
            <Input 
              type="number" 
              name="initialCapital" 
              value={strategy.initialCapital} 
              onChange={handleStrategyChange} 
              placeholder="10000"
            />
          </FormGroup>
        </Grid>
      </Section>
      
      <Section>
        <SectionTitle><FaChartLine /> Entry Rules</SectionTitle>
        {strategy.entryRules.map(rule => renderRule(rule, 'entry'))}
        
        <SectionTitle><FaChartLine /> Exit Rules</SectionTitle>
        {strategy.exitRules.map(rule => renderRule(rule, 'exit'))}
        
        <SectionTitle>Add New Rule</SectionTitle>
        <Grid>
          <FormGroup>
            <Label>Rule Type</Label>
            <Select name="type" value={newRule.type} onChange={handleNewRuleChange}>
              <option value="entry">Entry Rule</option>
              <option value="exit">Exit Rule</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Indicator</Label>
            <Select name="indicator" value={newRule.indicator} onChange={handleNewRuleChange}>
              <option value="">Select Indicator</option>
              {indicators.map(indicator => (
                <option key={indicator.id} value={indicator.name || indicator.type}>
                  {indicator.name || indicator.type}
                </option>
              ))}
              <option value="price">Price</option>
              <option value="volume">Volume</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Condition</Label>
            <Select name="condition" value={newRule.condition} onChange={handleNewRuleChange}>
              <option value="crosses_above">Crosses Above</option>
              <option value="crosses_below">Crosses Below</option>
              <option value="is_above">Is Above</option>
              <option value="is_below">Is Below</option>
              <option value="equals">Equals</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Value</Label>
            <Input 
              type="text" 
              name="value" 
              value={newRule.value} 
              onChange={handleNewRuleChange} 
              placeholder="Value or indicator name"
            />
          </FormGroup>
        </Grid>
        
        <Button onClick={addRule}>
          <FaPlus /> Add Rule
        </Button>
      </Section>
      
      <Section>
        <SectionTitle>Risk Management</SectionTitle>
        <Grid>
          <FormGroup>
            <Label>Stop Loss (%)</Label>
            <Input 
              type="number" 
              name="stopLoss" 
              value={strategy.riskManagement.stopLoss} 
              onChange={handleRiskManagementChange} 
              placeholder="2"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Take Profit (%)</Label>
            <Input 
              type="number" 
              name="takeProfit" 
              value={strategy.riskManagement.takeProfit} 
              onChange={handleRiskManagementChange} 
              placeholder="5"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Position Size (%)</Label>
            <Input 
              type="number" 
              name="positionSize" 
              value={strategy.riskManagement.positionSize} 
              onChange={handleRiskManagementChange} 
              placeholder="10"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Max Open Positions</Label>
            <Input 
              type="number" 
              name="maxOpenPositions" 
              value={strategy.riskManagement.maxOpenPositions} 
              onChange={handleRiskManagementChange} 
              placeholder="1"
            />
          </FormGroup>
        </Grid>
      </Section>
      
      <ButtonGroup>
        <Button primary onClick={handleSaveStrategy}>
          <FaSave /> Save Strategy
        </Button>
        <Button onClick={handleBacktestStrategy}>
          <FaPlay /> Backtest Strategy
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default StrategyBuilder; 