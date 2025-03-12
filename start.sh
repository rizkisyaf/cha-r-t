#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Start the backend
echo -e "${GREEN}Starting backend...${NC}"
cd backend
if [ -d "venv" ]; then
  source venv/bin/activate
  python app.py &
else
  echo -e "${YELLOW}Virtual environment not found. Run ./setup.sh first or create it manually.${NC}"
  python app.py &
fi
BACKEND_PID=$!

# Start the frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd ../frontend
npm start &
FRONTEND_PID=$!

# Function to handle exit
function cleanup {
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

echo -e "${GREEN}cha(r)t is running!${NC}"
echo -e "Backend: http://localhost:5001"
echo -e "Frontend: http://localhost:3000"
echo -e "Press Ctrl+C to stop both servers."

# Wait for processes to finish
wait 