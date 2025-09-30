'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { HeaderProps } from '@/types';

interface LayoutProps extends Partial<HeaderProps> {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isAuthenticated = false, 
  userRole, 
  className = '',
  showFooter = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header isAuthenticated={isAuthenticated} userRole={userRole} />
      
      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;