// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-chat-bot-jx9w.onrender.com',
});

export const faceRecognitionAPI = {
  getUsers: () => api.get('/users'),
  getStats: () => api.get('/stats'),
  getActivity: () => api.get('/activity'),
  recognizeFace: (image: FormData) => api.post('/face/recognize', image),
};