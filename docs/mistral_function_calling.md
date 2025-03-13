# Mistral Function Calling Implementation

This document explains how the Mistral AI function calling is implemented in the cha(r)t application.

## Overview

The application now uses Mistral AI's function calling capabilities to enable the AI to call specific functions to retrieve data or perform actions. This implementation follows the four-step process outlined in the Mistral documentation:

1. User: specify tools and query
2. Model: Generate function arguments if applicable
3. User: Execute function to obtain tool results
4. Model: Generate final answer

## Implementation Details

### Backend Implementation

The backend implementation consists of:

1. **Unified AI Service** (`backend/app/services/unified_ai_service.py`):
   - A service that handles interactions with Mistral AI
   - Manages conversation history
   - Registers and executes functions
   - Follows the four-step process for function calling

2. **API Endpoints** (`backend/app/routes.py`):
   - `/api/chat`: Processes chat messages using the unified AI service
   - `/api/mistral/chat`: A dedicated endpoint that mimics the Mistral API for frontend use

3. **Function Handlers**:
   - Functions that can be called by the AI, such as:
     - `get_financial_data`: Retrieves financial data for a symbol and timeframe
     - `analyze_chart`: Analyzes chart data and returns insights

### Frontend Implementation

The frontend implementation consists of:

1. **Mistral Service** (`frontend/src/services/mistral.js`):
   - Manages conversation with the AI
   - Sends requests to the backend API
   - Processes tool calls and executes function handlers

2. **Mistral Integration** (`frontend/src/services/mistralIntegration.js`):
   - Initializes the Mistral service
   - Registers function handlers
   - Provides methods to send messages and clear conversation

## How to Use

### Setting Up

1. Make sure you have a Mistral API key:
   - Add it to `backend/.env` as `MISTRAL_API_KEY=your_key_here`

2. Install the required dependencies:
   - Backend: `pip install -r backend/requirements.txt`
   - Frontend: `npm install` in the frontend directory

### Using Function Calling in Your Code

#### Backend

To add a new function that can be called by the AI:

1. Register the function in the unified AI service:

```python
unified_ai_service.register_function(
    "function_name",
    {
        "name": "function_name",
        "description": "Description of what the function does",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {
                    "type": "string",
                    "description": "Description of parameter 1"
                },
                # Add more parameters as needed
            },
            "required": ["param1"]  # List required parameters
        }
    },
    lambda args: your_function_handler(args)
)
```

2. Implement the function handler:

```python
def your_function_handler(args):
    # Process the arguments
    param1 = args.get("param1")
    
    try:
        # Implement your function logic
        result = do_something(param1)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

#### Frontend

To add a new function that can be called by the AI:

1. Add the function definition to `AVAILABLE_FUNCTIONS` in `frontend/src/services/mistral.js`:

```javascript
"function_name": {
    name: "function_name",
    description: "Description of what the function does",
    parameters: {
        type: "object",
        properties: {
            param1: {
                type: "string",
                description: "Description of parameter 1"
            },
            // Add more parameters as needed
        },
        required: ["param1"]  // List required parameters
    }
}
```

2. Register a handler for the function in `frontend/src/services/mistralIntegration.js`:

```javascript
case 'function_name':
    return appHandlers.functionHandler(args, chartContext);
```

3. Implement the handler in your application code.

## Supported Models

The following Mistral models support function calling:

- Mistral Large
- Mistral Small
- Codestral
- Ministral 8B
- Ministral 3B
- Pixtral 12B
- Pixtral Large
- Mistral Nemo

The application is currently configured to use `mistral-small-latest`.

## Troubleshooting

If you encounter issues with function calling:

1. Check the browser console and server logs for error messages
2. Verify that your Mistral API key is correctly set
3. Ensure that the function definitions match the expected format
4. Check that the function handlers are correctly implemented and registered 