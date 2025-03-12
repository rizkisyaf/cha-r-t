import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaTimes, 
  FaStar, 
  FaUser, 
  FaChartLine, 
  FaChartBar, 
  FaUsers,
  FaSearch,
  FaInfoCircle,
  FaPlus
} from 'react-icons/fa';
import { getIndicatorsMetadata } from './types';

const IndicatorsDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--primary-color);
  border-radius: 8px;
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  z-index: 1000;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-color);
  }

  button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 16px;
    padding: 4px;

    &:hover {
      color: var(--text-color);
    }
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  
  svg {
    color: var(--text-secondary);
    margin-right: 8px;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--text-secondary);
  }
`;

const DialogContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
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

const IndicatorDescription = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
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

// Mock usage counts for indicators
const USAGE_COUNTS = {
  'SMA': '1.2K',
  'EMA': '2.3K',
  'RSI': '6.2K',
  'BB': '4.1K',
  'MACD': '9.9K'
};

const IndicatorsModal = ({ isOpen, onClose, onAddIndicator }) => {
  const [selectedCategory, setSelectedCategory] = useState('technicals');
  const [searchQuery, setSearchQuery] = useState('');
  const [indicators, setIndicators] = useState([]);

  // Load indicators metadata
  useEffect(() => {
    setIndicators(getIndicatorsMetadata());
  }, []);

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === indicator.category;
    return matchesSearch && matchesCategory;
  });

  const handleAddIndicator = (indicator) => {
    onAddIndicator({
      type: indicator.type,
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
              <IndicatorItem key={indicator.type}>
                <IndicatorInfo>
                  <IndicatorName>
                    {indicator.name}
                    <FaInfoCircle 
                      style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
                      title={indicator.description}
                    />
                  </IndicatorName>
                  <IndicatorDescription>{indicator.description}</IndicatorDescription>
                  <IndicatorAuthor>{indicator.author}</IndicatorAuthor>
                </IndicatorInfo>
                <UsageCount>{USAGE_COUNTS[indicator.type] || '0'}</UsageCount>
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