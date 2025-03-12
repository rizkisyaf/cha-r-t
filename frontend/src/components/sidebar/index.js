import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaList, 
  FaNewspaper, 
  FaHistory, 
  FaStar, 
  FaCog,
  FaChartBar
} from 'react-icons/fa';
import Watchlist from './Watchlist';
import News from './News';

const SidebarContainer = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  flex-shrink: 0;
  z-index: 100;
  width: ${props => props.$isOpen ? '376px' : '56px'};
  transition: width 0.3s ease;
`;

const IconBar = styled.div`
  width: 56px;
  height: 100%;
  background-color: var(--primary-color);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  flex-shrink: 0;
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 4px;

  &:not(:last-child) {
    margin-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 8px;
  }
`;

const SidebarItem = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: transparent;
  color: ${props => props.$isActive ? 'var(--accent-color)' : 'var(--text-secondary)'};
  border: none;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color);

    span {
      opacity: 1;
      visibility: visible;
    }
  }

  svg {
    width: 20px;
    height: 20px;
    opacity: ${props => props.$isActive ? 1 : 0.5};
  }
`;

const SidebarLabel = styled.span`
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: var(--secondary-color);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  margin-right: 8px;
  z-index: 2;

  &:before {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    border-style: solid;
    border-width: 4px 0 4px 4px;
    border-color: transparent transparent transparent var(--secondary-color);
  }
`;

const PopupPanel = styled.div`
  position: relative;
  width: ${props => props.$isOpen ? '320px' : '0'};
  height: 100%;
  background-color: var(--primary-color);
  border-left: 1px solid var(--border-color);
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
`;

const PanelContent = styled.div`
  width: 320px;
  height: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
`;

const PanelHeader = styled.div`
  padding: 16px;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  
  svg {
    width: 20px;
    height: 20px;
    margin-right: 12px;
  }
`;

// Define view types
export const VIEWS = {
  WATCHLIST: 'WATCHLIST',
  NEWS: 'NEWS',
  HISTORY: 'HISTORY',
  FAVORITES: 'FAVORITES',
  SETTINGS: 'SETTINGS'
};

const Sidebar = () => {
  const [openPanel, setOpenPanel] = useState(null);
  const [activeView, setActiveView] = useState(null);
  
  const handleIconClick = (view) => {
    if (openPanel === view) {
      setOpenPanel(null);
      setActiveView(null);
    } else {
      setOpenPanel(view);
      setActiveView(view);
    }
  };
  
  const renderPanelContent = () => {
    switch (openPanel) {
      case VIEWS.WATCHLIST:
        return <Watchlist collapsed={false} />;
      case VIEWS.NEWS:
        return <News />;
      case VIEWS.HISTORY:
        return <div style={{ padding: '16px' }}>History Content</div>;
      case VIEWS.FAVORITES:
        return <div style={{ padding: '16px' }}>Favorites Content</div>;
      case VIEWS.SETTINGS:
        return <div style={{ padding: '16px' }}>Settings Content</div>;
      default:
        return null;
    }
  };
  
  const getPanelTitle = () => {
    switch (openPanel) {
      case VIEWS.WATCHLIST:
        return <><FaChartBar /> Watchlist</>;
      case VIEWS.NEWS:
        return <><FaNewspaper /> News</>;
      case VIEWS.HISTORY:
        return <><FaHistory /> History</>;
      case VIEWS.FAVORITES:
        return <><FaStar /> Favorites</>;
      case VIEWS.SETTINGS:
        return <><FaCog /> Settings</>;
      default:
        return null;
    }
  };
  
  return (
    <SidebarContainer $isOpen={openPanel !== null}>
      <IconBar>
        <SidebarSection>
          <SidebarItem
            $isActive={activeView === VIEWS.WATCHLIST}
            onClick={() => handleIconClick(VIEWS.WATCHLIST)}
          >
            <FaChartBar />
            <SidebarLabel>Watchlist</SidebarLabel>
          </SidebarItem>
          
          <SidebarItem
            $isActive={activeView === VIEWS.NEWS}
            onClick={() => handleIconClick(VIEWS.NEWS)}
          >
            <FaNewspaper />
            <SidebarLabel>News</SidebarLabel>
          </SidebarItem>
        </SidebarSection>

        <SidebarSection>
          <SidebarItem
            $isActive={activeView === VIEWS.HISTORY}
            onClick={() => handleIconClick(VIEWS.HISTORY)}
          >
            <FaHistory />
            <SidebarLabel>History</SidebarLabel>
          </SidebarItem>
          
          <SidebarItem
            $isActive={activeView === VIEWS.FAVORITES}
            onClick={() => handleIconClick(VIEWS.FAVORITES)}
          >
            <FaStar />
            <SidebarLabel>Favorites</SidebarLabel>
          </SidebarItem>
        </SidebarSection>

        <SidebarSection>
          <SidebarItem
            $isActive={activeView === VIEWS.SETTINGS}
            onClick={() => handleIconClick(VIEWS.SETTINGS)}
          >
            <FaCog />
            <SidebarLabel>Settings</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </IconBar>
      
      <PopupPanel $isOpen={openPanel !== null}>
        {openPanel && (
          <PanelContent>
            <PanelHeader>
              {getPanelTitle()}
            </PanelHeader>
            {renderPanelContent()}
          </PanelContent>
        )}
      </PopupPanel>
    </SidebarContainer>
  );
};

export default Sidebar; 