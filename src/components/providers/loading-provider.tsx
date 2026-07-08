'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { LoadingOverlay } from '@/components/layout/loading-overlay';

interface LoadingContextValue {
  manualLoading: boolean;
  setManualLoading: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

function LoadingOverlayBridge() {
  const context = useContext(LoadingContext);
  const queryBusy = useIsFetching() + useIsMutating() > 0;
  const visible = Boolean(context?.manualLoading) || queryBusy;
  return <LoadingOverlay visible={visible} />;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [manualLoading, setManualLoading] = useState(false);
  const value = useMemo(() => ({ manualLoading, setManualLoading }), [manualLoading]);

  return (
    <LoadingContext.Provider value={value}>
      <LoadingOverlayBridge />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used inside LoadingProvider');
  }
  return context;
}
