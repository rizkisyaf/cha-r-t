import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaCode, 
  FaPlay, 
  FaSave, 
  FaDownload,
  FaFolder,
  FaFile,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaCog
} from 'react-icons/fa';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--primary-color);
  color: var(--text-color);
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 12px;
    color: var(--accent-color);
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  gap: 0;
`;

const Sidebar = styled.div`
  width: 250px;
  background-color: var(--secondary-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const AddButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: var(--text-color);
  }
`;

const FileTree = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const TreeItem = styled.div`
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TreeItemHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  svg {
    margin-right: 8px;
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  ${props => props.$active && `
    background-color: rgba(41, 98, 255, 0.1);
    color: var(--accent-color);
    
    svg {
      color: var(--accent-color);
    }
  `}
`;

const TreeItemChildren = styled.div`
  padding-left: 24px;
  margin-top: 4px;
`;

const EditorPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EditorToolbar = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: ${props => props.$primary ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.$primary ? 'white' : 'var(--text-color)'};
  border: ${props => props.$primary ? 'none' : '1px solid var(--border-color)'};
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  
  svg {
    margin-right: 6px;
  }
  
  &:hover {
    background-color: ${props => props.$primary ? '#1E54E5' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const EditorContent = styled.div`
  flex: 1;
  padding: 16px;
  background-color: var(--secondary-color);
`;

const Editor = styled.textarea`
  width: 100%;
  height: 100%;
  background: none;
  border: none;
  color: var(--text-color);
  font-family: 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  
  &:focus {
    outline: none;
  }
`;

const CodeEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('');
  
  const files = {
    strategies: {
      name: 'strategies',
      type: 'folder',
      children: [
        {
          name: 'ma_crossover.py',
          type: 'file',
          content: `import pandas as pd
import numpy as np

def calculate_signals(data):
    # Calculate moving averages
    data['SMA_20'] = data['close'].rolling(window=20).mean()
    data['SMA_50'] = data['close'].rolling(window=50).mean()
    
    # Generate trading signals
    data['signal'] = 0
    data.loc[data['SMA_20'] > data['SMA_50'], 'signal'] = 1
    data.loc[data['SMA_20'] < data['SMA_50'], 'signal'] = -1
    
    return data`
        },
        {
          name: 'rsi_strategy.py',
          type: 'file',
          content: `import pandas as pd
import numpy as np

def calculate_rsi(data, periods=14):
    delta = data['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=periods).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=periods).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi`
        }
      ]
    },
    utils: {
      name: 'utils',
      type: 'folder',
      children: [
        {
          name: 'indicators.py',
          type: 'file',
          content: `def calculate_macd(data, fast=12, slow=26, signal=9):
    exp1 = data['close'].ewm(span=fast, adjust=False).mean()
    exp2 = data['close'].ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    
    return macd, signal_line`
        }
      ]
    }
  };
  
  const renderTree = (items, level = 0) => {
    return Object.values(items).map(item => (
      <TreeItem key={item.name}>
        <TreeItemHeader 
          $active={selectedFile === item.name}
          onClick={() => {
            if (item.type === 'file') {
              setSelectedFile(item.name);
              setCode(item.content);
            }
          }}
        >
          {item.type === 'folder' ? <FaFolder /> : <FaFile />}
          {item.name}
        </TreeItemHeader>
        {item.type === 'folder' && item.children && (
          <TreeItemChildren>
            {renderTree(item.children, level + 1)}
          </TreeItemChildren>
        )}
      </TreeItem>
    ));
  };
  
  return (
    <Container>
      <Header>
        <Title>
          <FaCode />
          Code Editor
        </Title>
      </Header>
      
      <Content>
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Files</SidebarTitle>
            <AddButton>
              <FaPlus />
            </AddButton>
          </SidebarHeader>
          
          <FileTree>
            {renderTree(files)}
          </FileTree>
        </Sidebar>
        
        <EditorPanel>
          <EditorToolbar>
            <Button $primary>
              <FaPlay />
              Run
            </Button>
            <Button>
              <FaSave />
              Save
            </Button>
            <Button>
              <FaDownload />
              Download
            </Button>
          </EditorToolbar>
          
          <EditorContent>
            <Editor
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Select a file to edit..."
            />
          </EditorContent>
        </EditorPanel>
      </Content>
    </Container>
  );
};

export default CodeEditor; 