# BFCL Safety Management System

## Overview
The BFCL Safety Management System is a comprehensive web-based and Android-first mobile application designed to enhance safety management practices within organizations. This system incorporates various core functional modules to streamline incident reporting, audits, risk assessments, training, permits, equipment management, notifications, user management, and reporting.

## Project Structure
The project is organized into several key directories:

- **apps**: Contains the web and mobile applications.
  - **web**: The web application built with React.
  - **mobile**: The mobile application designed for Android devices.
  
- **services**: Contains the API service that handles backend operations.
  
- **packages**: Contains shared utilities, constants, and types used across the project.
  
- **infra**: Contains infrastructure-related files for Docker, Kubernetes, and Helm.
  
- **scripts**: Contains scripts for setting up the development environment.

## Core Functional Modules
The application includes the following modules:

- **Incidents**: Handles incident reporting and management.
- **Audits**: Manages audit processes and checklists.
- **Risk Assessment**: Manages hazard identification and risk assessments.
- **Training**: Manages training sessions and certifications.
- **Permits**: Manages permits and compliance documentation.
- **Equipment**: Tracks equipment and PPE management.
- **Notifications**: Manages user notifications and alerts.
- **Users**: Handles user management and roles.
- **Reports**: Generates various reports for compliance and audits.

## Getting Started
To set up the project locally, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd bfcl-safety-management-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server for the web application:
   ```
   cd apps/web
   npm start
   ```

4. For the mobile application, navigate to the mobile directory and run:
   ```
   cd apps/mobile
   npm start
   ```

5. For the API service, navigate to the API directory and run:
   ```
   cd services/api
   npm start
   ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.