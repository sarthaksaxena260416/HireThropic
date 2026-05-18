import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const sessionAPI = {
  create: (data) => api.post('/sessions', data),
  getAll: (params) => api.get('/sessions', { params }),
  getOne: (id) => api.get(`/sessions/${id}`),
  complete: (id, data) => api.patch(`/sessions/${id}/complete`, data),
};

export const topicAPI = {
  getAll: () => api.get('/topics'),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export const streamChat = async ({ sessionId, userMessage, token, onChunk, onDone, onError }) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, userMessage }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Stream failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.text) onChunk(data.text);
            if (data.done) onDone(data);
          } catch (e) {
            console.error('Parse error', e);
          }
        }
      }
    }
  } catch (err) {
    onError(err.message);
  }
};

export const evaluateSession = (sessionId) =>
  api.post('/ai/evaluate', { sessionId });