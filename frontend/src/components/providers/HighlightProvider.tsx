'use client';

import { ErrorBoundary, HighlightInit } from '@highlight-run/next/client';
import { ReactNode } from 'react';

export default function HighlightProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* Initialize Highlight */}
      <HighlightInit
        projectId="ney04nvd"
        serviceName="bulwark-frontend"
        environment={process.env.NODE_ENV}
        networkRecording={{ enabled: true }}
      />

      {/* Wrap the app in Error Boundary */}
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
