#!/bin/bash

# BFCL Safety Management System - Development Setup Script
# This script automates the initial setup for development

set -e

echo "🚀 BFCL Safety Management System - Setup"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Please install Docker to use containerized setup."
else
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose is not installed."
else
    echo "✅ Docker Compose $(docker-compose -v | cut -d' ' -f4 | tr -d ',')"
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "⚙️  Setting up environment variables..."

# API env file
if [ ! -f "services/api/.env" ]; then
    if [ -f "services/api/.env.example" ]; then
        cp services/api/.env.example services/api/.env
        echo "✅ Created services/api/.env from .env.example"
        echo "⚠️  Please edit services/api/.env with your configuration"
    else
        echo "⚠️  .env.example not found in services/api"
    fi
else
    echo "✅ services/api/.env already exists"
fi

echo ""
echo "🐳 Docker setup..."
read -p "Do you want to start services with Docker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Docker containers..."
    docker-compose up -d
    echo "✅ Docker containers started"
    
    echo ""
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    
    echo ""
    echo "🗄️  Running database migrations..."
    pnpm db:migrate
    echo "✅ Database migrations completed"
    
    echo ""
    read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pnpm db:seed
        echo "✅ Database seeded"
    fi
else
    echo "⚠️  Skipping Docker setup. Make sure you have PostgreSQL running."
    echo "   Update DATABASE_URL in services/api/.env with your connection string."
    echo ""
    echo "   Then run manually:"
    echo "   pnpm db:migrate"
    echo "   pnpm db:seed (optional)"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Start development servers:"
echo "   pnpm dev           # All services"
echo "   pnpm api:dev       # API only"
echo "   pnpm web:dev       # Web app only"
echo ""
echo "2. Database management:"
echo "   pnpm db:studio     # Open Prisma Studio"
echo "   pnpm db:migrate    # Run migrations"
echo ""
echo "3. Access services:"
echo "   API:              http://localhost:3000"
echo "   API Health:       http://localhost:3000/health"
echo "   Web App:          http://localhost:3001 (when running)"
echo "   Prisma Studio:    http://localhost:5555 (when running)"
echo ""
echo "4. View logs:"
echo "   docker-compose logs -f api"
echo ""
echo "📖 For more information, see README.md"
echo ""
