#!/bin/bash

# BDD Test Runner Script
set -e

MODE=${1:-mock}
SETUP_DB=${2:-auto}

echo "🎯 Running BDD tests in $MODE mode..."

case $MODE in
  "mock")
    echo "🎭 Mock Database Mode (Fast)"
    npm run test:bdd:mock
    ;;
    
  "real")
    echo "🗄️  Real Database Mode (Integration)"
    
    if [[ "$SETUP_DB" == "auto" ]]; then
      echo "🚀 Setting up test database..."
      npm run test:bdd:setup
      
      # Wait for database to be ready
      echo "⏳ Waiting for database to be ready..."
      sleep 5
      
      # Run tests
      npm run test:bdd:real
      
      # Cleanup
      echo "🧹 Cleaning up test database..."
      npm run test:bdd:teardown
    else
      # Manual mode - assume database is already running
      npm run test:bdd:real
    fi
    ;;
    
  *)
    echo "❌ Invalid mode. Use 'mock' or 'real'"
    echo "Usage: $0 [mock|real] [auto|manual]"
    echo ""
    echo "Examples:"
    echo "  $0 mock          # Fast mock tests (default)"
    echo "  $0 real          # Integration tests with auto DB setup"
    echo "  $0 real manual   # Integration tests (DB already running)"
    exit 1
    ;;
esac

echo "✅ BDD tests completed successfully!"