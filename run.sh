#!/bin/zsh

echo "Starting Mini Game Picker..."

# Move to script directory (important if launched from Finder/IDE)
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start server
echo "Launching server at http://localhost:3000"
node server.js