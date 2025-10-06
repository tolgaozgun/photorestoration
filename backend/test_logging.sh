#!/bin/bash
# Quick script to test if logging is working properly

echo "Testing logging setup..."
echo ""
echo "1. Checking if backend container is running..."
docker-compose ps backend

echo ""
echo "2. Showing last 20 log entries..."
docker-compose logs --tail=20 backend

echo ""
echo "3. Following live logs (press Ctrl+C to stop)..."
echo "   Upload an image through your app to see the logs in real-time"
echo ""
docker-compose logs -f backend
