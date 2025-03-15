import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

const ChartExample = () => {
  const chartContainerRef = useRef(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: 600,
      height: 400,
      layout: {
        background: { type: 'solid', color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    // Add candlestick series using the new API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26A69A',
      downColor: '#EF5350',
      borderVisible: false,
      wickUpColor: '#26A69A',
      wickDownColor: '#EF5350',
    });
    
    // Add volume series using the new API
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    // Set data
    const candleData = [
      { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
      { time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
      { time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
      { time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
      { time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
      { time: '2018-12-27', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
      { time: '2018-12-28', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
      { time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
      { time: '2018-12-30', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
      { time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
    ];
    
    const volumeData = [
      { time: '2018-12-22', value: 20.31 },
      { time: '2018-12-23', value: 30.27 },
      { time: '2018-12-24', value: 70.28 },
      { time: '2018-12-25', value: 49.29 },
      { time: '2018-12-26', value: 40.64 },
      { time: '2018-12-27', value: 57.46 },
      { time: '2018-12-28', value: 50.55 },
      { time: '2018-12-29', value: 34.85 },
      { time: '2018-12-30', value: 56.68 },
      { time: '2018-12-31', value: 75.33 },
    ];
    
    candlestickSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    
    // Fit content
    chart.timeScale().fitContent();
    
    // Cleanup
    return () => {
      chart.remove();
    };
  }, []);
  
  return (
    <div>
      <h2>Lightweight Charts v5 Example</h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default ChartExample; 