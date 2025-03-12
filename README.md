# cha(r)t

An AI-powered financial charting and analysis platform that allows traders to visualize and analyze financial data through natural language interaction.

![cha(r)t Interface](docs/interface.png)

## Features

- Interactive financial charts with AI-drawn patterns
- Natural language interaction for chart modifications, strategy building, and data analysis
- Backtesting trading strategies and real-time notifications based on market conditions
- AI-powered insights and pattern recognition

## Tech Stack

- **Frontend**: React, TradingView Lightweight Charts, HTML Canvas
- **Backend**: Flask (Python)
- **AI**: OpenAI GPT API
- **Financial Data**: Alpha Vantage API
- **Database**: PostgreSQL
- **Real-time Communication**: WebSockets

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- API keys for OpenAI and Alpha Vantage

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/chart.git
   cd chart
   ```

2. Set up the backend:
   ```
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

You can run both the frontend and backend together using the provided script:

```
./start.sh
```

Or run them separately:

1. Start the backend:
   ```
   cd backend
   python app.py
   ```

2. Start the frontend (in a new terminal):
   ```
   cd frontend
   npm start
   ```

The application will be available at http://localhost:3000

## Project Structure

- `/frontend`: React application for the user interface
  - `/src/components`: React components
  - `/src/services`: API and socket services
  - `/src/assets`: Static assets

- `/backend`: Flask server for API endpoints and business logic
  - `/app`: Main application package
  - `/app/services`: Services for AI and financial data

- `/docs`: Documentation and design files

## Usage

1. Open the application in your browser
2. Select a financial instrument (e.g., BTCUSD/IDRUSD)
3. Use the chat panel to interact with the AI assistant
4. Ask questions or give commands like:
   - "Add a 50-day moving average"
   - "Draw a trend line from the March low to the current price"
   - "Create a strategy to buy when RSI is below 30"
   - "What's the current market sentiment?"

## Development

### Adding New Features

1. Backend:
   - Add new routes in `backend/app/routes.py`
   - Implement services in `backend/app/services/`

2. Frontend:
   - Add new components in `frontend/src/components/`
   - Update services in `frontend/src/services/`

### Testing

- Backend: Unit tests can be added in a `/tests` directory
- Frontend: Component tests using React Testing Library

## Documentation

- [User Guide](docs/user_guide.md): Learn how to use the application
- [Developer Guide](docs/developer_guide.md): Learn how to extend and modify the application

## License

This project is licensed under the MIT License - see the LICENSE file for details. 