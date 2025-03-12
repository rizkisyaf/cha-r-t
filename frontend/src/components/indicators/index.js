import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaStar, FaUser, FaChartLine, FaChartBar, FaUsers, FaPlus, FaInfoCircle, FaTimes } from 'react-icons/fa';

const IndicatorsDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  max-width: 90vw;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-color);
  }

  button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    font-size: 20px;
    
    &:hover {
      color: var(--text-color);
    }
  }
`;

const SearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  position: relative;

  svg {
    position: absolute;
    left: 34px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 16px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 16px 8px 36px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const DialogContent = styled.div`
  display: flex;
  height: 600px;
  max-height: 70vh;
`;

const Sidebar = styled.div`
  width: 200px;
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
`;

const SidebarItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  &.active {
    background-color: rgba(41, 98, 255, 0.1);
    color: var(--accent-color);
  }
  
  svg {
    margin-right: 12px;
    font-size: 16px;
  }
`;

const IndicatorsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const IndicatorItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const IndicatorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IndicatorName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IndicatorAuthor = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

const UsageCount = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: auto;
  padding-right: 16px;
`;

const AddButton = styled.button`
  background: transparent;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  padding: 8px;
  
  &:hover {
    color: var(--text-color);
  }
  
  svg {
    font-size: 16px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const CATEGORIES = [
  { id: 'favorites', name: 'Favorites', icon: FaStar },
  { id: 'personal', name: 'Personal', icon: FaUser },
  { id: 'technicals', name: 'Technicals', icon: FaChartLine },
  { id: 'financials', name: 'Financials', icon: FaChartBar },
  { id: 'community', name: 'Community', icon: FaUsers }
];

const INDICATORS = [
  {
    id: 'sma',
    name: 'Simple Moving Average',
    category: 'technicals',
    author: 'TradingView',
    usageCount: '1K',
    type: 'SMA',
    defaultSettings: { period: 20 }
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average',
    category: 'technicals',
    author: 'TradingView',
    usageCount: '2.3K',
    type: 'EMA',
    defaultSettings: { period: 20 }
  },
  {
    id: 'bb',
    name: 'Bollinger Bands',
    category: 'technicals',
    author: 'TradingView',
    usageCount: '4.1K',
    type: 'BB',
    defaultSettings: { period: 20, stdDev: 2 }
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index',
    category: 'technicals',
    author: 'TradingView',
    usageCount: '6.2K',
    type: 'RSI',
    defaultSettings: { period: 14 }
  },
  {
    id: 'macd',
    name: 'MACD',
    category: 'technicals',
    author: 'TradingView',
    usageCount: '9.9K',
    type: 'MACD',
    defaultSettings: { 
      fastPeriod: 12, 
      slowPeriod: 26, 
      signalPeriod: 9 
    }
  }
];

const IndicatorsModal = ({ isOpen, onClose, onAddIndicator }) => {
  const [selectedCategory, setSelectedCategory] = useState('technicals');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIndicators = INDICATORS.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === indicator.category;
    return matchesSearch && matchesCategory;
  });

  const handleAddIndicator = (indicator) => {
    onAddIndicator({
      type: indicator.type,
      name: indicator.name,
      isVisible: true,
      color: '#2962FF',
      ...indicator.defaultSettings
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <IndicatorsDialog>
        <DialogHeader>
          <h2>Indicators, metrics, and strategies</h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </DialogHeader>

        <SearchContainer>
          <FaSearch />
          <SearchInput 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>

        <DialogContent>
          <Sidebar>
            {CATEGORIES.map(category => (
              <SidebarItem
                key={category.id}
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
              >
                <category.icon />
                {category.name}
              </SidebarItem>
            ))}
          </Sidebar>

          <IndicatorsList>
            {filteredIndicators.map(indicator => (
              <IndicatorItem key={indicator.id}>
                <IndicatorInfo>
                  <IndicatorName>
                    {indicator.name}
                    <FaInfoCircle style={{ color: 'var(--text-secondary)', fontSize: '14px' }} />
                  </IndicatorName>
                  <IndicatorAuthor>{indicator.author}</IndicatorAuthor>
                </IndicatorInfo>
                <UsageCount>{indicator.usageCount}</UsageCount>
                <AddButton onClick={() => handleAddIndicator(indicator)}>
                  <FaPlus />
                </AddButton>
              </IndicatorItem>
            ))}
          </IndicatorsList>
        </DialogContent>
      </IndicatorsDialog>
    </>
  );
};

export default IndicatorsModal; 