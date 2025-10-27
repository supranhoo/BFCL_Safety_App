# BFCL Safety Management System - Quick Start Guide

## Purpose
This guide provides quick instructions to get started with the BFCL Safety Management System development.

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- pnpm (Package Manager)
- MongoDB
- Docker & Docker Compose (optional)
- Git

## Quick Installation

### 1. Clone the Repository
```bash
git clone https://github.com/supranhoo/BFCL_Safety_App.git
cd BFCL_Safety_App
```

### 2. Choose Your Workspace
The project has two identical workspaces. Choose one:
```bash
# Option A: Use the first workspace
cd bfcl-safety-management-system

# Option B: Use the second workspace
cd bfcl-safety-management-system-1
```

### 3. Install Dependencies
```bash
# If using pnpm workspace (recommended)
pnpm install

# If using npm
npm install
```

### 4. Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 5. Start Development Servers

#### Backend API Service
```bash
cd services/api
pnpm start
# API will run on http://localhost:3000
```

#### Frontend Web Application
```bash
# Open a new terminal
cd apps/web
pnpm start
# Web app will run on http://localhost:3001
```

#### Mobile Application (Android)
```bash
# Open a new terminal
cd apps/mobile
pnpm android
# Follow React Native setup instructions
```

## Project Structure

```
BFCL_Safety_App/
├── README.md
├── STEP_BY_STEP_PROGRAM.md          # Comprehensive development program
├── QUICK_START_GUIDE.md             # This file
├── bfcl-safety-management-system/   # Main project directory
│   ├── apps/                        # Applications
│   │   ├── web/                     # React web app
│   │   └── mobile/                  # React Native mobile app
│   ├── services/                    # Backend services
│   │   └── api/                     # Express API
│   ├── packages/                    # Shared packages
│   │   └── shared/                  # Shared utilities
│   ├── infra/                       # Infrastructure configs
│   │   ├── docker/                  # Docker files
│   │   ├── k8s/                     # Kubernetes configs
│   │   └── helm/                    # Helm charts
│   └── scripts/                     # Utility scripts
└── bfcl-safety-management-system-1/ # Backup workspace
```

## Available Scripts

### Root Level
```bash
# Install all dependencies
pnpm install

# Build all projects
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### API Service
```bash
cd services/api

# Start development server
pnpm start

# Build TypeScript
pnpm build

# Run tests
pnpm test
```

### Web Application
```bash
cd apps/web

# Start development server
pnpm start

# Build for production
pnpm build

# Run tests
pnpm test
```

### Mobile Application
```bash
cd apps/mobile

# Start Metro bundler
pnpm start

# Run on Android
pnpm android

# Run on iOS (if configured)
pnpm ios
```

## Docker Quick Start

### Using Docker Compose
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Common Tasks

### Adding a New Module

1. **Backend**: Add route in `services/api/src/routes/`
2. **Model**: Create model in `services/api/src/models/`
3. **Frontend**: Add page in `apps/web/src/pages/`
4. **Redux**: Add slice in `apps/web/src/store/slices/`

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test <filename>

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Database Operations
```bash
# Connect to MongoDB
mongo

# Use database
use bfcl_safety

# View collections
show collections

# Query data
db.incidents.find()
```

## Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. **Push changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Fill in description and submit

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
pnpm install
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### React Native Build Issues
```bash
# Clear cache
cd apps/mobile
pnpm start --reset-cache

# Clean Android build
cd android
./gradlew clean
cd ..
pnpm android
```

## Useful Commands

### Git Commands
```bash
# Check status
git status

# View changes
git diff

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### pnpm Commands
```bash
# Add dependency
pnpm add <package-name>

# Add dev dependency
pnpm add -D <package-name>

# Remove dependency
pnpm remove <package-name>

# Update dependencies
pnpm update
```

## Next Steps

1. Review the [STEP_BY_STEP_PROGRAM.md](./STEP_BY_STEP_PROGRAM.md) for detailed development phases
2. Check existing code in `apps/web/src/app.tsx` and `services/api/src/index.ts`
3. Follow the development phases outlined in the main program document
4. Join team communication channels
5. Review and understand the codebase

## Resources

- [React Documentation](https://reactjs.org/)
- [React Native Documentation](https://reactnative.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Docker Documentation](https://docs.docker.com/)

## Support

For questions or issues:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Happy Coding! 🚀**
