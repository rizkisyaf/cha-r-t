"""
Error Handling Module

This module provides comprehensive error handling for trading analysis tasks.
It includes custom exceptions, error logging, and error response formatting.
"""

import traceback
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional, Union, List, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('trading_assistant_errors.log')
    ]
)

logger = logging.getLogger('trading_assistant')

# Custom exceptions
class TradingAssistantError(Exception):
    """Base exception for all trading assistant errors"""
    def __init__(self, message: str, error_code: str = "GENERAL_ERROR", details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.now().isoformat()
        super().__init__(self.message)

class DataError(TradingAssistantError):
    """Exception for data-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "DATA_ERROR", details)

class AnalysisError(TradingAssistantError):
    """Exception for analysis-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "ANALYSIS_ERROR", details)

class StrategyError(TradingAssistantError):
    """Exception for strategy-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "STRATEGY_ERROR", details)

class BacktestError(TradingAssistantError):
    """Exception for backtest-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "BACKTEST_ERROR", details)

class OptimizationError(TradingAssistantError):
    """Exception for optimization-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "OPTIMIZATION_ERROR", details)

class APIError(TradingAssistantError):
    """Exception for API-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "API_ERROR", details)

class ValidationError(TradingAssistantError):
    """Exception for validation-related errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, "VALIDATION_ERROR", details)

# Error handling functions
def log_error(error: Union[Exception, str], context: Optional[Dict[str, Any]] = None):
    """
    Log an error with context
    
    Args:
        error (Exception or str): The error to log
        context (Dict, optional): Additional context for the error
    """
    error_message = str(error)
    error_type = type(error).__name__ if isinstance(error, Exception) else "Unknown"
    
    log_data = {
        "error_type": error_type,
        "error_message": error_message,
        "timestamp": datetime.now().isoformat()
    }
    
    if context:
        log_data["context"] = context
    
    if isinstance(error, Exception) and not isinstance(error, TradingAssistantError):
        log_data["traceback"] = traceback.format_exc()
    
    logger.error(json.dumps(log_data))

def format_error_response(error: Union[Exception, str], include_traceback: bool = False) -> Dict[str, Any]:
    """
    Format an error for API response
    
    Args:
        error (Exception or str): The error to format
        include_traceback (bool): Whether to include traceback in the response
        
    Returns:
        Dict: Formatted error response
    """
    if isinstance(error, TradingAssistantError):
        response = {
            "success": False,
            "error": {
                "code": error.error_code,
                "message": error.message,
                "timestamp": error.timestamp
            }
        }
        
        if error.details:
            response["error"]["details"] = error.details
    else:
        error_message = str(error)
        response = {
            "success": False,
            "error": {
                "code": "GENERAL_ERROR",
                "message": error_message,
                "timestamp": datetime.now().isoformat()
            }
        }
    
    if include_traceback and isinstance(error, Exception):
        response["error"]["traceback"] = traceback.format_exc()
    
    return response

def handle_exception(func):
    """
    Decorator to handle exceptions in functions
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except TradingAssistantError as e:
            log_error(e, {"args": args, "kwargs": kwargs})
            return format_error_response(e)
        except Exception as e:
            log_error(e, {"args": args, "kwargs": kwargs})
            return format_error_response(e, include_traceback=True)
    
    return wrapper

def validate_data(data: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
    """
    Validate OHLCV data
    
    Args:
        data (List[Dict]): The data to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    if not data:
        return False, "Data is empty"
    
    required_fields = ["time", "open", "high", "low", "close"]
    
    for i, item in enumerate(data):
        for field in required_fields:
            if field not in item:
                return False, f"Missing required field '{field}' at index {i}"
        
        # Check data types
        if not isinstance(item.get("time"), (int, float)):
            return False, f"Invalid time value at index {i}"
        
        for field in ["open", "high", "low", "close"]:
            if not isinstance(item.get(field), (int, float)):
                return False, f"Invalid {field} value at index {i}"
        
        # Check logical constraints
        if item.get("high") < item.get("low"):
            return False, f"High value is less than low value at index {i}"
        
        if item.get("high") < item.get("open") or item.get("high") < item.get("close"):
            return False, f"High value is less than open or close value at index {i}"
        
        if item.get("low") > item.get("open") or item.get("low") > item.get("close"):
            return False, f"Low value is greater than open or close value at index {i}"
    
    return True, None

def validate_strategy(strategy: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate a trading strategy
    
    Args:
        strategy (Dict): The strategy to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    if not strategy:
        return False, "Strategy is empty"
    
    required_fields = ["name", "entry_rules", "exit_rules", "risk_management"]
    
    for field in required_fields:
        if field not in strategy:
            return False, f"Missing required field '{field}'"
    
    # Check entry rules
    if not isinstance(strategy.get("entry_rules"), list):
        return False, "Entry rules must be a list"
    
    if not strategy.get("entry_rules"):
        return False, "Entry rules cannot be empty"
    
    # Check exit rules
    if not isinstance(strategy.get("exit_rules"), list):
        return False, "Exit rules must be a list"
    
    if not strategy.get("exit_rules"):
        return False, "Exit rules cannot be empty"
    
    # Check risk management
    risk_management = strategy.get("risk_management", {})
    
    if not isinstance(risk_management, dict):
        return False, "Risk management must be an object"
    
    required_risk_fields = ["stop_loss_percent", "take_profit_percent"]
    
    for field in required_risk_fields:
        if field not in risk_management:
            return False, f"Missing required risk management field '{field}'"
        
        if not isinstance(risk_management.get(field), (int, float)):
            return False, f"Invalid {field} value"
    
    return True, None

def safe_execute(func, *args, error_class=TradingAssistantError, **kwargs):
    """
    Safely execute a function and handle exceptions
    
    Args:
        func: The function to execute
        *args: Arguments for the function
        error_class: The error class to use for exceptions
        **kwargs: Keyword arguments for the function
        
    Returns:
        The result of the function
        
    Raises:
        error_class: If an exception occurs
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        log_error(e, {"func": func.__name__, "args": args, "kwargs": kwargs})
        raise error_class(str(e), {"original_error": str(e)})

def get_error_message(error_code: str) -> str:
    """
    Get a user-friendly error message for an error code
    
    Args:
        error_code (str): The error code
        
    Returns:
        str: The error message
    """
    error_messages = {
        "DATA_ERROR": "There was an issue with the data. Please check the data format and try again.",
        "ANALYSIS_ERROR": "An error occurred during analysis. Please try again with different parameters.",
        "STRATEGY_ERROR": "There was an issue with the trading strategy. Please check the strategy configuration.",
        "BACKTEST_ERROR": "An error occurred during backtesting. Please check the strategy and data.",
        "OPTIMIZATION_ERROR": "An error occurred during strategy optimization. Please try with fewer parameters.",
        "API_ERROR": "There was an issue with the API. Please try again later.",
        "VALIDATION_ERROR": "The input data failed validation. Please check the input format.",
        "GENERAL_ERROR": "An unexpected error occurred. Please try again later."
    }
    
    return error_messages.get(error_code, "An unknown error occurred.")

def suggest_fix(error: TradingAssistantError) -> str:
    """
    Suggest a fix for an error
    
    Args:
        error (TradingAssistantError): The error
        
    Returns:
        str: The suggested fix
    """
    if error.error_code == "DATA_ERROR":
        return "Try using a different data source or timeframe. Make sure the data includes all required OHLCV fields."
    
    elif error.error_code == "ANALYSIS_ERROR":
        return "Try using different technical indicators or parameters. Some indicators may not work well with the current data."
    
    elif error.error_code == "STRATEGY_ERROR":
        return "Review your strategy rules and parameters. Make sure entry and exit rules are properly defined."
    
    elif error.error_code == "BACKTEST_ERROR":
        return "Try backtesting with a different time period or adjust the strategy parameters."
    
    elif error.error_code == "OPTIMIZATION_ERROR":
        return "Reduce the number of parameters to optimize or narrow the parameter ranges."
    
    elif error.error_code == "VALIDATION_ERROR":
        if "missing" in error.message.lower():
            return "Check that all required fields are included in your input."
        elif "invalid" in error.message.lower():
            return "Check the data types and values of your input fields."
        else:
            return "Verify that your input data meets all validation requirements."
    
    return "Please try again with different inputs or contact support if the issue persists." 