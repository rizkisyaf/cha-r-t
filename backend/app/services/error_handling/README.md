# Error Handling Module

This module provides comprehensive error handling for the trading assistant application. It includes custom exceptions, error logging, error response formatting, and validation utilities.

## Features

- **Custom Exceptions**: Specialized exception classes for different types of errors (data, analysis, strategy, etc.)
- **Error Logging**: Structured logging of errors with context information
- **Error Response Formatting**: Consistent formatting of error responses for API endpoints
- **Validation Utilities**: Functions to validate data and strategies
- **Safe Execution**: Utilities to safely execute functions with proper error handling
- **User-Friendly Error Messages**: Pre-defined error messages and suggestions for fixing errors

## Usage

### Custom Exceptions

```python
from app.services.error_handling import DataError, AnalysisError, StrategyError

# Raise a data error
raise DataError("Missing required fields in data")

# Raise an analysis error with details
raise AnalysisError("Failed to calculate RSI indicator", {"indicator": "RSI", "period": 14})

# Raise a strategy error
raise StrategyError("Invalid entry rule configuration")
```

### Error Handling Decorator

```python
from app.services.error_handling import handle_exception

@handle_exception
def process_data(data):
    if not data:
        raise DataError("Empty data provided")
    
    # Process data
    result = {"processed_items": len(data)}
    
    return {"success": True, "result": result}
```

### Data Validation

```python
from app.services.error_handling import validate_data

# Validate OHLCV data
data = [
    {"time": 1625097600, "open": 35000, "high": 36000, "low": 34500, "close": 35800, "volume": 1000},
    {"time": 1625184000, "open": 35800, "high": 37000, "low": 35500, "close": 36500, "volume": 1200}
]

is_valid, error_message = validate_data(data)
if not is_valid:
    raise DataError(error_message)
```

### Strategy Validation

```python
from app.services.error_handling import validate_strategy

# Validate a trading strategy
strategy = {
    "name": "Simple Moving Average Crossover",
    "entry_rules": [
        {"type": "indicator", "indicator": "SMA_20", "action": "buy", "condition": "price_crosses_above"}
    ],
    "exit_rules": [
        {"type": "indicator", "indicator": "SMA_20", "action": "exit_long", "condition": "price_crosses_below"}
    ],
    "risk_management": {
        "stop_loss_percent": 2.0,
        "take_profit_percent": 6.0
    }
}

is_valid, error_message = validate_strategy(strategy)
if not is_valid:
    raise StrategyError(error_message)
```

### Safe Execution

```python
from app.services.error_handling import safe_execute, AnalysisError

def calculate_indicator(data, period):
    # Calculate indicator
    return {"value": 42}

try:
    result = safe_execute(calculate_indicator, data, period=14, error_class=AnalysisError)
    print(f"Calculation succeeded: {result}")
except AnalysisError as e:
    print(f"Calculation failed: {e}")
```

### Error Response Formatting

```python
from app.services.error_handling import format_error_response

try:
    # Some operation that might fail
    result = process_data(data)
    return result
except Exception as e:
    # Format error response
    error_response = format_error_response(e, include_traceback=True)
    return error_response
```

### Error Logging

```python
from app.services.error_handling import log_error

try:
    # Some operation that might fail
    result = process_data(data)
    return result
except Exception as e:
    # Log error with context
    log_error(e, {"data": data, "operation": "process_data"})
    raise
```

### User-Friendly Error Messages

```python
from app.services.error_handling import get_error_message, suggest_fix

# Get a user-friendly error message
message = get_error_message("DATA_ERROR")
print(message)  # "There was an issue with the data. Please check the data format and try again."

# Get a suggestion for fixing an error
error = DataError("Missing required fields in data")
fix = suggest_fix(error)
print(fix)  # "Try using a different data source or timeframe. Make sure the data includes all required OHLCV fields."
```

## Error Codes

The module defines the following error codes:

- `DATA_ERROR`: Issues with data format or content
- `ANALYSIS_ERROR`: Issues with technical analysis calculations
- `STRATEGY_ERROR`: Issues with trading strategy configuration
- `BACKTEST_ERROR`: Issues with backtesting
- `OPTIMIZATION_ERROR`: Issues with strategy optimization
- `API_ERROR`: Issues with API requests
- `VALIDATION_ERROR`: Issues with input validation
- `GENERAL_ERROR`: General unexpected errors

## Integration with AI Service

The error handling module is integrated with the AI service to provide consistent error handling across the application. The `execute_function` method in `ai_service.py` uses the error handling module to handle exceptions and format error responses.

## Example

See the `backend/app/examples/error_handling_example.py` file for a complete example of how to use the error handling module. 