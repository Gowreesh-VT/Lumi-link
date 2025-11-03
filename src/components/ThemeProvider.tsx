import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
};
