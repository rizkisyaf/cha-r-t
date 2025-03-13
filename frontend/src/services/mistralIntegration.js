import mistralService, { AVAILABLE_FUNCTIONS } from './mistral';

// Function to initialize the Mistral service with handlers for all functions
export const initMistralService = (appHandlers) => {
  console.log('Initializing Mistral service with handlers...');
  
  // Register handlers for each function
  Object.keys(AVAILABLE_FUNCTIONS).forEach(functionName => {
    console.log(`Registering handler for function: ${functionName}`);
    
    mistralService.registerFunctionHandler(functionName, (args, chartContext) => {
      console.log(`Executing function ${functionName} with args:`, args);
      
      // Map the function name to the appropriate handler
      switch (functionName) {
        case 'analyze_chart':
          return appHandlers.analyzeChart(args, chartContext);
          
        case 'add_indicator':
          return appHandlers.addIndicator(args, chartContext);
          
        case 'remove_indicator':
          return appHandlers.removeIndicator(args, chartContext);
          
        case 'draw_pattern':
          return appHandlers.drawPattern(args, chartContext);
          
        case 'change_symbol':
          return appHandlers.changeSymbol(args, chartContext);
          
        case 'change_timeframe':
          return appHandlers.changeTimeframe(args, chartContext);
          
        case 'create_strategy':
          return appHandlers.createStrategy(args, chartContext);
          
        case 'run_strategy':
          return appHandlers.runStrategy(args, chartContext);
          
        case 'stop_strategy':
          return appHandlers.stopStrategy(args, chartContext);
          
        case 'run_backtest':
          return appHandlers.runBacktest(args, chartContext);
          
        default:
          throw new Error(`No handler implemented for function: ${functionName}`);
      }
    });
  });
  
  // Set the response callback
  mistralService.setResponseCallback(appHandlers.onResponse);
  
  // Clear any previous conversation
  mistralService.clearConversation();
  
  console.log('Mistral service initialized successfully');
  
  return mistralService;
};

// Function to send a message to Mistral
export const sendMessageToMistral = (message, chartContext) => {
  console.log('Sending message to Mistral service:', message);
  
  // Ensure chartContext is an object
  const baseContext = chartContext && typeof chartContext === 'object' ? { ...chartContext } : {};
  
  // Create a safe enhanced context object
  const enhancedChartContext = { 
    symbol: baseContext.symbol || 'BTCUSDT',
    timeframe: baseContext.timeframe || '1m',
    indicators: []  // Start with empty indicators array
  };
  
  // If we have access to the chart data, include it
  if (window.chartInstance && window.chartInstance.series && window.chartInstance.series[0]) {
    try {
      console.log('DEBUG: Chart instance available, enhancing context');
      
      // Get candles from the chart
      const mainSeries = window.chartInstance.series[0];
      const visibleData = mainSeries.data();
      
      if (visibleData && Array.isArray(visibleData) && visibleData.length > 0) {
        console.log(`DEBUG: Got ${visibleData.length} candles`);
        
        // Log the first and last candle for debugging
        console.log('DEBUG: First candle:', visibleData[0]);
        console.log('DEBUG: Last candle:', visibleData[visibleData.length - 1]);
        
        // Send all candles, ensuring they're properly formatted
        const formattedCandles = visibleData.map(candle => {
          // Ensure all required properties are present and are numbers
          return {
            time: typeof candle.time === 'number' ? candle.time : parseInt(candle.time),
            open: typeof candle.open === 'number' ? candle.open : parseFloat(candle.open),
            high: typeof candle.high === 'number' ? candle.high : parseFloat(candle.high),
            low: typeof candle.low === 'number' ? candle.low : parseFloat(candle.low),
            close: typeof candle.close === 'number' ? candle.close : parseFloat(candle.close),
            volume: typeof candle.volume === 'number' ? candle.volume : parseFloat(candle.volume || 0)
          };
        });
        
        enhancedChartContext.candles = formattedCandles;
        console.log(`DEBUG: Added ${formattedCandles.length} formatted candles to context`);
        
        // Set current price from the last candle
        if (formattedCandles.length > 0) {
          enhancedChartContext.currentPrice = formattedCandles[formattedCandles.length - 1].close;
          console.log(`DEBUG: Current price set to ${enhancedChartContext.currentPrice}`);
        }
      } else {
        console.log('DEBUG: No visible data or empty array');
      }
      
      // Get indicators with better error handling
      if (window.chartInstance.indicators) {
        console.log(`DEBUG: Processing indicators: ${typeof window.chartInstance.indicators}`);
        
        if (Array.isArray(window.chartInstance.indicators)) {
          console.log(`DEBUG: Found ${window.chartInstance.indicators.length} indicators`);
          
          // Process each indicator safely
          const safeIndicators = window.chartInstance.indicators
            .filter(indicator => {
              const isValid = indicator && typeof indicator === 'object';
              if (!isValid) console.log(`DEBUG: Filtered out invalid indicator: ${typeof indicator}`);
              return isValid;
            })
            .map((indicator, index) => {
              try {
                console.log(`DEBUG: Processing indicator ${index}`);
                
                // Check if indicator has type property
                if (!indicator.hasOwnProperty('type')) {
                  console.log(`DEBUG: Indicator ${index} missing type property`);
                  console.log(`DEBUG: Indicator keys: ${Object.keys(indicator).join(', ')}`);
                  return { type: 'unknown', period: null };
                }
                
                // Safely extract properties with fallbacks
                const indicatorData = {
                  type: indicator.type || 'unknown',
                  period: indicator.period || null
                };
                
                console.log(`DEBUG: Indicator ${index} processed: ${indicatorData.type}, period: ${indicatorData.period}`);
                
                return indicatorData;
              } catch (err) {
                console.error(`DEBUG: Error processing indicator ${index}:`, err);
                return { type: 'unknown', period: null };
              }
            });
          
          enhancedChartContext.indicators = safeIndicators;
        } else {
          console.log(`DEBUG: indicators is not an array: ${typeof window.chartInstance.indicators}`);
        }
      } else {
        console.log('DEBUG: No indicators available');
      }
      
      console.log('Enhanced chart context:', JSON.stringify(enhancedChartContext, null, 2));
    } catch (error) {
      console.error('Error enhancing chart context:', error);
      // Ensure we have at least basic chart context even if enhancement fails
      enhancedChartContext.error = error.message;
    }
  } else {
    console.log('DEBUG: Chart instance not available');
  }
  
  return mistralService.sendMessage(message, enhancedChartContext);
};

// Function to clear the conversation history
export const clearMistralConversation = () => {
  console.log('Clearing Mistral conversation history');
  mistralService.clearConversation();
};

export default {
  initMistralService,
  sendMessageToMistral,
  clearMistralConversation
}; 