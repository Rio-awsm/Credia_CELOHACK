import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
if (typeof window !== 'undefined') {
  apiClient.interceptors.request.use((config) => {
    const walletAddress = localStorage.getItem('walletAddress');
    const signature = localStorage.getItem('signature');
    const message = localStorage.getItem('message');
    const timestamp = localStorage.getItem('timestamp');

    if (walletAddress && signature) {
      config.headers['X-Wallet-Address'] = walletAddress;
      config.headers['X-Signature'] = signature;
      config.headers['X-Message'] = message;
      config.headers['X-Timestamp'] = timestamp;
    }

    return config;
  });
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
