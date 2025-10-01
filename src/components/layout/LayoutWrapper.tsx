'use client';

import React, { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const AccessibilityControls = dynamic(
  () => import('@/components/accessibility/AccessibilityControls').then(mod => ({ default: mod.AccessibilityControls })),
  { 
    ssr: false,
    loading: () => null
  }
);

import SimpleHeader from './SimpleHeader';

const Footer = dynamic(() => import('./Footer'), {
  loading: () => <div className="h-32 bg-gray-900"></div>
});

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  let session = null;
  let status = 'unauthenticated';
  
  try {
    const sessionData = useSession();
    session = sessionData.data;
    status = sessionData.status;
  } catch (error) {
    console.warn('Session error (development mode):', error);
  }
  
  const pathname = usePathname();
  
  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.role as 'admin' | 'editor' | 'viewer' | undefined;
  
  // Hide header and footer on CMS pages (they have their own layout)
  const isCMSPage = pathname?.startsWith('/cms');
  const isAdminPage = pathname?.startsWith('/search-admin');

  return (
    <AccessibilityProvider>
      <div className="min-h-screen flex flex-col">
        <SkipLink />
        
        {!isCMSPage && !isAdminPage && (
          <SimpleHeader 
            isAuthenticated={isAuthenticated} 
            userRole={userRole} 
          />
        )}
        
        <main id="main-content" className="flex-1" role="main">
          {children}
        </main>
        
        {!isCMSPage && !isAdminPage && (
          <Suspense fallback={<div className="h-32 bg-gray-900"></div>}>
            <Footer />
          </Suspense>
        )}
        
        <Suspense fallback={null}>
          <AccessibilityControls />
        </Suspense>
      </div>
    </AccessibilityProvider>
  );
}