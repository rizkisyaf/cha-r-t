#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up cha(r)t application...${NC}"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    echo -e "${GREEN}✓ Python is installed${NC}"
else
    echo -e "${RED}✗ Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check if Node.js is installed
if command -v node &>/dev/null; then
    echo -e "${GREEN}✓ Node.js is installed${NC}"
else
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js.${NC}"
    exit 1
fi

# Check if npm is installed
if command -v npm &>/dev/null; then
    echo -e "${GREEN}✓ npm is installed${NC}"
else
    echo -e "${RED}✗ npm is not installed. Please install npm.${NC}"
    exit 1
fi

# Set up backend
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend || { echo -e "${RED}Backend directory not found${NC}"; exit 1; }

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit the .env file and add your API keys.${NC}"
fi

# Set up frontend
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd ../frontend || { echo -e "${RED}Frontend directory not found${NC}"; exit 1; }

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Return to root directory
cd ..

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "To start the application, run: ${YELLOW}./start.sh${NC}"
echo -e "Or start the backend and frontend separately:"
echo -e "  Backend: ${YELLOW}cd backend && source venv/bin/activate && python app.py${NC}"
echo -e "  Frontend: ${YELLOW}cd frontend && npm start${NC}" 