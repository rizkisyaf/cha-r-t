"""
Error Handling Module

This module provides comprehensive error handling for trading analysis tasks.
It includes custom exceptions, error logging, and error response formatting.
"""

from .error_handling import (
    # Custom exceptions
    TradingAssistantError,
    DataError,
    AnalysisError,
    StrategyError,
    BacktestError,
    OptimizationError,
    APIError,
    ValidationError,
    
    # Error handling functions
    log_error,
    format_error_response,
    handle_exception,
    validate_data,
    validate_strategy,
    safe_execute,
    get_error_message,
    suggest_fix
)

__all__ = [
    # Custom exceptions
    'TradingAssistantError',
    'DataError',
    'AnalysisError',
    'StrategyError',
    'BacktestError',
    'OptimizationError',
    'APIError',
    'ValidationError',
    
    # Error handling functions
    'log_error',
    'format_error_response',
    'handle_exception',
    'validate_data',
    'validate_strategy',
    'safe_execute',
    'get_error_message',
    'suggest_fix'
] 