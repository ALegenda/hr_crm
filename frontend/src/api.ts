import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Interceptor - token from localStorage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor - Adding token to request:', config.url);
    } else {
      console.warn('Interceptor - No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Interceptor - Request error:', error);
    return Promise.reject(error);
  }
);

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

// Vacancies
export const getVacancies = async () => {
  const response = await api.get('/vacancies');
  return response.data;
};

export const getVacancy = async (id: number) => {
  const response = await api.get(`/vacancies/${id}`);
  return response.data;
};

export const createVacancy = async (vacancy: {
  title: string;
  description: string;
  skills: string[];
  requirements: string;
  context: string;
}) => {
  console.log('Creating vacancy with data:', vacancy);
  console.log('Token:', localStorage.getItem('token'));
  try {
    const response = await api.post('/vacancies', vacancy);
    console.log('Vacancy created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating vacancy:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Status code:', error.response?.status);
      console.error('Headers:', error.response?.headers);
    }
    throw error;
  }
};

export const updateVacancy = async (
  id: number,
  vacancy: {
    title: string;
    description: string;
    skills: string[];
    requirements: string;
    context: string;
  }
) => {
  const response = await api.put(`/vacancies/${id}`, vacancy);
  return response.data;
};

export const deleteVacancy = async (id: number) => {
  await api.delete(`/vacancies/${id}`);
};

export const generateQuiz = async (id: number) => {
  const response = await api.post(`/vacancies/${id}/generate-quiz`);
  return response.data;
};

interface Question {
  id: number;
  text: string;
}

export const getQuestions = async (vacancyId: number): Promise<Question[]> => {
  const response = await api.get(`/vacancies/${vacancyId}/questions`);
  return response.data;
};

export const createQuestion = async (vacancyId: number, text: string): Promise<Question> => {
  const response = await api.post(`/vacancies/${vacancyId}/questions`, { text });
  return response.data;
};

export const updateQuestion = async (questionId: number, text: string): Promise<Question> => {
  const response = await api.put(`/vacancies/questions/${questionId}`, { text });
  return response.data;
};

export const deleteQuestion = async (questionId: number): Promise<void> => {
  await api.delete(`/vacancies/questions/${questionId}`);
};

// Candidates
export const getCandidates = async (vacancyId: number) => {
  const response = await api.get(`/candidates/vacancy/${vacancyId}`);
  return response.data;
};

export const getCandidate = async (vacancyId: number, candidateId: number) => {
  const response = await api.get(`/candidates/${candidateId}`);
  return response.data;
};

export const submitAnswers = async (
  vacancyId: number,
  name: string,
  email: string,
  phone: string = '',
  answers: Record<string, string>
) => {
  console.log('API submitAnswers called with:', { vacancyId, name, email, phone, answers });
  const requestData = {
    vacancyId,
    name,
    email,
    phone,
    answers
  };
  console.log('Sending to server:', requestData);
  const response = await api.post(`/candidates/submit`, requestData);
  return response.data;
};

export default api; 