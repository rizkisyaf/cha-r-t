import React, { useState } from 'react';
import styled from 'styled-components';
import { FaCaretUp, FaCaretDown, FaPlus, FaSearch } from 'react-icons/fa';

const WatchlistContainer = styled.div`
  width: 100%;
`;

const SearchContainer = styled.div`
  padding: 16px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px 8px 36px;
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

const SearchIcon = styled.div`
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 14px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin: 0 16px 16px;
  font-size: 14px;
  cursor: pointer;
  width: calc(100% - 32px);
  
  svg {
    margin-right: 8px;
  }
  
  &:hover {
    background-color: #1E54E5;
  }
`;

const WatchlistContent = styled.div`
  padding: 0 16px;
`;

const WatchlistItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SymbolInfo = styled.div`
  display: flex;
  align-items: center;
`;

const SymbolIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #2962FF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 10px;
  color: white;
  overflow: hidden;
`;

const SymbolDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const Symbol = styled.span`
  font-weight: 500;
  color: var(--text-color);
`;

const Volume = styled.span`
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
`;

const PriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Price = styled.span`
  color: var(--text-color);
  font-weight: 500;
`;

const Change = styled.div`
  display: flex;
  align-items: center;
  font-size: 11px;
  margin-top: 2px;
  color: ${props => props.$positive ? '#26A69A' : '#EF5350'};
  
  svg {
    font-size: 10px;
    margin-right: 2px;
  }
`;

const Watchlist = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const watchlistItems = [
    { symbol: 'RIFUSDT', icon: 'R', volume: '10.2K', price: '0.0395', change: 2.60, positive: true },
    { symbol: 'NEARUSDT', icon: 'N', volume: '14.1K', price: '2.475', change: 8.32, positive: true },
    { symbol: 'ARKMUSDT', icon: 'A', volume: '11.3K', price: '0.577', change: 25.71, positive: true },
    { symbol: 'SYNUSDT', icon: 'S', volume: '4.8K', price: '0.1730', change: 5.88, positive: false },
    { symbol: 'PENDLEUSDT', icon: 'P', volume: '3.6K', price: '2.023', change: 5.92, positive: true },
    { symbol: 'IOTXUSDT', icon: 'I', volume: '21.5K', price: '0.01645', change: 6.33, positive: true },
    { symbol: 'SYSUSDT', icon: 'S', volume: '22.7K', price: '0.0429', change: 4.38, positive: true },
    { symbol: 'RLCUSDT', icon: 'R', volume: '72.1K', price: '1.153', change: 3.59, positive: true },
    { symbol: 'THETAUSDT', icon: 'T', volume: '5.9K', price: '0.834', change: 2.58, positive: true },
    { symbol: 'JASMYUSDT', icon: 'J', volume: '52.3K', price: '0.01289', change: 2.38, positive: true }
  ];
  
  const filteredItems = searchTerm 
    ? watchlistItems.filter(item => 
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : watchlistItems;

  return (
    <WatchlistContainer>
      <SearchContainer>
        <SearchIcon>
          <FaSearch />
        </SearchIcon>
        <SearchInput 
          placeholder="Search symbols..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>
      
      <AddButton>
        <FaPlus /> Add Symbol
      </AddButton>
      
      <WatchlistContent>
        {filteredItems.map((item, index) => (
          <WatchlistItem key={index}>
            <SymbolInfo>
              <SymbolIcon>{item.icon}</SymbolIcon>
              <SymbolDetails>
                <Symbol>{item.symbol}</Symbol>
                <Volume>Vol {item.volume}</Volume>
              </SymbolDetails>
            </SymbolInfo>
            <PriceInfo>
              <Price>{item.price}</Price>
              <Change $positive={item.positive}>
                {item.positive ? <FaCaretUp /> : <FaCaretDown />}
                {item.change}%
              </Change>
            </PriceInfo>
          </WatchlistItem>
        ))}
      </WatchlistContent>
    </WatchlistContainer>
  );
};

export default Watchlist; 