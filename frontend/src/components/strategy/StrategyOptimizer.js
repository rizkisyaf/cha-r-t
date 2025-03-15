import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChartLine, FaPlay, FaSave, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr'};
  gap: 12px;
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const ParameterCard = styled.div`
  background-color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
`;

const ParameterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ParameterTitle = styled.h4`
  font-size: 14px;
  margin: 0;
`;

const ParameterActions = styled.div`
  display: flex;
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
  
  &.selected {
    background-color: var(--accent-color-transparent);
  }
`;

const ProgressContainer = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--secondary-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: var(--accent-color);
  width: ${props => props.progress || '0%'};
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
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

const StrategyOptimizer = ({ 
  strategy, 
  onOptimize, 
  onSaveOptimizedStrategy, 
  isOptimizing = false,
  optimizationProgress = 0,
  optimizationResults = null
}) => {
  const [parameters, setParameters] = useState([]);
  const [newParameter, setNewParameter] = useState({
    name: '',
    type: 'numeric',
    start: '',
    end: '',
    step: '',
    values: ''
  });
  const [selectedResult, setSelectedResult] = useState(null);
  
  const handleNewParameterChange = (e) => {
    const { name, value } = e.target;
    setNewParameter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addParameter = () => {
    // Validate parameter
    if (!newParameter.name) return;
    
    if (newParameter.type === 'numeric') {
      if (!newParameter.start || !newParameter.end || !newParameter.step) return;
    } else if (newParameter.type === 'categorical') {
      if (!newParameter.values) return;
    }
    
    // Add parameter
    setParameters(prev => [...prev, { ...newParameter, id: Date.now() }]);
    
    // Reset form
    setNewParameter({
      name: '',
      type: 'numeric',
      start: '',
      end: '',
      step: '',
      values: ''
    });
  };
  
  const removeParameter = (id) => {
    setParameters(prev => prev.filter(param => param.id !== id));
  };
  
  const handleOptimize = () => {
    if (onOptimize) {
      const paramRanges = {};
      
      parameters.forEach(param => {
        if (param.type === 'numeric') {
          const start = parseFloat(param.start);
          const end = parseFloat(param.end);
          const step = parseFloat(param.step);
          
          const values = [];
          for (let i = start; i <= end; i += step) {
            values.push(i);
          }
          
          paramRanges[param.name] = values;
        } else if (param.type === 'categorical') {
          paramRanges[param.name] = param.values.split(',').map(v => v.trim());
        }
      });
      
      onOptimize(strategy, paramRanges);
    }
  };
  
  const handleSaveOptimizedStrategy = () => {
    if (onSaveOptimizedStrategy && selectedResult) {
      onSaveOptimizedStrategy(selectedResult.strategy);
    }
  };
  
  const renderParameterForm = () => (
    <Card>
      <Grid columns="1fr 1fr 1fr">
        <FormGroup>
          <Label>Parameter Name</Label>
          <Input 
            type="text" 
            name="name" 
            value={newParameter.name} 
            onChange={handleNewParameterChange} 
            placeholder="e.g., stopLoss, period"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Parameter Type</Label>
          <Select 
            name="type" 
            value={newParameter.type} 
            onChange={handleNewParameterChange}
          >
            <option value="numeric">Numeric Range</option>
            <option value="categorical">Categorical Values</option>
          </Select>
        </FormGroup>
      </Grid>
      
      {newParameter.type === 'numeric' ? (
        <Grid columns="1fr 1fr 1fr">
          <FormGroup>
            <Label>Start Value</Label>
            <Input 
              type="number" 
              name="start" 
              value={newParameter.start} 
              onChange={handleNewParameterChange} 
              placeholder="e.g., 1"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>End Value</Label>
            <Input 
              type="number" 
              name="end" 
              value={newParameter.end} 
              onChange={handleNewParameterChange} 
              placeholder="e.g., 10"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Step Size</Label>
            <Input 
              type="number" 
              name="step" 
              value={newParameter.step} 
              onChange={handleNewParameterChange} 
              placeholder="e.g., 1"
            />
          </FormGroup>
        </Grid>
      ) : (
        <FormGroup>
          <Label>Values (comma-separated)</Label>
          <Input 
            type="text" 
            name="values" 
            value={newParameter.values} 
            onChange={handleNewParameterChange} 
            placeholder="e.g., SMA, EMA, MACD"
          />
        </FormGroup>
      )}
      
      <Button onClick={addParameter}>
        <FaPlus /> Add Parameter
      </Button>
    </Card>
  );
  
  const renderParameterList = () => (
    <div>
      {parameters.map(param => (
        <ParameterCard key={param.id}>
          <ParameterHeader>
            <ParameterTitle>{param.name}</ParameterTitle>
            <ParameterActions>
              <IconButton onClick={() => removeParameter(param.id)}>
                <FaTrash />
              </IconButton>
            </ParameterActions>
          </ParameterHeader>
          
          <p>
            {param.type === 'numeric' 
              ? `Range: ${param.start} to ${param.end} (step: ${param.step})` 
              : `Values: ${param.values}`}
          </p>
        </ParameterCard>
      ))}
      
      {parameters.length === 0 && (
        <p>No parameters added yet. Add parameters to optimize.</p>
      )}
    </div>
  );
  
  const renderOptimizationProgress = () => (
    <ProgressContainer>
      <ProgressBar>
        <ProgressFill progress={`${optimizationProgress}%`} />
      </ProgressBar>
      <ProgressText>
        <span>Optimization in progress...</span>
        <span>{optimizationProgress}%</span>
      </ProgressText>
    </ProgressContainer>
  );
  
  const renderOptimizationResults = () => {
    if (!optimizationResults || !optimizationResults.results || optimizationResults.results.length === 0) {
      return <p>No optimization results available.</p>;
    }
    
    return (
      <>
        <Table>
          <thead>
            <Tr>
              <Th>Rank</Th>
              {parameters.map(param => (
                <Th key={param.id}>{param.name}</Th>
              ))}
              <Th>Net Profit</Th>
              <Th>Win Rate</Th>
              <Th>Profit Factor</Th>
              <Th>Max Drawdown</Th>
            </Tr>
          </thead>
          <tbody>
            {optimizationResults.results.map((result, index) => (
              <Tr 
                key={index} 
                className={selectedResult === result ? 'selected' : ''}
                onClick={() => setSelectedResult(result)}
              >
                <Td>{index + 1}</Td>
                {parameters.map(param => (
                  <Td key={param.id}>{result.strategy.parameters[param.name]}</Td>
                ))}
                <Td style={{ color: result.profitPercent > 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
                  {result.profitPercent.toFixed(2)}%
                </Td>
                <Td>{(result.winRate * 100).toFixed(2)}%</Td>
                <Td>{result.profitFactor.toFixed(2)}</Td>
                <Td>{result.maxDrawdownPercent.toFixed(2)}%</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        
        <Section>
          <SectionTitle>Parameter Impact</SectionTitle>
          <ChartPlaceholder>
            Parameter impact chart will be displayed here
          </ChartPlaceholder>
        </Section>
      </>
    );
  };
  
  return (
    <Container>
      <Title><FaChartLine /> Strategy Optimizer</Title>
      
      <Section>
        <SectionTitle>Strategy to Optimize</SectionTitle>
        <Card>
          <p><strong>Name:</strong> {strategy.name}</p>
          <p><strong>Symbol:</strong> {strategy.symbol}</p>
          <p><strong>Timeframe:</strong> {strategy.timeframe}</p>
        </Card>
      </Section>
      
      <Section>
        <SectionTitle>Parameters to Optimize</SectionTitle>
        {renderParameterForm()}
        {renderParameterList()}
      </Section>
      
      <ButtonGroup>
        <Button 
          primary 
          onClick={handleOptimize} 
          disabled={isOptimizing || parameters.length === 0}
        >
          {isOptimizing ? (
            <>
              <FaSpinner /> Optimizing...
            </>
          ) : (
            <>
              <FaPlay /> Start Optimization
            </>
          )}
        </Button>
      </ButtonGroup>
      
      {isOptimizing && renderOptimizationProgress()}
      
      {optimizationResults && (
        <Section>
          <SectionTitle>Optimization Results</SectionTitle>
          {renderOptimizationResults()}
          
          <ButtonGroup>
            <Button 
              primary 
              onClick={handleSaveOptimizedStrategy} 
              disabled={!selectedResult}
            >
              <FaSave /> Save Optimized Strategy
            </Button>
          </ButtonGroup>
        </Section>
      )}
    </Container>
  );
};

export default StrategyOptimizer; 