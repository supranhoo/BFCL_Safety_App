// ==================== UTILITY FUNCTIONS ====================

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format date to readable string
 */
export const formatDateReadable = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate age in days from a date
 */
export const calculateAgeDays = (date: Date | string): number => {
  return daysBetween(date, new Date());
};

/**
 * Check if date is within N days from now
 */
export const isWithinDays = (date: Date | string, days: number): boolean => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
};

/**
 * Check if date is overdue
 */
export const isOverdue = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

/**
 * Calculate risk score from likelihood and consequence
 */
export const calculateRiskScore = (likelihood: number, consequence: number): number => {
  return likelihood * consequence;
};

/**
 * Get risk level from risk score
 */
export const getRiskLevel = (score: number): string => {
  if (score >= 21) return 'EXTREME';
  if (score >= 13) return 'HIGH';
  if (score >= 6) return 'MEDIUM';
  return 'LOW';
};

/**
 * Generate random ID (for temporary use)
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

/**
 * Get initials from full name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Calculate LTIFR (Lost Time Injury Frequency Rate)
 * Formula: (Number of LTI * 1,000,000) / Total hours worked
 */
export const calculateLTIFR = (lostTimeInjuries: number, totalHours: number): number => {
  if (totalHours === 0) return 0;
  return (lostTimeInjuries * 1000000) / totalHours;
};

/**
 * Calculate TRIR (Total Recordable Incident Rate)
 * Formula: (Number of recordable incidents * 200,000) / Total hours worked
 */
export const calculateTRIR = (recordableIncidents: number, totalHours: number): number => {
  if (totalHours === 0) return 0;
  return (recordableIncidents * 200000) / totalHours;
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    DRAFT: 'gray',
    SUBMITTED: 'blue',
    UNDER_REVIEW: 'yellow',
    UNDER_INVESTIGATION: 'orange',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    CLOSED: 'green',
    APPROVED: 'green',
    PENDING: 'yellow',
    OVERDUE: 'red',
    CANCELLED: 'gray',
    VERIFIED: 'green',
  };
  return statusColors[status] || 'gray';
};

/**
 * Get severity color for UI
 */
export const getSeverityColor = (severity: string): string => {
  const severityColors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
    EXTREME: 'red',
  };
  return severityColors[severity] || 'gray';
};

/**
 * Sort array by date property
 */
export const sortByDate = <T extends Record<string, any>>(
  array: T[],
  dateKey: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey]).getTime();
    const dateB = new Date(b[dateKey]).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Group array by key
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
