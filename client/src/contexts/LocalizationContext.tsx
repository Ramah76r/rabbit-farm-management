import React, { createContext, useContext, ReactNode, useState } from 'react';

interface LocalizationContextType {
  locale: string;
  setLocale: (locale: string) => void;
  direction: 'rtl' | 'ltr';
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>('ar');
  
  // Always RTL for Arabic
  const direction: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  
  // Update document direction
  React.useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [direction, locale]);

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, direction }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}
