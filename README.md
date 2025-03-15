# cha(r)t - A Modern Financial Charting Application

cha(r)t is a modern financial charting application that provides real-time and historical financial data visualization for stocks, cryptocurrencies, and other financial instruments.

## Features

- Real-time and historical financial data visualization
- Multiple timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M)
- Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
- Customizable chart layout
- AI-powered market analysis

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.7+ (for backend)
- pip (for Python packages)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chart.git
   cd chart
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

### Configuration

#### Alpha Vantage API Key

The application uses Alpha Vantage API to fetch real financial data. You need to get a free API key from Alpha Vantage:

1. Go to [Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key) and request a free API key
2. Create or edit the `.env` file in the `frontend` directory:
   ```
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

> **Note:** The free tier of Alpha Vantage API has rate limits (typically 5 API calls per minute and 500 calls per day). If you need more, consider upgrading to their premium plans.

### Running the Application

1. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

2. Start the backend (in a separate terminal):
   ```bash
   cd backend
   python app.py
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

### Chart Navigation

- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Click and drag
- **Crosshair**: Hover over the chart
- **Time Range**: Use the timeframe selector (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M)

### Adding Indicators

1. Click the settings icon in the chart pane
2. Select "Add Indicator"
3. Choose the indicator type and parameters
4. Click "Add"

## Troubleshooting

### API Rate Limits

If you see an error message about API limits, it means you've reached the rate limit of Alpha Vantage API. Solutions:

1. Wait for a minute before trying again
2. Get your own API key from Alpha Vantage (free)
3. Consider upgrading to a premium plan if you need more API calls

### No Data Available

If you see "No data available for this symbol and timeframe", it could mean:

1. The symbol doesn't exist or is incorrect
2. The timeframe is not supported for this symbol
3. Alpha Vantage doesn't have data for this symbol

Try a different symbol or timeframe.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TradingView](https://www.tradingview.com/) for inspiration
- [Lightweight Charts](https://github.com/tradingview/lightweight-charts) for the charting library
- [Alpha Vantage](https://www.alphavantage.co/) for financial data API 