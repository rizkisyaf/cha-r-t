import React from 'react';
import styled from 'styled-components';

const NewsContainer = styled.div`
  width: 100%;
`;

const NewsContent = styled.div`
  padding: 0 16px;
`;

const NewsItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const NewsHeadline = styled.div`
  color: var(--text-color);
  margin-bottom: 8px;
  line-height: 1.4;
  font-size: 14px;
  font-weight: 500;
`;

const NewsMetadata = styled.div`
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
`;

const NewsSource = styled.span`
  margin-right: 8px;
`;

const NewsTime = styled.span``;

const NewsExcerpt = styled.div`
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NewsCategories = styled.div`
  display: flex;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const NewsCategory = styled.span`
  background-color: rgba(41, 98, 255, 0.1);
  color: var(--accent-color);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 6px;
  margin-bottom: 4px;
`;

const News = () => {
  const newsItems = [
    {
      headline: 'Bitcoin surges past $50,000 for the first time since 2021',
      source: 'CoinDesk',
      time: '2h ago',
      excerpt: 'Bitcoin has surpassed the $50,000 mark for the first time since December 2021, as institutional adoption continues to grow following the approval of spot Bitcoin ETFs.',
      categories: ['Bitcoin', 'Markets']
    },
    {
      headline: 'Ethereum Layer 2 solutions see record-breaking growth',
      source: 'The Block',
      time: '4h ago',
      excerpt: 'Ethereum scaling solutions like Arbitrum and Optimism have seen unprecedented growth in the past month, with total value locked (TVL) reaching new all-time highs.',
      categories: ['Ethereum', 'Layer 2', 'DeFi']
    },
    {
      headline: 'SEC approves spot Bitcoin ETFs in historic decision',
      source: 'Bloomberg',
      time: '6h ago',
      excerpt: 'The U.S. Securities and Exchange Commission has approved multiple spot Bitcoin exchange-traded funds, marking a watershed moment for cryptocurrency adoption in traditional finance.',
      categories: ['Regulation', 'ETF', 'Bitcoin']
    },
    {
      headline: 'Solana outperforms major cryptocurrencies with 20% weekly gain',
      source: 'CryptoNews',
      time: '8h ago',
      excerpt: 'Solana (SOL) has outperformed most major cryptocurrencies this week, posting gains of over 20% as network activity and developer interest continue to grow.',
      categories: ['Solana', 'Altcoins']
    },
    {
      headline: 'DeFi protocol exploited for $20 million in flash loan attack',
      source: 'DeFi Pulse',
      time: '12h ago',
      excerpt: 'A decentralized finance protocol has suffered a $20 million exploit through a complex flash loan attack, highlighting ongoing security challenges in the DeFi space.',
      categories: ['Security', 'DeFi', 'Hack']
    }
  ];

  return (
    <NewsContainer>
      <NewsContent>
        {newsItems.map((item, index) => (
          <NewsItem key={index}>
            <NewsHeadline>{item.headline}</NewsHeadline>
            <NewsMetadata>
              <NewsSource>{item.source}</NewsSource>
              <NewsTime>{item.time}</NewsTime>
            </NewsMetadata>
            <NewsExcerpt>{item.excerpt}</NewsExcerpt>
            <NewsCategories>
              {item.categories.map((category, idx) => (
                <NewsCategory key={idx}>{category}</NewsCategory>
              ))}
            </NewsCategories>
          </NewsItem>
        ))}
      </NewsContent>
    </NewsContainer>
  );
};

export default News; 