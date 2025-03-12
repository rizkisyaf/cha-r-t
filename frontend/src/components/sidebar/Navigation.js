import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaHistory, FaStar, FaCog } from 'react-icons/fa';

const NavigationContainer = styled.div`
  width: 100%;
  margin-top: auto;
  padding-top: 8px;
`;

const NavButton = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: ${props => props.$active ? 'var(--accent-color)' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  
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

const NavDescription = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const Navigation = ({ activeView, onViewChange }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { 
      id: 'HISTORY', 
      icon: FaHistory, 
      label: 'History',
      description: 'View your trading history',
      route: '/history'
    },
    { 
      id: 'FAVORITES', 
      icon: FaStar, 
      label: 'Favorites',
      description: 'Access your favorite strategies and tools',
      route: '/favorites'
    },
    { 
      id: 'SETTINGS', 
      icon: FaCog, 
      label: 'Settings',
      description: 'Configure application settings',
      route: '/settings'
    }
  ];

  const handleNavClick = (item) => {
    onViewChange(item.id);
    navigate(item.route);
  };

  return (
    <NavigationContainer>
      {navItems.map(item => (
        <NavButton
          key={item.id}
          $active={activeView === item.id}
          onClick={() => handleNavClick(item)}
        >
          <item.icon />
          <div>
            {item.label}
            <NavDescription>{item.description}</NavDescription>
          </div>
        </NavButton>
      ))}
    </NavigationContainer>
  );
};

export default Navigation; 