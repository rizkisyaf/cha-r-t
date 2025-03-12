import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaRobot, FaCode, FaLayerGroup } from 'react-icons/fa';

const ToolsContainer = styled.div`
  width: 100%;
  margin-bottom: 8px;
`;

const ToolButton = styled.div`
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

const ToolDescription = styled.span`
  font-size: 12px;
  color: var(--text-secondary);
`;

const Tools = ({ activeView, onViewChange }) => {
  const navigate = useNavigate();
  
  const tools = [
    { 
      id: 'AI_ASSISTANT', 
      icon: FaRobot, 
      label: 'AI Assistant',
      description: 'Get AI-powered trading assistance',
      route: '/tools/ai-assistant'
    },
    { 
      id: 'CODE_EDITOR', 
      icon: FaCode, 
      label: 'Code Editor',
      description: 'Edit and manage your trading scripts',
      route: '/tools/code-editor'
    },
    { id: 'LAYERS', icon: FaLayerGroup, label: 'Layers' }
  ];

  const handleToolClick = (tool) => {
    onViewChange(tool.id);
    navigate(tool.route);
  };

  return (
    <ToolsContainer>
      {tools.map(tool => (
        <ToolButton
          key={tool.id}
          $active={activeView === tool.id}
          onClick={() => handleToolClick(tool)}
        >
          <tool.icon />
          <div>
            {tool.label}
            {tool.description && <ToolDescription>{tool.description}</ToolDescription>}
          </div>
        </ToolButton>
      ))}
    </ToolsContainer>
  );
};

export default Tools; 