#!/bin/bash

echo "🧹 Cleaning up ports and processes..."

# Kill any existing Next.js development servers
echo "Stopping existing Next.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Kill processes on common ports
echo "Freeing up ports 3000-3005..."
for port in 3000 3001 3002 3003 3004 3005; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid on port $port"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Wait a moment for processes to clean up
echo "Waiting for cleanup..."
sleep 3

# Clean npm cache and temporary files
echo "Cleaning temporary files..."
cd "/Users/rauladell/Work/Projects/OCR Kolmai/dashboard"
rm -f server.log nohup.out 2>/dev/null || true

# Verify port 3000 is free
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Port 3000 is still occupied, trying to force kill..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the development server on port 3000
echo "🚀 Starting Next.js development server on port 3000..."
npm run dev -- --port 3000

echo "✅ Server should be running at http://localhost:3000"