import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Create a new trading strategy
 * @param {Object} strategy - The strategy object
 * @returns {Promise<Object>} - The created strategy
 */
export const createStrategy = async (strategy) => {
  try {
    const response = await axios.post(`${API_URL}/api/strategies`, strategy);
    return response.data;
  } catch (error) {
    console.error('Error creating strategy:', error);
    throw error;
  }
};

/**
 * Get all strategies
 * @returns {Promise<Array>} - Array of strategies
 */
export const getStrategies = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/strategies`);
    return response.data;
  } catch (error) {
    console.error('Error fetching strategies:', error);
    throw error;
  }
};

/**
 * Get a strategy by ID
 * @param {string} id - The strategy ID
 * @returns {Promise<Object>} - The strategy
 */
export const getStrategyById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/strategies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching strategy ${id}:`, error);
    throw error;
  }
};

/**
 * Update a strategy
 * @param {string} id - The strategy ID
 * @param {Object} strategy - The updated strategy object
 * @returns {Promise<Object>} - The updated strategy
 */
export const updateStrategy = async (id, strategy) => {
  try {
    const response = await axios.put(`${API_URL}/api/strategies/${id}`, strategy);
    return response.data;
  } catch (error) {
    console.error(`Error updating strategy ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a strategy
 * @param {string} id - The strategy ID
 * @returns {Promise<Object>} - The response
 */
export const deleteStrategy = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/strategies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting strategy ${id}:`, error);
    throw error;
  }
};

/**
 * Backtest a strategy
 * @param {Object} strategy - The strategy object
 * @param {Object} options - Backtest options (timeframe, start date, end date)
 * @returns {Promise<Object>} - The backtest results
 */
export const backtestStrategy = async (strategy, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/api/strategies/backtest`, {
      strategy,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error backtesting strategy:', error);
    throw error;
  }
};

/**
 * Optimize a strategy
 * @param {Object} strategy - The strategy object
 * @param {Object} paramRanges - Parameter ranges to optimize
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} - The optimization results
 */
export const optimizeStrategy = async (strategy, paramRanges, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/api/strategies/optimize`, {
      strategy,
      paramRanges,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error optimizing strategy:', error);
    throw error;
  }
};

/**
 * Start a paper trading session with a strategy
 * @param {string} id - The strategy ID
 * @returns {Promise<Object>} - The paper trading session
 */
export const startPaperTrading = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/api/strategies/${id}/paper-trade`);
    return response.data;
  } catch (error) {
    console.error(`Error starting paper trading for strategy ${id}:`, error);
    throw error;
  }
};

/**
 * Stop a paper trading session
 * @param {string} sessionId - The paper trading session ID
 * @returns {Promise<Object>} - The response
 */
export const stopPaperTrading = async (sessionId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/paper-trade/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error stopping paper trading session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Get paper trading results
 * @param {string} sessionId - The paper trading session ID
 * @returns {Promise<Object>} - The paper trading results
 */
export const getPaperTradingResults = async (sessionId) => {
  try {
    const response = await axios.get(`${API_URL}/api/paper-trade/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching paper trading results for session ${sessionId}:`, error);
    throw error;
  }
};

/**
 * Generate a strategy report
 * @param {Object} strategy - The strategy object
 * @param {Object} backtestResult - The backtest result
 * @returns {Promise<Object>} - The strategy report
 */
export const generateStrategyReport = async (strategy, backtestResult) => {
  try {
    const response = await axios.post(`${API_URL}/api/strategies/report`, {
      strategy,
      backtestResult
    });
    return response.data;
  } catch (error) {
    console.error('Error generating strategy report:', error);
    throw error;
  }
}; 