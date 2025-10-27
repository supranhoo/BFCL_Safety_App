#!/bin/bash

# BFCL Safety Management System - Automated Setup and Execution Script
# This script automates the setup and execution of the BFCL Safety Management System

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Banner
echo "=========================================="
echo "  BFCL Safety Management System"
echo "  Automated Setup & Execution Script"
echo "=========================================="
echo ""

# Step 1: Check Prerequisites
print_status "Step 1: Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi
print_success "Node.js is installed: $(node --version)"

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_success "npm is installed: $(npm --version)"

if ! command_exists pnpm; then
    print_warning "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
else
    print_success "pnpm is installed: $(pnpm --version)"
fi

if ! command_exists git; then
    print_error "Git is not installed. Please install Git."
    exit 1
fi
print_success "Git is installed: $(git --version)"

# Optional: Check for Docker
if command_exists docker; then
    print_success "Docker is installed: $(docker --version)"
else
    print_warning "Docker is not installed. Some features may not work."
fi

# Optional: Check for MongoDB
if command_exists mongod; then
    print_success "MongoDB is installed"
else
    print_warning "MongoDB is not installed. You'll need to install it or use Docker."
fi

echo ""
print_success "All essential prerequisites are met!"
echo ""

# Step 2: Choose Workspace
print_status "Step 2: Setting up workspace..."

WORKSPACE_DIR="bfcl-safety-management-system"
if [ -d "$WORKSPACE_DIR" ]; then
    print_success "Using workspace: $WORKSPACE_DIR"
    cd "$WORKSPACE_DIR"
else
    print_error "Workspace directory not found: $WORKSPACE_DIR"
    exit 1
fi

# Step 3: Install Dependencies
print_status "Step 3: Installing dependencies..."

if [ -f "package.json" ]; then
    print_status "Installing root dependencies..."
    pnpm install --silent
    print_success "Root dependencies installed"
else
    print_warning "No package.json found in root"
fi

# Install API dependencies
if [ -d "services/api" ]; then
    print_status "Installing API dependencies..."
    cd services/api
    if [ -f "package.json" ]; then
        pnpm install --silent
        print_success "API dependencies installed"
    fi
    cd ../..
fi

# Install Web dependencies
if [ -d "apps/web" ]; then
    print_status "Installing Web app dependencies..."
    cd apps/web
    if [ -f "package.json" ]; then
        pnpm install --silent
        print_success "Web app dependencies installed"
    fi
    cd ../..
fi

# Install Mobile dependencies
if [ -d "apps/mobile" ]; then
    print_status "Installing Mobile app dependencies..."
    cd apps/mobile
    if [ -f "package.json" ]; then
        pnpm install --silent
        print_success "Mobile app dependencies installed"
    fi
    cd ../..
fi

echo ""
print_success "All dependencies installed successfully!"
echo ""

# Step 4: Environment Configuration
print_status "Step 4: Checking environment configuration..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_status "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created. Please update it with your configuration."
    else
        print_warning "No .env or .env.example file found. You may need to create one manually."
    fi
else
    print_success ".env file already exists"
fi

echo ""

# Step 5: Display Next Steps
print_success "Setup completed successfully!"
echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo ""
echo "1. Start the API Service:"
echo "   cd services/api && pnpm start"
echo ""
echo "2. Start the Web Application (in a new terminal):"
echo "   cd apps/web && pnpm start"
echo ""
echo "3. Start the Mobile Application (in a new terminal):"
echo "   cd apps/mobile && pnpm android"
echo ""
echo "4. Using Docker (optional):"
echo "   docker-compose up"
echo ""
echo "=========================================="
echo "  Service URLs"
echo "=========================================="
echo ""
echo "  API Service:      http://localhost:3000"
echo "  Web Application:  http://localhost:3001"
echo "  MongoDB:          mongodb://localhost:27017"
echo ""
echo "=========================================="
echo "  Documentation"
echo "=========================================="
echo ""
echo "  Quick Start:      QUICK_START_GUIDE.md"
echo "  Full Program:     STEP_BY_STEP_PROGRAM.md"
echo "  README:           README.md"
echo ""
echo "=========================================="
echo ""

# Ask user if they want to start services
read -p "Would you like to start the API service now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting API service..."
    cd services/api
    if [ -f "src/index.ts" ]; then
        print_success "API service is starting..."
        pnpm start
    else
        print_error "API index file not found"
    fi
fi

print_success "Script execution completed!"
