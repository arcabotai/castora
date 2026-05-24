"use client"; // This directive tells Next.js to treat this component as a Client Component

import { FC, PropsWithChildren } from 'react'

import { QueryClientProvider } from 'react-query';
import queryClient from '@/lib/queryClient';

export const ReactQueryProvider: FC<PropsWithChildren<{}>> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
