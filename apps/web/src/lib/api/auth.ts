import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      level: number;
    };
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  employeeId?: string;
  roleId: string;
  departmentId?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    // Backend returns the auth payload directly: { user, accessToken, refreshToken }
    return response.data as LoginResponse;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/register', data);
    // Backend returns the auth payload directly: { user, accessToken, refreshToken }
    return response.data as LoginResponse;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};
