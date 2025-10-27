#!/bin/bash

# This script sets up the development environment for the BFCL Safety Management System.

# Update package lists
echo "Updating package lists..."
sudo apt update

# Install necessary packages
echo "Installing necessary packages..."
sudo apt install -y nodejs npm docker.io

# Install pnpm globally
echo "Installing pnpm..."
npm install -g pnpm

# Install project dependencies
echo "Installing project dependencies..."
pnpm install

# Start Docker service
echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Print completion message
echo "Development environment setup complete."