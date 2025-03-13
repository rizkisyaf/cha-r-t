import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFinancialData = async (symbol, timeframe) => {
  try {
    const response = await api.get('/api/financial-data', {
      params: { symbol, timeframe },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
};

export const sendChatMessage = async (message, chartContext) => {
  try {
    const response = await api.post('/api/chat', {
      message,
      chartContext,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export default api; 