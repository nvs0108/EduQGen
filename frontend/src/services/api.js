import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication services
export const authService = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await axios.post(`${API_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },
  
  register: async (userData) => {
    return await axios.post(`${API_URL}/users/`, userData);
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    return await api.get('/users/me');
  },
};

// Subject services
export const subjectService = {
  getSubjects: async (skip = 0, limit = 100) => {
    return await api.get(`/subjects/?skip=${skip}&limit=${limit}`);
  },
  
  createSubject: async (subjectData) => {
    return await api.post('/subjects/', subjectData);
  },
};

// Topic services
export const topicService = {
  getTopics: async (subjectId = null, skip = 0, limit = 100) => {
    let url = `/topics/?skip=${skip}&limit=${limit}`;
    if (subjectId) {
      url += `&subject_id=${subjectId}`;
    }
    return await api.get(url);
  },
  
  createTopic: async (topicData) => {
    return await api.post('/topics/', topicData);
  },
};

// Question services
export const questionService = {
  getQuestions: async (filters = {}, skip = 0, limit = 100) => {
    let url = `/questions/?skip=${skip}&limit=${limit}`;
    
    if (filters.subjectId) url += `&subject_id=${filters.subjectId}`;
    if (filters.topicId) url += `&topic_id=${filters.topicId}`;
    if (filters.bloomLevel) url += `&bloom_level=${filters.bloomLevel}`;
    if (filters.difficulty) url += `&difficulty=${filters.difficulty}`;
    if (filters.verifiedOnly) url += `&verified_only=${filters.verifiedOnly}`;
    
    return await api.get(url);
  },
  
  createQuestion: async (questionData) => {
    return await api.post('/questions/', questionData);
  },
  
  generateQuestions: async (genRequest) => {
    return await api.post('/questions/generate', genRequest);
  },

  generateQuestionsFromPdf: async (formData) => {
    return await axios.post(`${API_URL}/questions/generate-from-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  },
};

// Question Set services
export const questionSetService = {
  getQuestionSets: async (skip = 0, limit = 100) => {
    return await api.get(`/question-sets/?skip=${skip}&limit=${limit}`);
  },
  
  createQuestionSet: async (questionSetData) => {
    return await api.post('/question-sets/', questionSetData);
  },

  getQuestionSetWithQuestions: async (id) => {
    return await api.get(`/question-sets/${id}`);
  },
  
  exportQuestionSetPDF: async (id) => {
    return await api.get(`/question-sets/${id}/export-pdf`, {
      responseType: 'blob'
    });
  },
};

export default api;