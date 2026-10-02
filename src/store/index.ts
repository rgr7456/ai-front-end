// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import sideBarSlice from './slices/sideBarSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    sidebar: sideBarSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;