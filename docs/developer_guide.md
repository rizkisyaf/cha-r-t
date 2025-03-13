# cha(r)t Developer Guide

This guide provides an overview of the cha(r)t codebase and explains how to extend and modify the application.

## Architecture Overview

cha(r)t follows a client-server architecture:

1. **Frontend**: React application that handles UI rendering and user interactions
2. **Backend**: Flask server that processes requests, interacts with external APIs, and manages data
3. **External Services**: OpenAI API for AI capabilities and Alpha Vantage for financial data

### Communication Flow

```
User → React Frontend → Flask Backend → External APIs → Flask Backend → React Frontend → User
```

For real-time communication, WebSockets are used:

```
User → React Frontend ⟷ WebSocket ⟷ Flask Backend → User
```

## Frontend Structure

The frontend is built with React and organized as follows:

### Key Directories

- `/src/components`: React components
- `/src/services`: API and socket services
- `/src/assets`: Static assets

### Key Components

- `App.js`: Main application component that manages state and routing
- `Header.js`: Application header with logo, symbol info, and actions
- `Sidebar.js`: Navigation sidebar with chart type options
- `ChartContainer.js`: Container for the financial chart using TradingView's lightweight charts
- `AIAssistantPanel.js`: Right-side panel for AI assistant interaction
- `BottomPanel.js`: Bottom panel for code editor, strategy builder, and other tools

### Key Services

- `api.js`: Handles HTTP requests to the backend
- `socket.js`: Manages WebSocket connections for real-time communication

## Backend Structure

The backend is built with Flask and organized as follows:

### Key Directories

- `/app`: Main application package
- `/app/services`: Services for AI and financial data

### Key Files

- `app.py`: Entry point for the Flask application
- `app/__init__.py`: Initializes the Flask application
- `app/routes.py`: Defines API endpoints
- `app/services/ai_service.py`: Handles AI processing using OpenAI
- `app/services/financial_data_service.py`: Fetches and processes financial data

## Adding New Features

### Adding a New Chart Indicator

1. **Backend**: Update the AI service to recognize and process the new indicator:

```python
# In app/services/ai_service.py
def get_system_prompt():
    return """
    ...
    Available actions include:
    - add_indicator: Add a technical indicator to the chart
    ...
    
    Supported indicators:
    - SMA: Simple Moving Average
    - EMA: Exponential Moving Average
    - RSI: Relative Strength Index
    - YOUR_NEW_INDICATOR: Description
    ...
    """
```

2. **Frontend**: Add support for the new indicator in the chart component:

```javascript
// In src/components/ChartContainer.js
// Inside the useEffect hook where indicators are processed
if (chartContext.indicators) {
  chartContext.indicators.forEach(indicator => {
    if (indicator.type === 'SMA') {
      // Existing SMA code
    } else if (indicator.type === 'YOUR_NEW_INDICATOR') {
      // Add your new indicator implementation here
      const newIndicator = chart.addLineSeries({
        color: '#FF0000',  // Choose appropriate color
        lineWidth: 2,
        priceLineVisible: false,
      });
      
      // Calculate indicator values
      const indicatorData = calculateYourNewIndicator(data, indicator.parameters);
      
      // Set data
      newIndicator.setData(indicatorData);
    }
  });
}

// Add a helper function to calculate your indicator
function calculateYourNewIndicator(data, parameters) {
  // Implementation of your indicator calculation
  return calculatedData;
}
```

### Adding a New API Endpoint

1. **Backend**: Add a new route in `app/routes.py`:

```python
@app.route('/api/your-new-endpoint', methods=['GET', 'POST'])
def your_new_endpoint():
    """Description of your new endpoint"""
    # Get parameters from request
    params = request.args if request.method == 'GET' else request.json
    
    # Process the request
    result = your_processing_function(params)
    
    # Return response
    return jsonify(result)
```

2. **Frontend**: Add a new function in the API service:

```javascript
// In src/services/api.js
export const yourNewApiFunction = async (parameters) => {
  try {
    const response = await api.get('/api/your-new-endpoint', {
      params: parameters,
    });
    return response.data;
  } catch (error) {
    console.error('Error calling your new endpoint:', error);
    throw error;
  }
};
```

## Testing

### Backend Testing

Create tests in a `/tests` directory:

```python
# tests/test_financial_data_service.py
import unittest
from app.services import financial_data_service

class TestFinancialDataService(unittest.TestCase):
    def test_get_financial_data(self):
        # Test code here
        pass
```

Run tests with:

```
python -m unittest discover tests
```

### Frontend Testing

Create tests using React Testing Library:

```javascript
// src/components/__tests__/AIAssistantPanel.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import AIAssistantPanel from '../AIAssistantPanel';

test('renders AI assistant panel', () => {
  render(<AIAssistantPanel messages={[]} onSendMessage={() => {}} />);
  expect(screen.getByText('AI Assistant')).toBeInTheDocument();
});
```

Run tests with:

```
npm test
```

## Deployment

### Backend Deployment

The backend can be deployed to any platform that supports Python:

1. **Heroku**:
   - Create a `Procfile` with: `web: gunicorn app:app`
   - Deploy with Git

2. **AWS**:
   - Use Elastic Beanstalk or EC2
   - Set up environment variables for API keys

### Frontend Deployment

The frontend can be deployed to any static hosting service:

1. **Netlify/Vercel**:
   - Build with: `npm run build`
   - Deploy the `build` directory

2. **AWS S3**:
   - Build with: `npm run build`
   - Upload the `build` directory to an S3 bucket
   - Configure for static website hosting

## Performance Optimization

1. **Backend**:
   - Implement caching for API responses
   - Use asynchronous processing for long-running tasks

2. **Frontend**:
   - Implement lazy loading for components
   - Optimize chart rendering for large datasets

## Security Considerations

1. **API Keys**:
   - Never expose API keys in the frontend
   - Use environment variables for sensitive information

2. **User Input**:
   - Validate and sanitize all user input
   - Implement rate limiting for API endpoints

3. **CORS**:
   - Configure proper CORS headers to prevent unauthorized access

## Troubleshooting Common Issues

1. **API Rate Limits**:
   - Implement exponential backoff for API requests
   - Cache responses to reduce API calls

2. **WebSocket Disconnections**:
   - Implement reconnection logic
   - Add heartbeat mechanism to keep connections alive

3. **Chart Performance**:
   - Limit the amount of data displayed
   - Implement data downsampling for large datasets 