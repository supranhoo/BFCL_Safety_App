# Phase 3 - Frontend Development

## Overview

Phase 3 implements the frontend React application for the BFCL Safety Management System. The web application provides a modern, responsive interface for managing safety operations, incidents, investigations, and compliance tracking.

## Status: ✅ In Progress

- **Started:** October 27, 2025
- **Current Phase:** Frontend Setup Complete
- **Next:** Implement Full Module Interfaces

## Technology Stack

### Core Framework
- **React 18.3.1** - UI library
- **TypeScript 5.3.3** - Type safety
- **Vite 5.0.12** - Build tool and dev server

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.315.0** - Icon library
- **clsx & tailwind-merge** - Conditional styling utilities

### State Management & Data Fetching
- **Zustand 4.5.0** - Lightweight state management
- **TanStack Query 5.20.0** - Server state management and caching
- **Axios 1.6.5** - HTTP client with interceptors

### Forms & Validation
- **React Hook Form 7.50.0** - Form handling
- **Zod 3.22.4** - Schema validation
- **@hookform/resolvers** - Integration between RHF and Zod

### Routing
- **React Router DOM 6.22.0** - Client-side routing

### Utilities
- **date-fns 3.3.0** - Date formatting and manipulation
- **recharts 2.10.0** - Charts and data visualization (planned)

## Project Structure

```
apps/web/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── auth/       # Authentication components
│   │   ├── layout/     # Layout components
│   │   ├── ui/         # Base UI components
│   │   ├── dashboard/  # Dashboard-specific components
│   │   ├── incidents/  # Incident module components
│   │   ├── investigations/  # Investigation components
│   │   └── capa/       # CAPA tracking components
│   ├── pages/          # Page components
│   │   ├── auth/       # Login, Register
│   │   ├── dashboard/  # Dashboard page
│   │   ├── incidents/  # Incident pages
│   │   ├── investigations/  # Investigation pages
│   │   └── capa/       # CAPA pages
│   ├── services/       # API service layer
│   ├── hooks/          # Custom React hooks
│   ├── lib/           # Utilities and configurations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper functions
├── .env.example       # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Implemented Features

### 1. ✅ Authentication System
- **Login Page** - Email/password authentication with form validation
- **JWT Token Management** - Automatic token refresh and storage
- **Protected Routes** - Route guards for authenticated pages
- **Auth State** - Zustand store for user session management

### 2. ✅ Layout & Navigation
- **Main Layout** - Responsive sidebar with mobile support
- **Sidebar Navigation** - Links to all major modules
- **Header** - Notifications bell, user profile
- **User Profile** - Display user info and logout

### 3. ✅ Dashboard (Basic)
- **KPI Cards** - Display total incidents, CAPAs, hazards, investigations
- **Statistics** - Breakdown by type, severity, status
- **Welcome Message** - Onboarding information
- **Real-time Data** - Integration with backend API

### 4. ✅ Base UI Components
- **Button** - Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input** - Form input with label and error support
- **Card** - Flexible card component with header, title, content, footer

### 5. ✅ Placeholder Pages
- Incidents
- Investigations
- CAPA Tracking
- Hazards

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Development

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation
```bash
cd apps/web
pnpm install
```

### Development Server
```bash
pnpm dev
```
Opens at http://localhost:3001

### Build
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

### Lint
```bash
pnpm lint
```

## API Integration

### Axios Configuration
- Base URL from environment variable
- JWT token attached to all requests
- Automatic token refresh on 401 errors
- Error handling with interceptors

### React Query Setup
- 5-minute stale time
- Window focus refetch disabled
- Retry once on failure
- Automatic background refetching

## Routing Structure

```
/login              → Login page (public)
/                   → Redirect to /dashboard
/dashboard          → Dashboard (protected)
/incidents          → Incident management (protected)
/investigations     → Investigation tracking (protected)
/capa              → CAPA tracking (protected)
/hazards           → Hazard management (protected)
```

## Design System

### Color Palette
- **Primary:** Blue-600 (#2563eb)
- **Danger:** Red-600 (#dc2626)
- **Warning:** Yellow-500 (#f59e0b)
- **Success:** Green-600 (#16a34a)

### Typography
- System font stack
- Tailwind default size scale

### Spacing
- Tailwind spacing scale (0.25rem increments)

## Component Patterns

### Button Component
```tsx
<Button variant="default" size="default">
  Click me
</Button>

<Button variant="destructive" size="sm">
  Delete
</Button>

<Button variant="outline">
  Cancel
</Button>
```

### Input Component
```tsx
<Input 
  label="Email" 
  type="email"
  error={errors.email?.message}
  {...register('email')}
/>
```

### Card Component
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Type Safety

All API responses are typed using TypeScript interfaces:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role?: Role;
}

interface Incident {
  id: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  // ... more fields
}
```

## State Management

### Auth State (Zustand)
```typescript
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### Server State (React Query)
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },
});
```

## Testing (Planned)

- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Test component interactions
- **E2E Tests:** Playwright for full user flows

## Performance Optimizations

- Code splitting with React.lazy
- Image optimization
- Tree shaking with Vite
- Minification in production build
- Gzip compression (15.7 KB CSS, 362 KB JS → 113 KB gzipped)

## Accessibility

- Semantic HTML
- ARIA labels (planned)
- Keyboard navigation support
- Screen reader friendly (planned)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Limitations

1. **Dashboard** - Currently shows placeholder data; needs full API integration
2. **Modules** - Incidents, Investigations, CAPA, Hazards are placeholder pages
3. **Notifications** - Bell icon present but not functional yet
4. **Mobile** - Responsive but needs thorough testing
5. **Charts** - Recharts installed but not yet implemented

## Next Development Phase

### Priority: HIGH
1. **Incident Management Interface**
   - Incident list with filters
   - Create incident form with validation
   - Incident detail view
   - Status transitions

2. **Investigation Module**
   - Investigation list
   - RCA form with 5-Whys
   - Co-investigator assignment
   - Approval workflow

3. **CAPA Tracking**
   - Kanban board view
   - CAPA details
   - Aging indicators
   - Verification workflow

### Priority: MEDIUM
4. **Hazard Management**
   - Risk matrix visualization
   - Hazard registration form
   - Control measures

5. **Notifications**
   - Real-time notifications
   - Notification dropdown
   - Mark as read functionality

6. **User Management**
   - User list
   - Role management
   - Profile settings

## Security Considerations

- HTTPS only in production
- XSS protection via React's built-in escaping
- CSRF protection (to be implemented)
- Secure token storage (localStorage with httpOnly consideration)
- Input validation on all forms

## Deployment

### Production Build
```bash
pnpm build
```

### Deployment Targets
- Static hosting (Vercel, Netlify)
- Docker container
- Kubernetes

### Environment Variables (Production)
```env
VITE_API_URL=https://api.bfcl.com/api/v1
```

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR

## Support

For issues and questions:
- Create an issue on GitHub
- Email: safety-support@bfcl.com

---

**Built with ❤️ for Safety Excellence**
