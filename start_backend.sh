#!/bin/zsh
set -e

BACKEND_DIR="/Users/ramasish/Desktop/Hackathon/Solution Challenge 2026/Smart Class System/backend"
VENV_DIR="$BACKEND_DIR/venv"

cd "$BACKEND_DIR" || exit 1

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "🔧 Creating virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install dependencies
echo "📦 Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# Start the server
echo "🚀 Starting Smart Classroom backend on http://127.0.0.1:8000"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app
