"""
Notification Service Module

This module provides functions for sending notifications to the frontend.
It supports different types of notifications such as alerts, warnings, and info messages.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

# Store active notifications in memory (for demo purposes)
# In a production environment, this would be stored in a database
active_notifications = []

# Define notification types
NOTIFICATION_TYPES = {
    "alert": {
        "priority": "high",
        "icon": "alert-circle",
        "color": "red"
    },
    "warning": {
        "priority": "medium",
        "icon": "alert-triangle",
        "color": "orange"
    },
    "info": {
        "priority": "low",
        "icon": "info",
        "color": "blue"
    },
    "success": {
        "priority": "low",
        "icon": "check-circle",
        "color": "green"
    },
    "strategy": {
        "priority": "medium",
        "icon": "trending-up",
        "color": "purple"
    },
    "trade": {
        "priority": "high",
        "icon": "dollar-sign",
        "color": "green"
    }
}

def create_notification(
    message: str,
    notification_type: str = "info",
    title: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
    expiry: Optional[int] = None  # Expiry in seconds
) -> Dict[str, Any]:
    """
    Create a notification object
    
    Args:
        message (str): The notification message
        notification_type (str): Type of notification (alert, warning, info, success, strategy, trade)
        title (str, optional): Title of the notification
        data (Dict, optional): Additional data to include with the notification
        expiry (int, optional): Time in seconds until the notification expires
        
    Returns:
        Dict: The notification object
    """
    # Validate notification type
    if notification_type not in NOTIFICATION_TYPES:
        notification_type = "info"
    
    # Get current timestamp
    timestamp = datetime.now().isoformat()
    
    # Generate notification ID (timestamp-based for simplicity)
    notification_id = f"notif_{int(datetime.now().timestamp())}"
    
    # Calculate expiry timestamp if provided
    expiry_timestamp = None
    if expiry:
        expiry_dt = datetime.now().timestamp() + expiry
        expiry_timestamp = datetime.fromtimestamp(expiry_dt).isoformat()
    
    # Create notification object
    notification = {
        "id": notification_id,
        "type": notification_type,
        "priority": NOTIFICATION_TYPES[notification_type]["priority"],
        "icon": NOTIFICATION_TYPES[notification_type]["icon"],
        "color": NOTIFICATION_TYPES[notification_type]["color"],
        "message": message,
        "timestamp": timestamp,
        "read": False,
        "expiry": expiry_timestamp
    }
    
    # Add title if provided
    if title:
        notification["title"] = title
    
    # Add additional data if provided
    if data:
        notification["data"] = data
    
    return notification

def send_notification(
    message: str,
    notification_type: str = "info",
    title: Optional[str] = None,
    data: Optional[Dict[str, Any]] = None,
    expiry: Optional[int] = None,
    store: bool = True
) -> Dict[str, Any]:
    """
    Send a notification to the frontend
    
    Args:
        message (str): The notification message
        notification_type (str): Type of notification (alert, warning, info, success, strategy, trade)
        title (str, optional): Title of the notification
        data (Dict, optional): Additional data to include with the notification
        expiry (int, optional): Time in seconds until the notification expires
        store (bool): Whether to store the notification in memory
        
    Returns:
        Dict: The notification object
    """
    # Create notification object
    notification = create_notification(
        message=message,
        notification_type=notification_type,
        title=title,
        data=data,
        expiry=expiry
    )
    
    # Store notification if requested
    if store:
        active_notifications.append(notification)
        
        # Clean up expired notifications
        clean_expired_notifications()
    
    # In a real implementation, this would send the notification to the frontend
    # via WebSockets, Server-Sent Events, or another real-time communication method
    
    return notification

def get_notifications(
    limit: int = 10,
    offset: int = 0,
    include_read: bool = False,
    notification_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get active notifications
    
    Args:
        limit (int): Maximum number of notifications to return
        offset (int): Offset for pagination
        include_read (bool): Whether to include read notifications
        notification_type (str, optional): Filter by notification type
        
    Returns:
        List[Dict]: List of notification objects
    """
    # Clean up expired notifications
    clean_expired_notifications()
    
    # Filter notifications
    filtered_notifications = active_notifications
    
    if not include_read:
        filtered_notifications = [n for n in filtered_notifications if not n.get("read", False)]
    
    if notification_type:
        filtered_notifications = [n for n in filtered_notifications if n.get("type") == notification_type]
    
    # Sort by timestamp (newest first)
    sorted_notifications = sorted(
        filtered_notifications,
        key=lambda n: n.get("timestamp", ""),
        reverse=True
    )
    
    # Apply pagination
    paginated_notifications = sorted_notifications[offset:offset + limit]
    
    return paginated_notifications

def mark_notification_read(notification_id: str) -> bool:
    """
    Mark a notification as read
    
    Args:
        notification_id (str): ID of the notification to mark as read
        
    Returns:
        bool: True if successful, False otherwise
    """
    for notification in active_notifications:
        if notification.get("id") == notification_id:
            notification["read"] = True
            return True
    
    return False

def mark_all_notifications_read() -> int:
    """
    Mark all notifications as read
    
    Returns:
        int: Number of notifications marked as read
    """
    count = 0
    for notification in active_notifications:
        if not notification.get("read", False):
            notification["read"] = True
            count += 1
    
    return count

def delete_notification(notification_id: str) -> bool:
    """
    Delete a notification
    
    Args:
        notification_id (str): ID of the notification to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    global active_notifications
    
    for i, notification in enumerate(active_notifications):
        if notification.get("id") == notification_id:
            active_notifications.pop(i)
            return True
    
    return False

def clean_expired_notifications() -> int:
    """
    Clean up expired notifications
    
    Returns:
        int: Number of notifications removed
    """
    global active_notifications
    
    current_time = datetime.now().isoformat()
    count = 0
    
    # Filter out expired notifications
    new_notifications = []
    for notification in active_notifications:
        expiry = notification.get("expiry")
        if expiry and expiry < current_time:
            count += 1
        else:
            new_notifications.append(notification)
    
    active_notifications = new_notifications
    return count

def create_strategy_notification(
    strategy_name: str,
    strategy_type: str,
    details: Dict[str, Any],
    action_required: bool = False
) -> Dict[str, Any]:
    """
    Create a notification for a trading strategy
    
    Args:
        strategy_name (str): Name of the strategy
        strategy_type (str): Type of strategy (e.g., "momentum", "mean_reversion")
        details (Dict): Strategy details
        action_required (bool): Whether user action is required
        
    Returns:
        Dict: The notification object
    """
    notification_type = "strategy"
    title = f"Strategy: {strategy_name}"
    
    # Create message based on strategy details
    message = f"Trading strategy '{strategy_name}' ({strategy_type}) "
    
    if "performance" in details:
        perf = details["performance"]
        message += f"has a {perf.get('rating', 'Unknown')} rating with "
        message += f"{perf.get('profit_percent', 0):.2f}% profit and "
        message += f"{perf.get('win_rate', 0):.2f}% win rate."
    else:
        message += "has been created."
    
    if action_required:
        message += " Action required."
        notification_type = "alert"
    
    # Send notification
    return send_notification(
        message=message,
        notification_type=notification_type,
        title=title,
        data={
            "strategy_name": strategy_name,
            "strategy_type": strategy_type,
            "details": details,
            "action_required": action_required
        },
        expiry=86400  # 24 hours
    )

def create_trade_notification(
    symbol: str,
    action: str,
    price: float,
    quantity: float,
    strategy_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a notification for a trade
    
    Args:
        symbol (str): Trading symbol
        action (str): Trade action (buy, sell)
        price (float): Trade price
        quantity (float): Trade quantity
        strategy_name (str, optional): Name of the strategy that triggered the trade
        
    Returns:
        Dict: The notification object
    """
    title = f"Trade: {action.upper()} {symbol}"
    
    # Create message based on trade details
    message = f"{action.capitalize()} {quantity} {symbol} at ${price:.2f}"
    
    if strategy_name:
        message += f" based on '{strategy_name}' strategy"
    
    # Send notification
    return send_notification(
        message=message,
        notification_type="trade",
        title=title,
        data={
            "symbol": symbol,
            "action": action,
            "price": price,
            "quantity": quantity,
            "strategy_name": strategy_name,
            "timestamp": datetime.now().isoformat()
        },
        expiry=86400  # 24 hours
    )

def create_alert_notification(
    symbol: str,
    condition: str,
    value: float,
    target: float
) -> Dict[str, Any]:
    """
    Create a notification for a price alert
    
    Args:
        symbol (str): Trading symbol
        condition (str): Alert condition (above, below, equals)
        value (float): Current value
        target (float): Target value
        
    Returns:
        Dict: The notification object
    """
    title = f"Alert: {symbol} {condition.upper()} {target}"
    
    # Create message based on alert details
    message = f"{symbol} is now {condition} ${target:.2f} (current: ${value:.2f})"
    
    # Send notification
    return send_notification(
        message=message,
        notification_type="alert",
        title=title,
        data={
            "symbol": symbol,
            "condition": condition,
            "value": value,
            "target": target,
            "timestamp": datetime.now().isoformat()
        },
        expiry=3600  # 1 hour
    ) 