# BFCL Safety Management System

## Overview
The BFCL Safety Management System is a comprehensive web-based and Android-first mobile application designed to enhance safety management practices within organizations. This AI-ready system incorporates various core functional modules to streamline incident reporting, audits, risk assessments, training, permits, equipment management, notifications, user management, and reporting.

## 📚 Documentation

- **[Step by Step Program](./STEP_BY_STEP_PROGRAM.md)** - Comprehensive development program with all phases
- **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get started quickly with development
- **[Development Tracker](./DEVELOPMENT_TRACKER.md)** - Track progress and tasks
- **[Execution Script](./execute-program.sh)** - Automated setup and execution

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- pnpm
- MongoDB
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/supranhoo/BFCL_Safety_App.git
cd BFCL_Safety_App

# Run the automated setup script
./execute-program.sh
```

### Manual Setup

```bash
# Navigate to the project directory
cd bfcl-safety-management-system

# Install dependencies
pnpm install

# Start the API service
cd services/api && pnpm start

# Start the web application (in a new terminal)
cd apps/web && pnpm start

# Start the mobile application (in a new terminal)
cd apps/mobile && pnpm android
```

## 🏗️ Project Structure

```
BFCL_Safety_App/
├── bfcl-safety-management-system/    # Main project directory
│   ├── apps/                         # Applications
│   │   ├── web/                      # React web application
│   │   └── mobile/                   # React Native mobile app
│   ├── services/                     # Backend services
│   │   └── api/                      # Express API service
│   ├── packages/                     # Shared packages
│   │   └── shared/                   # Shared utilities and types
│   ├── infra/                        # Infrastructure configs
│   │   ├── docker/                   # Docker configurations
│   │   ├── k8s/                      # Kubernetes manifests
│   │   └── helm/                     # Helm charts
│   └── scripts/                      # Development scripts
├── STEP_BY_STEP_PROGRAM.md          # Comprehensive development guide
├── QUICK_START_GUIDE.md             # Quick start instructions
├── DEVELOPMENT_TRACKER.md           # Task tracking and progress
└── execute-program.sh               # Automated setup script
```

## ✨ Core Features

### Functional Modules
- **Incidents** - Report and manage safety incidents
- **Audits** - Conduct and track safety audits
- **Risk Assessment** - Identify and assess workplace hazards
- **Training** - Manage safety training and certifications
- **Permits** - Handle work permits and approvals
- **Equipment** - Track equipment and PPE
- **Notifications** - Real-time alerts and notifications
- **Users** - User management with role-based access
- **Reports** - Generate compliance and analytics reports

### Technical Features
- **Web Application** - Responsive React-based web interface
- **Mobile Application** - Android-first mobile app
- **RESTful API** - Express.js backend with TypeScript
- **Real-time Updates** - WebSocket support for notifications
- **File Management** - Upload and manage attachments
- **Authentication** - JWT-based auth with SSO support
- **Role-Based Access** - Granular permission control
- **AI-Ready** - Prepared for ML/AI integration

## 🛠️ Technology Stack

- **Frontend**: React 17+, TypeScript, Redux, Material-UI
- **Backend**: Node.js, Express, TypeScript
- **Mobile**: React Native (Android)
- **Database**: MongoDB
- **Infrastructure**: Docker, Kubernetes, Helm
- **Testing**: Jest, Cypress
- **CI/CD**: GitHub Actions

## 📋 Compliance Standards

- OSHA 29 CFR 1904
- ISO 45001

## 🔒 Security

- JWT Authentication
- SSO Integration (Azure AD / LDAP)
- Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- TLS/SSL Encryption
- AES-256 Data Encryption

## 🧪 Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test <filename>
```

### Linting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### Building

```bash
# Build all projects
pnpm build

# Build specific project
cd apps/web && pnpm build
```

## 🚢 Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down
```

### Using Kubernetes

```bash
# Apply Kubernetes configurations
kubectl apply -f infra/k8s/

# Deploy with Helm
helm install bfcl-safety infra/helm/
```

## 📊 Development Phases

1. ✅ **Phase 1**: Foundation Setup (Week 1)
2. 🔄 **Phase 2**: Backend Development (Weeks 2-4)
3. ⏳ **Phase 3**: Frontend Development (Weeks 5-7)
4. ⏳ **Phase 4**: Mobile Application (Weeks 8-10)
5. ⏳ **Phase 5**: Integration & Testing (Weeks 11-12)
6. ⏳ **Phase 6**: Security Implementation (Weeks 13-14)
7. ⏳ **Phase 7**: AI Integration (Weeks 15-16)
8. ⏳ **Phase 8**: Deployment (Week 17)
9. ⏳ **Phase 9**: Maintenance & Monitoring (Ongoing)

See [STEP_BY_STEP_PROGRAM.md](./STEP_BY_STEP_PROGRAM.md) for detailed information.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 👥 Team

- **Project Manager**: TBD
- **Tech Lead**: TBD
- **Backend Developer**: TBD
- **Frontend Developer**: TBD
- **Mobile Developer**: TBD
- **DevOps Engineer**: TBD
- **QA Engineer**: TBD
- **Security Engineer**: TBD

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Contact the development team
- Review the documentation

## 🎯 Roadmap

- [x] Project initialization
- [x] Documentation creation
- [ ] Backend API development
- [ ] Frontend web application
- [ ] Mobile application
- [ ] AI/ML integration
- [ ] Production deployment

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: Active Development

For detailed instructions, see:
- [Step by Step Program](./STEP_BY_STEP_PROGRAM.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Development Tracker](./DEVELOPMENT_TRACKER.md) 
