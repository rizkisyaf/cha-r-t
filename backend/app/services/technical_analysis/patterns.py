"""
Pattern Recognition Module

This module provides functions for identifying technical chart patterns
used in financial analysis and trading strategies.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from scipy.signal import argrelextrema
import math

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

def find_peaks_and_troughs(df: pd.DataFrame, order: int = 5) -> Tuple[np.ndarray, np.ndarray]:
    """
    Find peaks and troughs in price data
    
    Args:
        df (pd.DataFrame): DataFrame with OHLCV data
        order (int): How many points on each side to use for the comparison
        
    Returns:
        Tuple[np.ndarray, np.ndarray]: Arrays of peak and trough indices
    """
    # Find peaks (local maxima)
    peaks = argrelextrema(df['high'].values, np.greater, order=order)[0]
    
    # Find troughs (local minima)
    troughs = argrelextrema(df['low'].values, np.less, order=order)[0]
    
    return peaks, troughs

def identify_head_and_shoulders(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Identify Head and Shoulders pattern
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        Dict: Dictionary with pattern information
    """
    df = convert_to_dataframe(data)
    
    # Find peaks and troughs
    peaks, troughs = find_peaks_and_troughs(df)
    
    # Need at least 3 peaks and 2 troughs for a head and shoulders pattern
    if len(peaks) < 3 or len(troughs) < 2:
        return {
            'pattern': 'head_and_shoulders',
            'found': False,
            'probability': 0.0,
            'message': 'Insufficient peaks and troughs'
        }
    
    # Check for head and shoulders pattern
    patterns = []
    for i in range(len(peaks) - 2):
        # Get three consecutive peaks
        p1, p2, p3 = peaks[i], peaks[i+1], peaks[i+2]
        
        # Check if middle peak (head) is higher than the other two (shoulders)
        if df['high'].iloc[p2] > df['high'].iloc[p1] and df['high'].iloc[p2] > df['high'].iloc[p3]:
            # Check if shoulders are at similar heights (within 10%)
            shoulder_diff = abs(df['high'].iloc[p1] - df['high'].iloc[p3]) / df['high'].iloc[p1]
            if shoulder_diff < 0.1:
                # Calculate pattern strength/probability
                head_height = df['high'].iloc[p2] - min(df['low'].iloc[p1:p3])
                pattern_length = p3 - p1
                
                # Higher head and longer pattern = stronger signal
                probability = min(0.9, (head_height / df['high'].iloc[p2]) * (pattern_length / len(df)) * 5)
                
                patterns.append({
                    'start_idx': p1,
                    'head_idx': p2,
                    'end_idx': p3,
                    'probability': probability,
                    'start_time': df.index[p1],
                    'head_time': df.index[p2],
                    'end_time': df.index[p3]
                })
    
    if patterns:
        # Sort by probability and return the strongest pattern
        patterns.sort(key=lambda x: x['probability'], reverse=True)
        best_pattern = patterns[0]
        
        return {
            'pattern': 'head_and_shoulders',
            'found': True,
            'probability': best_pattern['probability'],
            'start_time': best_pattern['start_time'],
            'head_time': best_pattern['head_time'],
            'end_time': best_pattern['end_time'],
            'message': f"Head and Shoulders pattern found with {best_pattern['probability']:.2f} probability"
        }
    
    return {
        'pattern': 'head_and_shoulders',
        'found': False,
        'probability': 0.0,
        'message': 'No Head and Shoulders pattern found'
    }

def identify_double_top(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Identify Double Top pattern
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        Dict: Dictionary with pattern information
    """
    df = convert_to_dataframe(data)
    
    # Find peaks and troughs
    peaks, troughs = find_peaks_and_troughs(df)
    
    # Need at least 2 peaks and 1 trough for a double top
    if len(peaks) < 2 or len(troughs) < 1:
        return {
            'pattern': 'double_top',
            'found': False,
            'probability': 0.0,
            'message': 'Insufficient peaks and troughs'
        }
    
    # Check for double top pattern
    patterns = []
    for i in range(len(peaks) - 1):
        # Get two consecutive peaks
        p1, p2 = peaks[i], peaks[i+1]
        
        # Check if peaks are at similar heights (within 3%)
        peak_diff = abs(df['high'].iloc[p1] - df['high'].iloc[p2]) / df['high'].iloc[p1]
        if peak_diff < 0.03:
            # Find trough between peaks
            troughs_between = [t for t in troughs if p1 < t < p2]
            if troughs_between:
                trough_idx = troughs_between[0]
                
                # Calculate pattern strength/probability
                height = df['high'].iloc[p1] - df['low'].iloc[trough_idx]
                pattern_length = p2 - p1
                
                # Higher peaks and longer pattern = stronger signal
                probability = min(0.9, (height / df['high'].iloc[p1]) * (pattern_length / len(df)) * 5)
                
                patterns.append({
                    'start_idx': p1,
                    'trough_idx': trough_idx,
                    'end_idx': p2,
                    'probability': probability,
                    'start_time': df.index[p1],
                    'trough_time': df.index[trough_idx],
                    'end_time': df.index[p2]
                })
    
    if patterns:
        # Sort by probability and return the strongest pattern
        patterns.sort(key=lambda x: x['probability'], reverse=True)
        best_pattern = patterns[0]
        
        return {
            'pattern': 'double_top',
            'found': True,
            'probability': best_pattern['probability'],
            'start_time': best_pattern['start_time'],
            'trough_time': best_pattern['trough_time'],
            'end_time': best_pattern['end_time'],
            'message': f"Double Top pattern found with {best_pattern['probability']:.2f} probability"
        }
    
    return {
        'pattern': 'double_top',
        'found': False,
        'probability': 0.0,
        'message': 'No Double Top pattern found'
    }

def identify_double_bottom(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Identify Double Bottom pattern
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        Dict: Dictionary with pattern information
    """
    df = convert_to_dataframe(data)
    
    # Find peaks and troughs
    peaks, troughs = find_peaks_and_troughs(df)
    
    # Need at least 1 peak and 2 troughs for a double bottom
    if len(peaks) < 1 or len(troughs) < 2:
        return {
            'pattern': 'double_bottom',
            'found': False,
            'probability': 0.0,
            'message': 'Insufficient peaks and troughs'
        }
    
    # Check for double bottom pattern
    patterns = []
    for i in range(len(troughs) - 1):
        # Get two consecutive troughs
        t1, t2 = troughs[i], troughs[i+1]
        
        # Check if troughs are at similar heights (within 3%)
        trough_diff = abs(df['low'].iloc[t1] - df['low'].iloc[t2]) / df['low'].iloc[t1]
        if trough_diff < 0.03:
            # Find peak between troughs
            peaks_between = [p for p in peaks if t1 < p < t2]
            if peaks_between:
                peak_idx = peaks_between[0]
                
                # Calculate pattern strength/probability
                height = df['high'].iloc[peak_idx] - df['low'].iloc[t1]
                pattern_length = t2 - t1
                
                # Lower troughs and longer pattern = stronger signal
                probability = min(0.9, (height / df['low'].iloc[t1]) * (pattern_length / len(df)) * 5)
                
                patterns.append({
                    'start_idx': t1,
                    'peak_idx': peak_idx,
                    'end_idx': t2,
                    'probability': probability,
                    'start_time': df.index[t1],
                    'peak_time': df.index[peak_idx],
                    'end_time': df.index[t2]
                })
    
    if patterns:
        # Sort by probability and return the strongest pattern
        patterns.sort(key=lambda x: x['probability'], reverse=True)
        best_pattern = patterns[0]
        
        return {
            'pattern': 'double_bottom',
            'found': True,
            'probability': best_pattern['probability'],
            'start_time': best_pattern['start_time'],
            'peak_time': best_pattern['peak_time'],
            'end_time': best_pattern['end_time'],
            'message': f"Double Bottom pattern found with {best_pattern['probability']:.2f} probability"
        }
    
    return {
        'pattern': 'double_bottom',
        'found': False,
        'probability': 0.0,
        'message': 'No Double Bottom pattern found'
    }

def identify_triangle(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Identify Triangle patterns (Ascending, Descending, Symmetric)
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        Dict: Dictionary with pattern information
    """
    df = convert_to_dataframe(data)
    
    # Find peaks and troughs
    peaks, troughs = find_peaks_and_troughs(df)
    
    # Need at least 2 peaks and 2 troughs for a triangle
    if len(peaks) < 2 or len(troughs) < 2:
        return {
            'pattern': 'triangle',
            'found': False,
            'probability': 0.0,
            'message': 'Insufficient peaks and troughs'
        }
    
    # Get the last few peaks and troughs
    last_peaks = peaks[-3:] if len(peaks) >= 3 else peaks
    last_troughs = troughs[-3:] if len(troughs) >= 3 else troughs
    
    # Calculate slopes
    if len(last_peaks) >= 2:
        peak_slope = (df['high'].iloc[last_peaks[-1]] - df['high'].iloc[last_peaks[0]]) / (last_peaks[-1] - last_peaks[0])
    else:
        peak_slope = 0
        
    if len(last_troughs) >= 2:
        trough_slope = (df['low'].iloc[last_troughs[-1]] - df['low'].iloc[last_troughs[0]]) / (last_troughs[-1] - last_troughs[0])
    else:
        trough_slope = 0
    
    # Determine triangle type
    triangle_type = None
    probability = 0.0
    
    if peak_slope < -0.01 and trough_slope > 0.01:
        # Converging lines with descending peaks and ascending troughs = Symmetric Triangle
        triangle_type = 'symmetric_triangle'
        # Calculate probability based on convergence and number of touches
        convergence = abs(peak_slope) + abs(trough_slope)
        touches = min(len(last_peaks), len(last_troughs))
        probability = min(0.9, convergence * touches * 0.2)
    elif peak_slope < -0.01 and abs(trough_slope) < 0.01:
        # Descending peaks and flat troughs = Descending Triangle
        triangle_type = 'descending_triangle'
        # Calculate probability based on peak slope and number of touches
        convergence = abs(peak_slope)
        touches = min(len(last_peaks), len(last_troughs))
        probability = min(0.9, convergence * touches * 0.2)
    elif abs(peak_slope) < 0.01 and trough_slope > 0.01:
        # Flat peaks and ascending troughs = Ascending Triangle
        triangle_type = 'ascending_triangle'
        # Calculate probability based on trough slope and number of touches
        convergence = abs(trough_slope)
        touches = min(len(last_peaks), len(last_troughs))
        probability = min(0.9, convergence * touches * 0.2)
    
    if triangle_type:
        # Get start and end times
        all_points = np.sort(np.concatenate([last_peaks, last_troughs]))
        start_idx = all_points[0]
        end_idx = all_points[-1]
        
        return {
            'pattern': triangle_type,
            'found': True,
            'probability': probability,
            'start_time': df.index[start_idx],
            'end_time': df.index[end_idx],
            'message': f"{triangle_type.replace('_', ' ').title()} pattern found with {probability:.2f} probability"
        }
    
    return {
        'pattern': 'triangle',
        'found': False,
        'probability': 0.0,
        'message': 'No Triangle pattern found'
    }

def identify_patterns(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Identify multiple chart patterns in the data
    
    Args:
        data (List[Dict]): List of OHLCV dictionaries
        
    Returns:
        List[Dict]: List of identified patterns with their information
    """
    patterns = []
    
    # Check for Head and Shoulders pattern
    hs_pattern = identify_head_and_shoulders(data)
    if hs_pattern['found']:
        patterns.append(hs_pattern)
    
    # Check for Double Top pattern
    dt_pattern = identify_double_top(data)
    if dt_pattern['found']:
        patterns.append(dt_pattern)
    
    # Check for Double Bottom pattern
    db_pattern = identify_double_bottom(data)
    if db_pattern['found']:
        patterns.append(db_pattern)
    
    # Check for Triangle patterns
    triangle_pattern = identify_triangle(data)
    if triangle_pattern['found']:
        patterns.append(triangle_pattern)
    
    # Sort patterns by probability
    patterns.sort(key=lambda x: x['probability'], reverse=True)
    
    return patterns 