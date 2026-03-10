'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Toaster } from 'sonner';

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeApplier>
    </QueryClientProvider>
  );
}
