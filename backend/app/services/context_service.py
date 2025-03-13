"""
Context Management Service

This module provides functions for managing context in the trading assistant system.
It tracks complex state like active strategies, analysis results, and user preferences.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

# Store active contexts in memory (for demo purposes)
# In a production environment, this would be stored in a database
user_contexts = {}

class TradingContext:
    """
    Class to manage trading context for a user
    """
    def __init__(self, user_id: str):
        """
        Initialize a new trading context
        
        Args:
            user_id (str): The user ID
        """
        self.user_id = user_id
        self.created_at = datetime.now().isoformat()
        self.last_updated = self.created_at
        
        # Active charts
        self.active_charts = []
        
        # Active strategies
        self.active_strategies = []
        
        # Recent analyses
        self.recent_analyses = []
        
        # User preferences
        self.preferences = {
            "default_timeframe": "1d",
            "default_indicators": ["SMA_20", "SMA_50", "RSI_14"],
            "theme": "dark",
            "risk_profile": "moderate"
        }
        
        # Trading history
        self.trading_history = []
        
        # Alerts
        self.alerts = []
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the context to a dictionary
        
        Returns:
            Dict: The context as a dictionary
        """
        return {
            "user_id": self.user_id,
            "created_at": self.created_at,
            "last_updated": self.last_updated,
            "active_charts": self.active_charts,
            "active_strategies": self.active_strategies,
            "recent_analyses": self.recent_analyses,
            "preferences": self.preferences,
            "trading_history": self.trading_history,
            "alerts": self.alerts
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TradingContext':
        """
        Create a context from a dictionary
        
        Args:
            data (Dict): The dictionary to create the context from
            
        Returns:
            TradingContext: The created context
        """
        context = cls(data.get("user_id", "unknown"))
        context.created_at = data.get("created_at", datetime.now().isoformat())
        context.last_updated = data.get("last_updated", datetime.now().isoformat())
        context.active_charts = data.get("active_charts", [])
        context.active_strategies = data.get("active_strategies", [])
        context.recent_analyses = data.get("recent_analyses", [])
        context.preferences = data.get("preferences", {})
        context.trading_history = data.get("trading_history", [])
        context.alerts = data.get("alerts", [])
        return context
    
    def update_last_updated(self):
        """
        Update the last_updated timestamp
        """
        self.last_updated = datetime.now().isoformat()
    
    def add_chart(self, chart_data: Dict[str, Any]):
        """
        Add a chart to the active charts
        
        Args:
            chart_data (Dict): The chart data
        """
        # Check if chart already exists
        for i, chart in enumerate(self.active_charts):
            if chart.get("id") == chart_data.get("id"):
                # Update existing chart
                self.active_charts[i] = chart_data
                self.update_last_updated()
                return
        
        # Add new chart
        self.active_charts.append(chart_data)
        self.update_last_updated()
    
    def remove_chart(self, chart_id: str) -> bool:
        """
        Remove a chart from the active charts
        
        Args:
            chart_id (str): The chart ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        for i, chart in enumerate(self.active_charts):
            if chart.get("id") == chart_id:
                self.active_charts.pop(i)
                self.update_last_updated()
                return True
        
        return False
    
    def add_strategy(self, strategy_data: Dict[str, Any]):
        """
        Add a strategy to the active strategies
        
        Args:
            strategy_data (Dict): The strategy data
        """
        # Check if strategy already exists
        for i, strategy in enumerate(self.active_strategies):
            if strategy.get("id") == strategy_data.get("id"):
                # Update existing strategy
                self.active_strategies[i] = strategy_data
                self.update_last_updated()
                return
        
        # Add new strategy
        self.active_strategies.append(strategy_data)
        self.update_last_updated()
    
    def remove_strategy(self, strategy_id: str) -> bool:
        """
        Remove a strategy from the active strategies
        
        Args:
            strategy_id (str): The strategy ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        for i, strategy in enumerate(self.active_strategies):
            if strategy.get("id") == strategy_id:
                self.active_strategies.pop(i)
                self.update_last_updated()
                return True
        
        return False
    
    def add_analysis(self, analysis_data: Dict[str, Any]):
        """
        Add an analysis to the recent analyses
        
        Args:
            analysis_data (Dict): The analysis data
        """
        # Add timestamp if not present
        if "timestamp" not in analysis_data:
            analysis_data["timestamp"] = datetime.now().isoformat()
        
        # Add new analysis
        self.recent_analyses.append(analysis_data)
        
        # Keep only the 10 most recent analyses
        if len(self.recent_analyses) > 10:
            self.recent_analyses = sorted(
                self.recent_analyses,
                key=lambda a: a.get("timestamp", ""),
                reverse=True
            )[:10]
        
        self.update_last_updated()
    
    def update_preferences(self, preferences: Dict[str, Any]):
        """
        Update user preferences
        
        Args:
            preferences (Dict): The preferences to update
        """
        self.preferences.update(preferences)
        self.update_last_updated()
    
    def add_trade(self, trade_data: Dict[str, Any]):
        """
        Add a trade to the trading history
        
        Args:
            trade_data (Dict): The trade data
        """
        # Add timestamp if not present
        if "timestamp" not in trade_data:
            trade_data["timestamp"] = datetime.now().isoformat()
        
        # Add new trade
        self.trading_history.append(trade_data)
        self.update_last_updated()
    
    def add_alert(self, alert_data: Dict[str, Any]):
        """
        Add an alert
        
        Args:
            alert_data (Dict): The alert data
        """
        # Add timestamp if not present
        if "timestamp" not in alert_data:
            alert_data["timestamp"] = datetime.now().isoformat()
        
        # Add new alert
        self.alerts.append(alert_data)
        self.update_last_updated()
    
    def remove_alert(self, alert_id: str) -> bool:
        """
        Remove an alert
        
        Args:
            alert_id (str): The alert ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        for i, alert in enumerate(self.alerts):
            if alert.get("id") == alert_id:
                self.alerts.pop(i)
                self.update_last_updated()
                return True
        
        return False

def get_user_context(user_id: str) -> TradingContext:
    """
    Get the trading context for a user
    
    Args:
        user_id (str): The user ID
        
    Returns:
        TradingContext: The user's trading context
    """
    # Create context if it doesn't exist
    if user_id not in user_contexts:
        user_contexts[user_id] = TradingContext(user_id)
    
    return user_contexts[user_id]

def save_user_context(context: TradingContext):
    """
    Save a user's trading context
    
    Args:
        context (TradingContext): The context to save
    """
    user_contexts[context.user_id] = context

def delete_user_context(user_id: str) -> bool:
    """
    Delete a user's trading context
    
    Args:
        user_id (str): The user ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    if user_id in user_contexts:
        del user_contexts[user_id]
        return True
    
    return False

def get_chart_context(user_id: str, chart_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific chart from a user's context
    
    Args:
        user_id (str): The user ID
        chart_id (str): The chart ID
        
    Returns:
        Dict: The chart data, or None if not found
    """
    context = get_user_context(user_id)
    
    for chart in context.active_charts:
        if chart.get("id") == chart_id:
            return chart
    
    return None

def get_strategy_context(user_id: str, strategy_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific strategy from a user's context
    
    Args:
        user_id (str): The user ID
        strategy_id (str): The strategy ID
        
    Returns:
        Dict: The strategy data, or None if not found
    """
    context = get_user_context(user_id)
    
    for strategy in context.active_strategies:
        if strategy.get("id") == strategy_id:
            return strategy
    
    return None

def get_recent_analyses(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Get recent analyses for a user
    
    Args:
        user_id (str): The user ID
        limit (int): Maximum number of analyses to return
        
    Returns:
        List[Dict]: List of recent analyses
    """
    context = get_user_context(user_id)
    
    # Sort by timestamp (newest first)
    sorted_analyses = sorted(
        context.recent_analyses,
        key=lambda a: a.get("timestamp", ""),
        reverse=True
    )
    
    # Apply limit
    limited_analyses = sorted_analyses[:limit]
    
    return limited_analyses

def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """
    Get user preferences
    
    Args:
        user_id (str): The user ID
        
    Returns:
        Dict: The user preferences
    """
    context = get_user_context(user_id)
    return context.preferences

def update_user_preferences(user_id: str, preferences: Dict[str, Any]):
    """
    Update user preferences
    
    Args:
        user_id (str): The user ID
        preferences (Dict): The preferences to update
    """
    context = get_user_context(user_id)
    context.update_preferences(preferences)
    save_user_context(context)

def create_chart_context(
    user_id: str,
    symbol: str,
    timeframe: str = "1d",
    indicators: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Create a new chart context
    
    Args:
        user_id (str): The user ID
        symbol (str): The trading symbol
        timeframe (str): The chart timeframe
        indicators (List[Dict], optional): List of indicators to add to the chart
        
    Returns:
        Dict: The created chart context
    """
    # Generate chart ID
    chart_id = f"chart_{int(datetime.now().timestamp())}"
    
    # Create chart data
    chart_data = {
        "id": chart_id,
        "symbol": symbol,
        "timeframe": timeframe,
        "created_at": datetime.now().isoformat(),
        "indicators": indicators or []
    }
    
    # Add to user context
    context = get_user_context(user_id)
    context.add_chart(chart_data)
    save_user_context(context)
    
    return chart_data

def create_strategy_context(
    user_id: str,
    strategy: Dict[str, Any],
    backtest_result: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a new strategy context
    
    Args:
        user_id (str): The user ID
        strategy (Dict): The strategy data
        backtest_result (Dict, optional): The backtest result
        
    Returns:
        Dict: The created strategy context
    """
    # Generate strategy ID if not present
    if "id" not in strategy:
        strategy_id = f"strategy_{int(datetime.now().timestamp())}"
        strategy["id"] = strategy_id
    
    # Create strategy data
    strategy_data = {
        "id": strategy["id"],
        "name": strategy.get("name", "Unnamed Strategy"),
        "description": strategy.get("description", ""),
        "created_at": strategy.get("created_at", datetime.now().isoformat()),
        "strategy": strategy,
        "backtest_result": backtest_result,
        "is_active": False
    }
    
    # Add to user context
    context = get_user_context(user_id)
    context.add_strategy(strategy_data)
    save_user_context(context)
    
    return strategy_data

def activate_strategy(user_id: str, strategy_id: str) -> bool:
    """
    Activate a strategy
    
    Args:
        user_id (str): The user ID
        strategy_id (str): The strategy ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    context = get_user_context(user_id)
    
    for strategy in context.active_strategies:
        if strategy.get("id") == strategy_id:
            strategy["is_active"] = True
            save_user_context(context)
            return True
    
    return False

def deactivate_strategy(user_id: str, strategy_id: str) -> bool:
    """
    Deactivate a strategy
    
    Args:
        user_id (str): The user ID
        strategy_id (str): The strategy ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    context = get_user_context(user_id)
    
    for strategy in context.active_strategies:
        if strategy.get("id") == strategy_id:
            strategy["is_active"] = False
            save_user_context(context)
            return True
    
    return False

def add_analysis_result(
    user_id: str,
    symbol: str,
    analysis_type: str,
    result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Add an analysis result
    
    Args:
        user_id (str): The user ID
        symbol (str): The trading symbol
        analysis_type (str): The type of analysis
        result (Dict): The analysis result
        
    Returns:
        Dict: The created analysis data
    """
    # Create analysis data
    analysis_data = {
        "id": f"analysis_{int(datetime.now().timestamp())}",
        "symbol": symbol,
        "type": analysis_type,
        "timestamp": datetime.now().isoformat(),
        "result": result
    }
    
    # Add to user context
    context = get_user_context(user_id)
    context.add_analysis(analysis_data)
    save_user_context(context)
    
    return analysis_data

def create_alert(
    user_id: str,
    symbol: str,
    condition: str,
    target: float,
    message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a price alert
    
    Args:
        user_id (str): The user ID
        symbol (str): The trading symbol
        condition (str): Alert condition (above, below, equals)
        target (float): Target value
        message (str, optional): Custom message
        
    Returns:
        Dict: The created alert data
    """
    # Create alert data
    alert_data = {
        "id": f"alert_{int(datetime.now().timestamp())}",
        "symbol": symbol,
        "condition": condition,
        "target": target,
        "message": message or f"{symbol} {condition} {target}",
        "created_at": datetime.now().isoformat(),
        "triggered": False
    }
    
    # Add to user context
    context = get_user_context(user_id)
    context.add_alert(alert_data)
    save_user_context(context)
    
    return alert_data

def trigger_alert(user_id: str, alert_id: str, current_value: float) -> bool:
    """
    Trigger an alert
    
    Args:
        user_id (str): The user ID
        alert_id (str): The alert ID
        current_value (float): The current value
        
    Returns:
        bool: True if successful, False otherwise
    """
    context = get_user_context(user_id)
    
    for alert in context.alerts:
        if alert.get("id") == alert_id:
            alert["triggered"] = True
            alert["triggered_at"] = datetime.now().isoformat()
            alert["value_at_trigger"] = current_value
            save_user_context(context)
            return True
    
    return False

def get_active_alerts(user_id: str) -> List[Dict[str, Any]]:
    """
    Get active alerts for a user
    
    Args:
        user_id (str): The user ID
        
    Returns:
        List[Dict]: List of active alerts
    """
    context = get_user_context(user_id)
    
    # Filter untriggered alerts
    active_alerts = [alert for alert in context.alerts if not alert.get("triggered", False)]
    
    return active_alerts

def get_context_summary(user_id: str) -> Dict[str, Any]:
    """
    Get a summary of a user's context
    
    Args:
        user_id (str): The user ID
        
    Returns:
        Dict: The context summary
    """
    context = get_user_context(user_id)
    
    return {
        "user_id": context.user_id,
        "active_charts_count": len(context.active_charts),
        "active_strategies_count": len(context.active_strategies),
        "recent_analyses_count": len(context.recent_analyses),
        "alerts_count": len(context.alerts),
        "active_alerts_count": len([a for a in context.alerts if not a.get("triggered", False)]),
        "trading_history_count": len(context.trading_history),
        "last_updated": context.last_updated
    } 