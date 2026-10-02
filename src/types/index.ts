// src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  faceId: string;
  createdAt: string;
  lastLogin: string;
}

export interface RecognitionLog {
  id: string;
  userId: string;
  timestamp: string;
  accuracy: number;
  status: 'success' | 'failed';
}