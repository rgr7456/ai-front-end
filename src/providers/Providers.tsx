// src/providers/Providers.tsx
'use client';
import { Provider } from 'react-redux';
import { Theme } from '@radix-ui/themes';
import { store } from '../store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Theme>
        {children}
      </Theme>
    </Provider>
  );
}