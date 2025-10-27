// ==================== CONSTANTS ====================

export const ROLES = {
  SAFETY_HEAD: 'Safety Head',
  ASM: 'Assistant Safety Manager',
  SENIOR_SAFETY_OFFICER: 'Senior Safety Officer',
  SAFETY_OFFICER: 'Safety Officer',
  ASSISTANT_SAFETY_OFFICER: 'Assistant Safety Officer',
  WORKER: 'Worker',
  CONTRACTOR: 'Contractor',
} as const;

export const ROLE_LEVELS = {
  'Safety Head': 5,
  'Assistant Safety Manager': 4,
  'Senior Safety Officer': 3,
  'Safety Officer': 2,
  'Assistant Safety Officer': 1,
  'Worker': 0,
  'Contractor': 0,
} as const;

export const PERMISSIONS = {
  // Incidents
  CREATE_INCIDENT: 'create:incident',
  READ_INCIDENT: 'read:incident',
  UPDATE_INCIDENT: 'update:incident',
  DELETE_INCIDENT: 'delete:incident',
  APPROVE_INCIDENT: 'approve:incident',
  
  // Investigations
  CREATE_INVESTIGATION: 'create:investigation',
  READ_INVESTIGATION: 'read:investigation',
  UPDATE_INVESTIGATION: 'update:investigation',
  APPROVE_INVESTIGATION: 'approve:investigation',
  
  // Hazards
  CREATE_HAZARD: 'create:hazard',
  READ_HAZARD: 'read:hazard',
  UPDATE_HAZARD: 'update:hazard',
  CLOSE_HAZARD: 'close:hazard',
  
  // CAPA
  CREATE_CAPA: 'create:capa',
  READ_CAPA: 'read:capa',
  UPDATE_CAPA: 'update:capa',
  VERIFY_CAPA: 'verify:capa',
  
  // Audits
  CREATE_AUDIT: 'create:audit',
  READ_AUDIT: 'read:audit',
  UPDATE_AUDIT: 'update:audit',
  APPROVE_AUDIT: 'approve:audit',
  
  // Training
  CREATE_TRAINING: 'create:training',
  READ_TRAINING: 'read:training',
  UPDATE_TRAINING: 'update:training',
  RECORD_ATTENDANCE: 'record:attendance',
  
  // PPE
  CREATE_PPE: 'create:ppe',
  READ_PPE: 'read:ppe',
  ISSUE_PPE: 'issue:ppe',
  MANAGE_STOCK: 'manage:stock',
  
  // Users
  CREATE_USER: 'create:user',
  READ_USER: 'read:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  ASSIGN_ROLE: 'assign:role',
  
  // Reports
  VIEW_REPORTS: 'view:reports',
  GENERATE_OSHA_LOG: 'generate:osha_log',
  VIEW_DASHBOARD: 'view:dashboard',
} as const;

export const INCIDENT_STATUS_FLOW = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'UNDER_INVESTIGATION'],
  UNDER_REVIEW: ['UNDER_INVESTIGATION', 'CLOSED'],
  UNDER_INVESTIGATION: ['CLOSED'],
  CLOSED: [],
} as const;

export const INVESTIGATION_SEVERITY_ROUTING = {
  LOW: ['Safety Officer'],
  MEDIUM: ['Safety Officer', 'Senior Safety Officer'],
  HIGH: ['Senior Safety Officer', 'ASM', 'Department Head'],
  CRITICAL: ['ASM', 'Safety Head', 'BU Head'],
} as const;

export const KPI_TARGETS = {
  LTIFR: 0.5, // Target: Less than 0.5
  TRIR: 2.0, // Target: Less than 2.0
  TRAINING_COMPLETION: 95, // Target: 95%
  CAPA_CLOSURE_RATE: 90, // Target: 90% within due date
  AUDIT_COMPLIANCE: 85, // Target: 85%+
} as const;

export const RISK_MATRIX = {
  // Likelihood (1-5) x Consequence (1-5) = Risk Score
  LOW: { min: 1, max: 5 },
  MEDIUM: { min: 6, max: 12 },
  HIGH: { min: 13, max: 20 },
  EXTREME: { min: 21, max: 25 },
} as const;

export const NOTIFICATION_TEMPLATES = {
  INCIDENT_ASSIGNED: {
    title: 'New Incident Assigned',
    message: 'You have been assigned to incident {incidentNumber}',
  },
  INVESTIGATION_REQUIRED: {
    title: 'Investigation Required',
    message: 'Incident {incidentNumber} requires investigation',
  },
  CAPA_ASSIGNED: {
    title: 'Corrective Action Assigned',
    message: 'You have been assigned CAPA {capaNumber}',
  },
  CAPA_OVERDUE: {
    title: 'CAPA Overdue',
    message: 'CAPA {capaNumber} is overdue. Please complete it.',
  },
  TRAINING_SCHEDULED: {
    title: 'Training Scheduled',
    message: 'You are enrolled in training: {trainingTitle}',
  },
  CERTIFICATION_EXPIRING: {
    title: 'Certification Expiring Soon',
    message: 'Your certification for {certTitle} expires in {days} days',
  },
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  INCIDENTS: '/api/v1/incidents',
  INVESTIGATIONS: '/api/v1/investigations',
  HAZARDS: '/api/v1/hazards',
  AUDITS: '/api/v1/audits',
  TRAINING: '/api/v1/training',
  PPE: '/api/v1/ppe',
  MOCK_DRILLS: '/api/v1/mock-drills',
  REPORTS: '/api/v1/reports',
  USERS: '/api/v1/users',
  NOTIFICATIONS: '/api/v1/notifications',
} as const;
