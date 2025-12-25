import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register-tenant', data),
  getMe: () => api.get('/auth/me')
};

export const projectService = {
  getProjects: () => api.get('/projects'),
  createProject: (data) => api.post('/projects', data),
  deleteProject: (id) => api.delete(`/projects/${id}`)
};

export const taskService = {
  getTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTaskStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status })
};

export default api;