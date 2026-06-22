"use client"; // This directive tells Next.js to treat this component as a Client Component

import { FC, PropsWithChildren, useEffect } from 'react'

import { QueryClientProvider } from 'react-query';
import queryClient from '@/lib/queryClient';
import { registerRetryAfterInterceptor } from '@/lib/axiosRetryAfter';

export const ReactQueryProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  // Register the global Retry-After interceptor once, client-side only.
  useEffect(() => {
    registerRetryAfterInterceptor();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
