"""
Trading Strategy Module

This module provides functions for creating and testing trading strategies
based on technical indicators and chart patterns.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Union, Tuple
from datetime import datetime

def convert_to_dataframe(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert a list of OHLCV dictionaries to a pandas DataFrame
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries with keys 'time', 'open', 'high', 'low', 'close', 'volume'
        
    Returns:
        pd.DataFrame: DataFrame with OHLCV data
    """
    df = pd.DataFrame(data)
    df.set_index('time', inplace=True)
    return df

def create_strategy(patterns: List[Dict[str, Any]], indicators: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a trading strategy based on identified patterns and indicators
    
    Args:
        patterns (List[Dict]): List of identified patterns
        indicators (Dict): Dictionary of calculated indicators
        
    Returns:
        Dict: Strategy object with entry/exit rules and parameters
    """
    # Initialize strategy object
    strategy = {
        "name": "Auto-generated Strategy",
        "description": "Strategy based on technical indicators and chart patterns",
        "created_at": datetime.now().isoformat(),
        "entry_rules": [],
        "exit_rules": [],
        "risk_management": {
            "stop_loss_percent": 2.0,
            "take_profit_percent": 6.0,
            "max_position_size_percent": 5.0
        },
        "parameters": {}
    }
    
    # Process patterns
    if patterns and len(patterns) > 0:
        # Sort patterns by probability
        sorted_patterns = sorted(patterns, key=lambda x: x.get('probability', 0), reverse=True)
        
        # Get the most probable pattern
        top_pattern = sorted_patterns[0]
        pattern_type = top_pattern.get('pattern', '')
        
        # Add pattern to strategy description
        strategy["description"] += f" with {pattern_type.replace('_', ' ').title()} pattern"
        
        # Add pattern-based rules
        if pattern_type in ['double_bottom', 'ascending_triangle']:
            # Bullish patterns
            strategy["entry_rules"].append({
                "type": "pattern",
                "pattern": pattern_type,
                "action": "buy",
                "description": f"Enter long when {pattern_type.replace('_', ' ')} pattern is confirmed"
            })
        elif pattern_type in ['double_top', 'head_and_shoulders', 'descending_triangle']:
            # Bearish patterns
            strategy["entry_rules"].append({
                "type": "pattern",
                "pattern": pattern_type,
                "action": "sell",
                "description": f"Enter short when {pattern_type.replace('_', ' ')} pattern is confirmed"
            })
    
    # Process indicators
    if indicators:
        # Check for moving averages
        for indicator_name, indicator_data in indicators.items():
            if indicator_name.startswith("SMA") or indicator_name.startswith("EMA"):
                period = int(indicator_name.split("_")[1]) if "_" in indicator_name else 20
                
                # Add MA crossover rules
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "buy",
                    "condition": "price_crosses_above",
                    "description": f"Enter long when price crosses above {indicator_name}"
                })
                
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "sell",
                    "condition": "price_crosses_below",
                    "description": f"Enter short when price crosses below {indicator_name}"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "exit_long",
                    "condition": "price_crosses_below",
                    "description": f"Exit long when price crosses below {indicator_name}"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "exit_short",
                    "condition": "price_crosses_above",
                    "description": f"Exit short when price crosses above {indicator_name}"
                })
                
                # Add parameter
                strategy["parameters"][f"{indicator_name}_period"] = period
            
            # Check for RSI
            elif indicator_name.startswith("RSI"):
                period = int(indicator_name.split("_")[1]) if "_" in indicator_name else 14
                
                # Add RSI rules
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "buy",
                    "condition": "crosses_above",
                    "threshold": 30,
                    "description": f"Enter long when {indicator_name} crosses above 30 (oversold)"
                })
                
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "sell",
                    "condition": "crosses_below",
                    "threshold": 70,
                    "description": f"Enter short when {indicator_name} crosses below 70 (overbought)"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "exit_long",
                    "condition": "crosses_above",
                    "threshold": 70,
                    "description": f"Exit long when {indicator_name} crosses above 70 (overbought)"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": indicator_name,
                    "action": "exit_short",
                    "condition": "crosses_below",
                    "threshold": 30,
                    "description": f"Exit short when {indicator_name} crosses below 30 (oversold)"
                })
                
                # Add parameter
                strategy["parameters"][f"{indicator_name}_period"] = period
                strategy["parameters"][f"{indicator_name}_overbought"] = 70
                strategy["parameters"][f"{indicator_name}_oversold"] = 30
            
            # Check for MACD
            elif indicator_name.startswith("MACD"):
                # Add MACD rules
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": "MACD",
                    "action": "buy",
                    "condition": "line_crosses_above_signal",
                    "description": "Enter long when MACD line crosses above signal line"
                })
                
                strategy["entry_rules"].append({
                    "type": "indicator",
                    "indicator": "MACD",
                    "action": "sell",
                    "condition": "line_crosses_below_signal",
                    "description": "Enter short when MACD line crosses below signal line"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": "MACD",
                    "action": "exit_long",
                    "condition": "line_crosses_below_signal",
                    "description": "Exit long when MACD line crosses below signal line"
                })
                
                strategy["exit_rules"].append({
                    "type": "indicator",
                    "indicator": "MACD",
                    "action": "exit_short",
                    "condition": "line_crosses_above_signal",
                    "description": "Exit short when MACD line crosses above signal line"
                })
                
                # Add parameters
                strategy["parameters"]["MACD_fast_period"] = 12
                strategy["parameters"]["MACD_slow_period"] = 26
                strategy["parameters"]["MACD_signal_period"] = 9
    
    # If no rules were added, add some default rules
    if not strategy["entry_rules"]:
        strategy["entry_rules"].append({
            "type": "price_action",
            "action": "buy",
            "condition": "higher_high_higher_low",
            "lookback": 3,
            "description": "Enter long when price makes 3 consecutive higher highs and higher lows"
        })
        
        strategy["entry_rules"].append({
            "type": "price_action",
            "action": "sell",
            "condition": "lower_high_lower_low",
            "lookback": 3,
            "description": "Enter short when price makes 3 consecutive lower highs and lower lows"
        })
    
    if not strategy["exit_rules"]:
        strategy["exit_rules"].append({
            "type": "stop_loss",
            "action": "exit_long",
            "percent": strategy["risk_management"]["stop_loss_percent"],
            "description": f"Exit long when price falls {strategy['risk_management']['stop_loss_percent']}% below entry"
        })
        
        strategy["exit_rules"].append({
            "type": "stop_loss",
            "action": "exit_short",
            "percent": strategy["risk_management"]["stop_loss_percent"],
            "description": f"Exit short when price rises {strategy['risk_management']['stop_loss_percent']}% above entry"
        })
        
        strategy["exit_rules"].append({
            "type": "take_profit",
            "action": "exit_long",
            "percent": strategy["risk_management"]["take_profit_percent"],
            "description": f"Exit long when price rises {strategy['risk_management']['take_profit_percent']}% above entry"
        })
        
        strategy["exit_rules"].append({
            "type": "take_profit",
            "action": "exit_short",
            "percent": strategy["risk_management"]["take_profit_percent"],
            "description": f"Exit short when price falls {strategy['risk_management']['take_profit_percent']}% below entry"
        })
    
    return strategy

def backtest_strategy(strategy: Dict[str, Any], data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Backtest a trading strategy on historical data
    
    Args:
        strategy (Dict): Strategy object with entry/exit rules and parameters
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        Dict: Backtest results with performance metrics
    """
    if not data or len(data) < 10:
        return {
            "success": False,
            "error": "Insufficient data for backtesting"
        }
    
    # Convert data to DataFrame
    df = convert_to_dataframe(data)
    
    # Initialize backtest results
    results = {
        "strategy_name": strategy.get("name", "Unnamed Strategy"),
        "start_date": datetime.fromtimestamp(df.index[0]).isoformat(),
        "end_date": datetime.fromtimestamp(df.index[-1]).isoformat(),
        "initial_capital": 10000.0,
        "final_capital": 10000.0,
        "total_trades": 0,
        "winning_trades": 0,
        "losing_trades": 0,
        "win_rate": 0.0,
        "profit_factor": 0.0,
        "max_drawdown": 0.0,
        "max_drawdown_percent": 0.0,
        "trades": []
    }
    
    # Prepare data for backtesting
    df['position'] = 0  # 0: no position, 1: long, -1: short
    df['entry_price'] = np.nan
    df['exit_price'] = np.nan
    df['stop_loss'] = np.nan
    df['take_profit'] = np.nan
    df['trade_result'] = np.nan
    
    # Simplified backtesting logic for demonstration
    # In a real implementation, we would process each rule in the strategy
    
    # For this simplified version, we'll implement a basic moving average crossover strategy
    # if there's an SMA or EMA in the strategy parameters
    
    ma_period = None
    for param_name, param_value in strategy.get("parameters", {}).items():
        if param_name.startswith("SMA_") or param_name.startswith("EMA_"):
            if param_name.endswith("_period"):
                ma_period = param_value
                break
    
    if ma_period:
        # Calculate moving average
        df['ma'] = df['close'].rolling(window=ma_period).mean()
        
        # Generate signals
        df['signal'] = 0
        df.loc[df['close'] > df['ma'], 'signal'] = 1  # Buy signal
        df.loc[df['close'] < df['ma'], 'signal'] = -1  # Sell signal
        
        # Process signals
        position = 0
        entry_price = 0
        stop_loss = 0
        take_profit = 0
        
        for i in range(ma_period + 1, len(df)):
            # Check for exit conditions first
            if position == 1:  # Long position
                # Check stop loss
                if df['low'].iloc[i] <= stop_loss:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = stop_loss
                    df.loc[df.index[i], 'trade_result'] = (stop_loss / entry_price - 1) * 100
                    position = 0
                # Check take profit
                elif df['high'].iloc[i] >= take_profit:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = take_profit
                    df.loc[df.index[i], 'trade_result'] = (take_profit / entry_price - 1) * 100
                    position = 0
                # Check signal change
                elif df['signal'].iloc[i] == -1 and df['signal'].iloc[i-1] == 1:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = df['close'].iloc[i]
                    df.loc[df.index[i], 'trade_result'] = (df['close'].iloc[i] / entry_price - 1) * 100
                    position = 0
            
            elif position == -1:  # Short position
                # Check stop loss
                if df['high'].iloc[i] >= stop_loss:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = stop_loss
                    df.loc[df.index[i], 'trade_result'] = (entry_price / stop_loss - 1) * 100
                    position = 0
                # Check take profit
                elif df['low'].iloc[i] <= take_profit:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = take_profit
                    df.loc[df.index[i], 'trade_result'] = (entry_price / take_profit - 1) * 100
                    position = 0
                # Check signal change
                elif df['signal'].iloc[i] == 1 and df['signal'].iloc[i-1] == -1:
                    df.loc[df.index[i], 'position'] = 0
                    df.loc[df.index[i], 'exit_price'] = df['close'].iloc[i]
                    df.loc[df.index[i], 'trade_result'] = (entry_price / df['close'].iloc[i] - 1) * 100
                    position = 0
            
            # Check for entry conditions
            if position == 0:
                # Check buy signal
                if df['signal'].iloc[i] == 1 and df['signal'].iloc[i-1] == -1:
                    position = 1
                    entry_price = df['close'].iloc[i]
                    stop_loss = entry_price * (1 - strategy["risk_management"]["stop_loss_percent"] / 100)
                    take_profit = entry_price * (1 + strategy["risk_management"]["take_profit_percent"] / 100)
                    
                    df.loc[df.index[i], 'position'] = 1
                    df.loc[df.index[i], 'entry_price'] = entry_price
                    df.loc[df.index[i], 'stop_loss'] = stop_loss
                    df.loc[df.index[i], 'take_profit'] = take_profit
                
                # Check sell signal
                elif df['signal'].iloc[i] == -1 and df['signal'].iloc[i-1] == 1:
                    position = -1
                    entry_price = df['close'].iloc[i]
                    stop_loss = entry_price * (1 + strategy["risk_management"]["stop_loss_percent"] / 100)
                    take_profit = entry_price * (1 - strategy["risk_management"]["take_profit_percent"] / 100)
                    
                    df.loc[df.index[i], 'position'] = -1
                    df.loc[df.index[i], 'entry_price'] = entry_price
                    df.loc[df.index[i], 'stop_loss'] = stop_loss
                    df.loc[df.index[i], 'take_profit'] = take_profit
    
    # Calculate performance metrics
    trades = df[df['trade_result'].notna()]
    
    if len(trades) > 0:
        # Update trade count
        results["total_trades"] = len(trades)
        results["winning_trades"] = len(trades[trades['trade_result'] > 0])
        results["losing_trades"] = len(trades[trades['trade_result'] <= 0])
        
        # Calculate win rate
        results["win_rate"] = results["winning_trades"] / results["total_trades"] if results["total_trades"] > 0 else 0.0
        
        # Calculate profit factor
        total_profit = trades[trades['trade_result'] > 0]['trade_result'].sum()
        total_loss = abs(trades[trades['trade_result'] <= 0]['trade_result'].sum())
        results["profit_factor"] = total_profit / total_loss if total_loss > 0 else float('inf')
        
        # Calculate equity curve
        equity = results["initial_capital"]
        equity_curve = [equity]
        
        for result in trades['trade_result']:
            trade_profit = equity * result / 100
            equity += trade_profit
            equity_curve.append(equity)
        
        # Calculate drawdown
        peak = equity_curve[0]
        drawdown = 0
        drawdown_percent = 0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            current_drawdown = peak - value
            current_drawdown_percent = (current_drawdown / peak) * 100
            
            if current_drawdown > drawdown:
                drawdown = current_drawdown
                drawdown_percent = current_drawdown_percent
        
        results["max_drawdown"] = drawdown
        results["max_drawdown_percent"] = drawdown_percent
        results["final_capital"] = equity_curve[-1]
        
        # Prepare trade list
        for i, trade in trades.iterrows():
            trade_data = {
                "entry_time": datetime.fromtimestamp(i).isoformat(),
                "exit_time": datetime.fromtimestamp(i).isoformat(),  # Simplified, should be the actual exit time
                "position": "long" if trade['position'] == 1 else "short",
                "entry_price": trade['entry_price'],
                "exit_price": trade['exit_price'],
                "profit_loss": trade['trade_result'],
                "profit_loss_percent": trade['trade_result']
            }
            results["trades"].append(trade_data)
    
    return results 

def optimize_strategy(strategy: Dict[str, Any], data: List[Dict[str, Any]], 
                     param_ranges: Dict[str, List[Any]]) -> Dict[str, Any]:
    """
    Optimize a trading strategy by testing different parameter combinations
    
    Args:
        strategy (Dict): Strategy object with entry/exit rules and parameters
        data (List[Dict]): List of OHLCV dictionaries
        param_ranges (Dict): Dictionary of parameter names and their possible values to test
        
    Returns:
        Dict: Optimized strategy with best parameters and performance metrics
    """
    if not data or len(data) < 10:
        return {
            "success": False,
            "error": "Insufficient data for optimization"
        }
    
    if not param_ranges or len(param_ranges) == 0:
        return {
            "success": False,
            "error": "No parameters provided for optimization"
        }
    
    # Initialize results
    best_result = {
        "strategy": None,
        "backtest_result": None,
        "performance_score": -float('inf')
    }
    
    # Generate parameter combinations
    param_names = list(param_ranges.keys())
    param_values = list(param_ranges.values())
    
    # Limit the number of combinations to avoid excessive computation
    max_combinations = 100
    total_combinations = 1
    for values in param_values:
        total_combinations *= len(values)
    
    if total_combinations > max_combinations:
        return {
            "success": False,
            "error": f"Too many parameter combinations ({total_combinations}). Maximum allowed is {max_combinations}."
        }
    
    # Helper function to generate all combinations
    def generate_combinations(params, values, current_idx=0, current_combo={}):
        if current_idx == len(params):
            yield current_combo.copy()
            return
        
        param = params[current_idx]
        for value in values[current_idx]:
            current_combo[param] = value
            yield from generate_combinations(params, values, current_idx + 1, current_combo)
    
    # Test each parameter combination
    for params in generate_combinations(param_names, param_values):
        # Create a copy of the strategy with the current parameters
        strategy_copy = strategy.copy()
        strategy_copy["parameters"] = {**strategy.get("parameters", {}), **params}
        
        # Update strategy name to include parameters
        param_str = ", ".join([f"{k}={v}" for k, v in params.items()])
        strategy_copy["name"] = f"{strategy.get('name', 'Strategy')} ({param_str})"
        
        # Backtest the strategy with current parameters
        backtest_result = backtest_strategy(strategy_copy, data)
        
        # Skip if backtest failed
        if not backtest_result.get("total_trades", 0) > 0:
            continue
        
        # Calculate performance score
        # This is a simplified score that balances profit, win rate, and drawdown
        # You can customize this based on your preferences
        profit_percent = (backtest_result["final_capital"] / backtest_result["initial_capital"] - 1) * 100
        win_rate = backtest_result["win_rate"] * 100
        max_drawdown = backtest_result["max_drawdown_percent"]
        
        # Higher profit and win rate are better, lower drawdown is better
        performance_score = profit_percent * 0.5 + win_rate * 0.3 - max_drawdown * 0.2
        
        # Update best result if current is better
        if performance_score > best_result["performance_score"]:
            best_result["strategy"] = strategy_copy
            best_result["backtest_result"] = backtest_result
            best_result["performance_score"] = performance_score
    
    # Return the best strategy and its performance
    if best_result["strategy"] is None:
        return {
            "success": False,
            "error": "No valid parameter combinations found"
        }
    
    return {
        "success": True,
        "optimized_strategy": best_result["strategy"],
        "backtest_result": best_result["backtest_result"],
        "performance_score": best_result["performance_score"],
        "tested_combinations": total_combinations
    }

def generate_strategy_report(strategy: Dict[str, Any], backtest_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a comprehensive report for a trading strategy
    
    Args:
        strategy (Dict): Strategy object with entry/exit rules and parameters
        backtest_result (Dict): Results from backtesting the strategy
        
    Returns:
        Dict: Report with strategy details, performance metrics, and recommendations
    """
    if not strategy or not backtest_result:
        return {
            "success": False,
            "error": "Invalid strategy or backtest result"
        }
    
    # Calculate additional metrics
    profit_percent = (backtest_result["final_capital"] / backtest_result["initial_capital"] - 1) * 100
    avg_profit_per_trade = profit_percent / backtest_result["total_trades"] if backtest_result["total_trades"] > 0 else 0
    
    # Generate strategy summary
    entry_rules_summary = [rule.get("description", "Unknown rule") for rule in strategy.get("entry_rules", [])]
    exit_rules_summary = [rule.get("description", "Unknown rule") for rule in strategy.get("exit_rules", [])]
    
    # Generate performance assessment
    performance_rating = "Poor"
    if profit_percent > 20 and backtest_result["win_rate"] > 0.5 and backtest_result["max_drawdown_percent"] < 15:
        performance_rating = "Excellent"
    elif profit_percent > 10 and backtest_result["win_rate"] > 0.4 and backtest_result["max_drawdown_percent"] < 20:
        performance_rating = "Good"
    elif profit_percent > 0:
        performance_rating = "Average"
    
    # Generate recommendations
    recommendations = []
    
    if backtest_result["win_rate"] < 0.4:
        recommendations.append("Consider improving entry criteria to increase win rate")
    
    if backtest_result["max_drawdown_percent"] > 20:
        recommendations.append("Implement tighter stop-loss rules to reduce drawdown")
    
    if backtest_result["total_trades"] < 10:
        recommendations.append("Strategy generates too few trades, consider relaxing entry criteria")
    
    if backtest_result["profit_factor"] < 1.5 and backtest_result["profit_factor"] > 0:
        recommendations.append("Improve risk-reward ratio by adjusting take-profit levels")
    
    # Compile the report
    report = {
        "success": True,
        "strategy_name": strategy.get("name", "Unnamed Strategy"),
        "strategy_description": strategy.get("description", "No description"),
        "created_at": strategy.get("created_at", datetime.now().isoformat()),
        "performance": {
            "rating": performance_rating,
            "profit_percent": profit_percent,
            "win_rate": backtest_result["win_rate"] * 100,
            "profit_factor": backtest_result["profit_factor"],
            "max_drawdown_percent": backtest_result["max_drawdown_percent"],
            "total_trades": backtest_result["total_trades"],
            "avg_profit_per_trade": avg_profit_per_trade
        },
        "summary": {
            "entry_rules": entry_rules_summary,
            "exit_rules": exit_rules_summary,
            "risk_management": strategy.get("risk_management", {})
        },
        "recommendations": recommendations,
        "backtest_period": {
            "start_date": backtest_result.get("start_date", "Unknown"),
            "end_date": backtest_result.get("end_date", "Unknown")
        }
    }
    
    return report 