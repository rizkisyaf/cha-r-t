import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  background-color: var(--primary-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-color);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  
  &:hover {
    color: var(--text-color);
  }
`;

const SearchContainer = styled.div`
  padding: 16px 20px;
  position: relative;
  border-bottom: 1px solid var(--border-color);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 14px;
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
`;

const FilterButton = styled.button`
  background-color: ${props => props.$active ? 'var(--accent-color)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'var(--accent-color)' : 'var(--border-color)'};
  color: ${props => props.$active ? 'white' : 'var(--text-color)'};
  padding: 6px 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$active ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const FilterDropdown = styled.div`
  position: relative;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const DropdownButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  svg {
    margin-left: 6px;
    font-size: 10px;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const SymbolIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.$color || '#1E88E5'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  margin-right: 16px;
  font-size: 14px;
`;

const SymbolInfo = styled.div`
  flex: 1;
`;

const SymbolName = styled.div`
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
`;

const SymbolDescription = styled.div`
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 2px;
`;

const ExchangeInfo = styled.div`
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 12px;
`;

const CountryFlag = styled.img`
  width: 16px;
  height: 12px;
  margin-left: 8px;
`;

const ModalFooter = styled.div`
  padding: 12px 20px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
  border-top: 1px solid var(--border-color);
`;

const SymbolSearch = ({ isOpen, onClose, onSelectSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const modalRef = useRef(null);
  
  // Mock data for symbols
  const symbols = [
    { symbol: 'TSLA', name: 'TESLA, INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'NVDA', name: 'NVIDIA CORPORATION', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'AAPL', name: 'APPLE INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'AMZN', name: 'AMAZON.COM, INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'PLTR', name: 'PALANTIR TECHNOLOGIES INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'MSTR', name: 'MICROSTRATEGY INCORPORATED', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'META', name: 'META PLATFORMS, INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'MSFT', name: 'MICROSOFT CORPORATION', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'AMD', name: 'ADVANCED MICRO DEVICES, INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'GOOGL', name: 'ALPHABET INC.', exchange: 'NASDAQ', country: 'us' },
    { symbol: 'COIN', name: 'COINBASE GLOBAL, INC.', exchange: 'NASDAQ', country: 'us' },
  ];
  
  const filters = ['All', 'Stocks', 'Funds', 'Futures', 'Forex', 'Crypto', 'Indices', 'Bonds', 'Economy', 'Options'];
  
  // Filter symbols based on search term and active filter
  const filteredSymbols = symbols.filter(symbol => {
    const matchesSearch = searchTerm === '' || 
      symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
      symbol.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'All' || 
      (activeFilter === 'Stocks' && ['NASDAQ', 'NYSE'].includes(symbol.exchange));
    
    return matchesSearch && matchesFilter;
  });
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay>
      <ModalContent ref={modalRef}>
        <ModalHeader>
          <ModalTitle>Symbol Search</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        
        <SearchContainer>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </SearchContainer>
        
        <FilterContainer>
          {filters.map((filter) => (
            <FilterButton 
              key={filter}
              $active={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </FilterButton>
          ))}
          
          <FilterDropdown>
            <DropdownButton>
              All countries <FaSearch />
            </DropdownButton>
          </FilterDropdown>
          
          <FilterDropdown>
            <DropdownButton>
              All types <FaSearch />
            </DropdownButton>
          </FilterDropdown>
          
          <FilterDropdown>
            <DropdownButton>
              All sectors <FaSearch />
            </DropdownButton>
          </FilterDropdown>
        </FilterContainer>
        
        <ResultsContainer>
          {filteredSymbols.map((item) => (
            <ResultItem 
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
            >
              <SymbolIcon>
                {item.symbol.charAt(0)}
              </SymbolIcon>
              <SymbolInfo>
                <SymbolName>{item.symbol}</SymbolName>
                <SymbolDescription>{item.name}</SymbolDescription>
              </SymbolInfo>
              <ExchangeInfo>
                stock {item.exchange}
                <CountryFlag src={`https://flagcdn.com/w20/${item.country}.png`} alt={item.country} />
              </ExchangeInfo>
            </ResultItem>
          ))}
        </ResultsContainer>
        
        <ModalFooter>
          Simply start typing while on the chart to pull up this search box
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SymbolSearch; 