"""
Trading Strategies Example

This script demonstrates how to use the trading strategies module to create,
backtest, optimize, and report on trading strategies.
"""

import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import List, Dict, Any

# Import trading strategies module
from strategy import (
    convert_to_dataframe,
    create_strategy,
    backtest_strategy,
    optimize_strategy,
    generate_strategy_report
)

# Remove the financial_data_service import since we'll use only sample data


def generate_sample_data() -> List[Dict[str, Any]]:
    """
    Generate sample OHLCV data for testing
    
    Returns:
        List[Dict]: List of OHLCV dictionaries
    """
    # Generate 100 days of sample data
    data = []
    start_date = datetime.now() - timedelta(days=100)
    
    # Start with a price of 100
    price = 100.0
    
    for i in range(100):
        current_date = start_date + timedelta(days=i)
        timestamp = int(current_date.timestamp())
        
        # Generate random price movement (with some trend)
        change = np.random.normal(0, 1) + (0.05 if i < 50 else -0.05)  # Uptrend then downtrend
        price *= (1 + change / 100)
        
        # Generate OHLCV data
        open_price = price
        high_price = price * (1 + abs(np.random.normal(0, 0.5)) / 100)
        low_price = price * (1 - abs(np.random.normal(0, 0.5)) / 100)
        close_price = price * (1 + np.random.normal(0, 0.2) / 100)
        volume = np.random.randint(1000, 10000)
        
        data.append({
            "time": timestamp,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "volume": volume
        })
    
    return data


def example_create_strategy():
    """
    Example of creating a trading strategy
    """
    print("\n=== Creating a Trading Strategy ===\n")
    
    # Define some sample patterns and indicators
    patterns = [
        {
            "pattern": "double_bottom",
            "probability": 0.85,
            "start_idx": 20,
            "end_idx": 40
        }
    ]
    
    indicators = {
        "SMA_20": {
            "values": [100, 101, 102],  # Just placeholder values
            "period": 20
        },
        "RSI_14": {
            "values": [45, 48, 52],  # Just placeholder values
            "period": 14,
            "overbought": 70,
            "oversold": 30
        }
    }
    
    # Create a strategy
    strategy = create_strategy(patterns, indicators)
    
    # Print the strategy
    print(json.dumps(strategy, indent=2))
    
    return strategy


def example_backtest_strategy(strategy: Dict[str, Any]):
    """
    Example of backtesting a trading strategy
    
    Args:
        strategy (Dict): Trading strategy to backtest
    """
    print("\n=== Backtesting a Trading Strategy ===\n")
    
    # Get sample data for backtesting
    data = generate_sample_data()
    
    # Backtest the strategy
    backtest_result = backtest_strategy(strategy, data)
    
    # Print the backtest results
    print(f"Strategy: {backtest_result.get('strategy_name')}")
    print(f"Period: {backtest_result.get('start_date')} to {backtest_result.get('end_date')}")
    print(f"Initial Capital: ${backtest_result.get('initial_capital'):.2f}")
    print(f"Final Capital: ${backtest_result.get('final_capital'):.2f}")
    print(f"Total Profit: ${backtest_result.get('final_capital') - backtest_result.get('initial_capital'):.2f}")
    print(f"Total Trades: {backtest_result.get('total_trades')}")
    print(f"Win Rate: {backtest_result.get('win_rate') * 100:.2f}%")
    print(f"Profit Factor: {backtest_result.get('profit_factor'):.2f}")
    print(f"Max Drawdown: {backtest_result.get('max_drawdown_percent'):.2f}%")
    
    return backtest_result


def example_optimize_strategy(strategy: Dict[str, Any]):
    """
    Example of optimizing a trading strategy
    
    Args:
        strategy (Dict): Trading strategy to optimize
    """
    print("\n=== Optimizing a Trading Strategy ===\n")
    
    # Get sample data for optimization
    data = generate_sample_data()
    
    # Define parameter ranges to test
    param_ranges = {
        "SMA_20_period": [10, 20, 50],
        "RSI_14_period": [7, 14, 21],
        "RSI_14_oversold": [20, 30, 40],
        "RSI_14_overbought": [60, 70, 80]
    }
    
    # Optimize the strategy
    optimization_result = optimize_strategy(strategy, data, param_ranges)
    
    if optimization_result.get("success"):
        optimized_strategy = optimization_result.get("optimized_strategy")
        backtest_result = optimization_result.get("backtest_result")
        
        print(f"Tested {optimization_result.get('tested_combinations')} parameter combinations")
        print(f"Best Strategy: {optimized_strategy.get('name')}")
        print(f"Performance Score: {optimization_result.get('performance_score'):.2f}")
        print(f"Final Capital: ${backtest_result.get('final_capital'):.2f}")
        print(f"Win Rate: {backtest_result.get('win_rate') * 100:.2f}%")
        print(f"Profit Factor: {backtest_result.get('profit_factor'):.2f}")
        print(f"Max Drawdown: {backtest_result.get('max_drawdown_percent'):.2f}%")
        print("\nOptimized Parameters:")
        for param, value in optimized_strategy.get("parameters", {}).items():
            print(f"  {param}: {value}")
        
        return optimized_strategy, backtest_result
    else:
        print(f"Optimization failed: {optimization_result.get('error')}")
        return None, None


def example_generate_report(strategy: Dict[str, Any], backtest_result: Dict[str, Any]):
    """
    Example of generating a strategy report
    
    Args:
        strategy (Dict): Trading strategy
        backtest_result (Dict): Backtest results
    """
    print("\n=== Generating a Strategy Report ===\n")
    
    # Generate the report
    report = generate_strategy_report(strategy, backtest_result)
    
    if report.get("success"):
        print(f"Strategy: {report.get('strategy_name')}")
        print(f"Description: {report.get('strategy_description')}")
        print(f"Created: {report.get('created_at')}")
        
        print("\nPerformance:")
        performance = report.get("performance", {})
        print(f"  Rating: {performance.get('rating')}")
        print(f"  Profit: {performance.get('profit_percent'):.2f}%")
        print(f"  Win Rate: {performance.get('win_rate'):.2f}%")
        print(f"  Profit Factor: {performance.get('profit_factor'):.2f}")
        print(f"  Max Drawdown: {performance.get('max_drawdown_percent'):.2f}%")
        print(f"  Total Trades: {performance.get('total_trades')}")
        print(f"  Avg Profit/Trade: {performance.get('avg_profit_per_trade'):.2f}%")
        
        print("\nSummary:")
        summary = report.get("summary", {})
        print("  Entry Rules:")
        for rule in summary.get("entry_rules", []):
            print(f"    - {rule}")
        
        print("  Exit Rules:")
        for rule in summary.get("exit_rules", []):
            print(f"    - {rule}")
        
        print("\nRecommendations:")
        for recommendation in report.get("recommendations", []):
            print(f"  - {recommendation}")
    else:
        print(f"Report generation failed: {report.get('error')}")


def main():
    """
    Main function to run the examples
    """
    print("=== Trading Strategies Module Example ===")
    
    # Create a strategy
    strategy = example_create_strategy()
    
    # Backtest the strategy
    backtest_result = example_backtest_strategy(strategy)
    
    # Optimize the strategy
    optimized_strategy, optimized_backtest = example_optimize_strategy(strategy)
    
    # Generate a report for the optimized strategy
    if optimized_strategy and optimized_backtest:
        example_generate_report(optimized_strategy, optimized_backtest)
    else:
        # Generate a report for the original strategy
        example_generate_report(strategy, backtest_result)


if __name__ == "__main__":
    main()