import axios from 'axios';
import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store for authentication callbacks
let authModalCallbacks: Array<() => void> = [];

export const triggerAuthModal = (callback?: () => void) => {
  if (callback) {
    authModalCallbacks.push(callback);
  }
  // Dispatch a custom event that components can listen to
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-required'));
  }
};

export const onAuthSuccess = () => {
  authModalCallbacks.forEach(cb => cb());
  authModalCallbacks = [];
};

// Add auth interceptor
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const walletAddress = localStorage.getItem('walletAddress');
    const signature = localStorage.getItem('signature');
    const message = localStorage.getItem('message');
    const timestamp = localStorage.getItem('timestamp');

    if (walletAddress && signature && message && timestamp) {
      config.headers['X-Wallet-Address'] = walletAddress;
      config.headers['X-Signature'] = signature;
      // Base64 encode the message to handle newlines and special characters
      config.headers['X-Message'] = btoa(encodeURIComponent(message));
      config.headers['X-Timestamp'] = timestamp;
    }

    return config;
  });

  // Add response interceptor to handle auth errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear invalid auth data
        AuthService.clearAuth();

        // Trigger re-authentication
        console.error('Authentication expired. Please reconnect your wallet.');
        triggerAuthModal();
      }
      return Promise.reject(error);
    }
  );
}

export const api = {
  tasks: {
    list: async (params?: any) => {
      const response = await apiClient.get('/tasks/list', { params });
      return response.data;
    },
    getById: async (taskId: string) => {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await apiClient.post('/tasks/create', data);
      return response.data;
    },
  },
  submissions: {
    submit: async (data: any) => {
      const response = await apiClient.post('/submissions/submit', data);
      return response.data;
    },
    getStatus: async (submissionId: string) => {
      const response = await apiClient.get(`/submissions/${submissionId}/status`);
      return response.data;
    },
    mySubmissions: async () => {
      const response = await apiClient.get('/submissions/my/submissions');
      return response.data;
    },
  },
  users: {
    register: async (data: any) => {
      const response = await apiClient.post('/users/register', data);
      return response.data;
    },
    getProfile: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data;
    },
  },
};
