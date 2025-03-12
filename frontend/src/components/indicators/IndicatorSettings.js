import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { getIndicator } from './types';
import { FormGroup, Label, Input, ColorInput, Select, CheckboxContainer, Checkbox } from './SettingsComponents';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SettingsDialog = styled.div`
  background-color: #1E222D;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 24px;
    color: var(--text-color);
    font-weight: 500;
  }

  button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 20px;
    padding: 4px;

    &:hover {
      color: var(--text-color);
    }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.div`
  padding: 12px 24px;
  font-size: 16px;
  color: ${props => props.active ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  position: relative;
  font-weight: 500;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.active ? '#2962FF' : 'transparent'};
  }
  
  &:hover {
    color: #fff;
  }
`;

const DialogContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  margin-top: 16px;
  margin-bottom: 8px;
  letter-spacing: 1px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-top: 1px solid var(--border-color);
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background-color: var(--accent-color);
    color: white;
    border: none;

    &:hover {
      background-color: #1E54E5;
    }
  }

  &.secondary {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &.danger {
    background-color: transparent;
    color: #EF5350;
    border: 1px solid #EF5350;

    &:hover {
      background-color: rgba(239, 83, 80, 0.1);
    }
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownButton = styled.div`
  background-color: #131722;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-color);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  svg {
    margin-left: 8px;
    font-size: 12px;
  }
`;

const IndicatorSettings = ({ isOpen, indicator, onClose, onSave, onRemove }) => {
  const [settings, setSettings] = useState({});
  const [indicatorModule, setIndicatorModule] = useState(null);
  const [activeTab, setActiveTab] = useState('inputs');

  useEffect(() => {
    if (indicator && indicator.type) {
      // Get the indicator module for this type
      const module = getIndicator(indicator.type);
      setIndicatorModule(module);
      
      // Initialize settings with defaults and current values
      setSettings({
        ...module?.metadata.defaultSettings,
        ...indicator
      });
    }
  }, [indicator]);

  if (!isOpen || !indicator || !indicatorModule) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = value;

    // Convert numeric values
    if (type === 'number') {
      parsedValue = parseFloat(value);
    } else if (type === 'checkbox') {
      parsedValue = checked;
    }

    setSettings(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSave = () => {
    onSave(indicator.index, settings);
  };

  const handleRemove = () => {
    onRemove(indicator.index);
  };

  // Get the Settings components for this indicator type
  const InputsComponent = indicatorModule.InputsSettings || indicatorModule.Settings;
  const StyleComponent = indicatorModule.StyleSettings;
  const VisibilityComponent = indicatorModule.VisibilitySettings;

  return (
    <Overlay onClick={onClose}>
      <SettingsDialog onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <h2>{indicatorModule.metadata.name}</h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </DialogHeader>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'inputs'} 
            onClick={() => setActiveTab('inputs')}
          >
            Inputs
          </Tab>
          <Tab 
            active={activeTab === 'style'} 
            onClick={() => setActiveTab('style')}
          >
            Style
          </Tab>
          <Tab 
            active={activeTab === 'visibility'} 
            onClick={() => setActiveTab('visibility')}
          >
            Visibility
          </Tab>
        </TabsContainer>
        
        <DialogContent>
          {activeTab === 'inputs' && (
            <>
              {/* Render the indicator-specific inputs settings */}
              <InputsComponent 
                settings={settings} 
                onChange={handleChange} 
              />
            </>
          )}
          
          {activeTab === 'style' && (
            <>
              {/* Render the indicator-specific style settings */}
              {StyleComponent ? (
                <StyleComponent 
                  settings={settings} 
                  onChange={handleChange} 
                />
              ) : (
                <FormGroup>
                  <Label>Color</Label>
                  <ColorInput>
                    <input 
                      type="color" 
                      name="color" 
                      value={settings.color || '#2962FF'} 
                      onChange={handleChange}
                    />
                    <span>{settings.color}</span>
                  </ColorInput>
                </FormGroup>
              )}
            </>
          )}
          
          {activeTab === 'visibility' && (
            <>
              {/* Render the indicator-specific visibility settings */}
              {VisibilityComponent ? (
                <VisibilityComponent 
                  settings={settings} 
                  onChange={handleChange} 
                />
              ) : (
                <>
                  <FormGroup>
                    <Label>Show on chart</Label>
                    <CheckboxContainer>
                      <Checkbox 
                        name="isVisible" 
                        checked={settings.isVisible !== false} 
                        onChange={handleChange}
                      />
                    </CheckboxContainer>
                  </FormGroup>
                </>
              )}
            </>
          )}
        </DialogContent>
        
        <ButtonGroup>
          <Button className="danger" onClick={handleRemove}>
            <FaTrash style={{ marginRight: '8px' }} />
            Remove
          </Button>
          <div>
            <Button className="secondary" onClick={onClose} style={{ marginRight: '8px' }}>
              Cancel
            </Button>
            <Button className="primary" onClick={handleSave}>
              Ok
            </Button>
          </div>
        </ButtonGroup>
      </SettingsDialog>
    </Overlay>
  );
};

export default IndicatorSettings; 