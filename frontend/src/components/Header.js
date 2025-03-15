import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaChartLine, 
  FaChevronDown, 
  FaPlus,
  FaRegClock,
  FaDrawPolygon,
  FaRulerHorizontal,
  FaFont,
  FaRegSave,
  FaCamera,
  FaUserCircle,
  FaCreditCard,
  FaUserEdit,
  FaGift,
  FaRocket,
  FaSignal,
  FaSearch
} from 'react-icons/fa';
import SymbolSearch from './SymbolSearch';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--primary-color);
  height: 36px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-color);
`;

const TimeframeSelector = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const TimeframeButton = styled.button`
  background: ${props => props.$active ? '#2962FF' : 'transparent'};
  border: none;
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};
  padding: 0 12px;
  height: 100%;
  cursor: pointer;
  font-size: 13px;
  border-radius: 0;
  
  &:hover {
    background: ${props => props.$active ? '#2962FF' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const ChartTools = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  
  button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 14px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    
    &:hover {
      color: var(--text-color);
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--accent-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  margin-left: 16px;
`;

const UserProfilePopup = styled.div`
  position: absolute;
  top: 40px;
  right: 0;
  width: 220px;
  background-color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const UserProfileHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
`;

const UserInfo = styled.div`
  margin-left: 12px;
`;

const UserName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
`;

const ProfileMenuItems = styled.div`
  padding: 8px 0;
`;

const ProfileMenuItem = styled.div`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg {
    margin-right: 12px;
    font-size: 14px;
    color: var(--text-secondary);
  }
`;

const SignalIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props => {
    if (props.$strength === 'high') return 'rgba(38, 166, 154, 0.2)';
    if (props.$strength === 'medium') return 'rgba(255, 193, 7, 0.2)';
    return 'rgba(239, 83, 80, 0.2)';
  }};
  
  svg {
    color: ${props => {
      if (props.$strength === 'high') return '#26A69A';
      if (props.$strength === 'medium') return '#FFC107';
      return '#EF5350';
    }};
    margin-right: 6px;
  }
  
  span {
    font-size: 12px;
    color: var(--text-color);
  }
`;

const SymbolDisplay = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
  margin-right: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg {
    margin-left: 8px;
    color: var(--text-secondary);
    font-size: 12px;
  }
`;

const Header = ({ symbol, timeframe, onTimeframeChange, onSymbolChange }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [signalStrength, setSignalStrength] = useState('high');
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);
  const profileRef = useRef(null);
  
  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1M' }
  ];
  
  const handleTimeframeChange = (newTimeframe) => {
    console.log(`Header: Changing timeframe to ${newTimeframe}`);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };
  
  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };
  
  const handleSymbolSelect = (newSymbol) => {
    if (onSymbolChange) {
      onSymbolChange(newSymbol);
    }
    setIsSymbolSearchOpen(false);
  };
  
  // Simulate signal strength check
  useEffect(() => {
    const checkSignalStrength = () => {
      // In a real app, you would check actual connection quality
      // For demo purposes, we'll randomly change it
      const strengths = ['high', 'medium', 'low'];
      const randomIndex = Math.floor(Math.random() * 10);
      // Make high strength more likely (70% chance)
      if (randomIndex < 7) {
        setSignalStrength('high');
      } else if (randomIndex < 9) {
        setSignalStrength('medium');
      } else {
        setSignalStrength('low');
      }
    };
    
    // Initial check
    checkSignalStrength();
    
    // Check every 30 seconds
    const interval = setInterval(checkSignalStrength, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <HeaderContainer>
      <TimeframeSelector>
        <SymbolDisplay onClick={() => setIsSymbolSearchOpen(true)}>
          {symbol}
          <FaSearch />
        </SymbolDisplay>
        
        {timeframes.map((tf, index) => (
          <TimeframeButton 
            key={index}
            $active={timeframe === tf.value}
            onClick={() => handleTimeframeChange(tf.value)}
          >
            {tf.label}
          </TimeframeButton>
        ))}
      </TimeframeSelector>
      
      <ChartTools>
        <button title="Drawing tools">
          <FaDrawPolygon />
        </button>
        <button title="Indicators">
          <FaRulerHorizontal />
        </button>
        <button title="Text annotation">
          <FaFont />
        </button>
        <button title="Save chart">
          <FaRegSave />
        </button>
        <button title="Screenshot">
          <FaCamera />
        </button>
      </ChartTools>
      
      <Spacer />
      
      <SignalIndicator $strength={signalStrength}>
        <FaSignal />
        <span>{signalStrength === 'high' ? 'Strong' : signalStrength === 'medium' ? 'Medium' : 'Weak'}</span>
      </SignalIndicator>
      
      <UserAvatar ref={profileRef} onClick={toggleProfileMenu}>
        R
        <UserProfilePopup $isOpen={isProfileOpen}>
          <UserProfileHeader>
            <FaUserCircle size={32} />
            <UserInfo>
              <UserName>Rizki Syafii</UserName>
              <UserEmail>rizki@example.com</UserEmail>
            </UserInfo>
          </UserProfileHeader>
          <ProfileMenuItems>
            <ProfileMenuItem>
              <FaRocket />
              Explore Plans
            </ProfileMenuItem>
            <ProfileMenuItem>
              <FaUserEdit />
              Edit Profile
            </ProfileMenuItem>
            <ProfileMenuItem>
              <FaCreditCard />
              Account & Billing
            </ProfileMenuItem>
            <ProfileMenuItem>
              <FaGift />
              Earn Referral
            </ProfileMenuItem>
          </ProfileMenuItems>
        </UserProfilePopup>
      </UserAvatar>
      
      <SymbolSearch 
        isOpen={isSymbolSearchOpen}
        onClose={() => setIsSymbolSearchOpen(false)}
        onSelectSymbol={handleSymbolSelect}
      />
    </HeaderContainer>
  );
};

export default Header; 