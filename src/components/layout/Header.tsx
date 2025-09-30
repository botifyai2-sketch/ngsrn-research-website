'use client';

import React from 'react';
import Link from 'next/link';
import { signIn, signOut } from 'next-auth/react';
import { SITE_CONFIG, PAGE_ROUTES } from '@/lib/constants';
import { HeaderProps } from '@/types';
import { focusVisible } from '@/lib/accessibility';
import Navigation from './Navigation';
import Logo from '@/components/ui/Logo';

const Header: React.FC<HeaderProps> = ({ isAuthenticated, userRole }) => {
  return (
    <header 
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Logo 
              href={PAGE_ROUTES.home} 
              size="md" 
              showText={true} 
              className={`rounded-md ${focusVisible}`}
            />
          </div>

          {/* Navigation and Auth */}
          <div className="flex items-center space-x-4">
            <Navigation isAuthenticated={isAuthenticated} userRole={userRole} />
            
            {/* Authentication Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600" aria-live="polite">
                    Welcome back!
                  </span>
                  <button
                    onClick={() => signOut()}
                    className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 min-h-[44px] ${focusVisible}`}
                    aria-label="Sign out of your account"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => signIn()}
                    className={`text-ngsrn-blue hover:text-ngsrn-green text-sm font-medium transition-colors duration-200 min-h-[44px] px-2 rounded-md ${focusVisible}`}
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => signIn()}
                    className={`bg-ngsrn-blue hover:bg-ngsrn-green text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 min-h-[44px] ${focusVisible}`}
                    aria-label="Get started with NGSRN"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;