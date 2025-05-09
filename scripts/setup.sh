#!/bin/bash

# Job Tracker Application Setup Script

echo "==== Job Tracker Application Setup ===="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first (version 16.x or higher)."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Check if pnpm is installed, install it if not
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
    
    # Verify pnpm installation
    if ! command -v pnpm &> /dev/null; then
        echo "Error: Failed to install pnpm. Please install it manually."
        exit 1
    else
        echo "pnpm installed successfully."
    fi
fi

echo "Installing dependencies..."
pnpm install

# Check if .env.local exists, create it if not
if [ ! -f .env.local ]; then
    echo "Creating .env.local file from example..."
    cp .env.local.example .env.local
    echo ".env.local created successfully."
fi

echo ""
echo "==== Setup Complete ===="
echo ""
echo "To start the development server, run:"
echo "pnpm dev"
echo ""
echo "The application will be available at http://localhost:3000"
echo ""
echo "Happy job hunting!"

