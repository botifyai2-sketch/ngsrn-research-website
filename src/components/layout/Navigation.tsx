'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { PAGE_ROUTES, RESEARCH_DIVISIONS } from '@/lib/constants';
import { HeaderProps, NavigationItem } from '@/types';
import { focusVisible, keyboardNavigation, ariaLabels } from '@/lib/accessibility';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

type NavigationProps = Pick<HeaderProps, 'isAuthenticated' | 'userRole'>;

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResearchDropdownOpen, setIsResearchDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      href: PAGE_ROUTES.home,
    },
    {
      label: 'Research',
      href: PAGE_ROUTES.research,
      children: RESEARCH_DIVISIONS.map(division => ({
        label: division.name,
        href: `${PAGE_ROUTES.research}/${division.id}`,
      })),
    },
    {
      label: 'Leadership',
      href: PAGE_ROUTES.leadership,
    },
    {
      label: 'Articles',
      href: PAGE_ROUTES.articles,
    },
    {
      label: 'Search',
      href: PAGE_ROUTES.search,
    },
    {
      label: 'About',
      href: '/about',
      children: [
        {
          label: 'Our Mission',
          href: '/#mission',
        },
        {
          label: 'Privacy Policy',
          href: '/legal/privacy',
        },
        {
          label: 'Terms of Service',
          href: '/legal/terms',
        },
        {
          label: 'Usage Guidelines',
          href: '/legal/usage-guidelines',
        },
      ],
    },
    {
      label: 'Contact',
      href: PAGE_ROUTES.contact,
    },
  ];

  // Add admin link for authenticated users with appropriate roles
  if (isAuthenticated && (userRole === 'admin' || userRole === 'editor')) {
    navigationItems.push({
      label: 'Admin',
      href: PAGE_ROUTES.admin,
      requiresAuth: true,
    });
  }

  const isActiveLink = (href: string) => {
    if (href === PAGE_ROUTES.home) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Handle keyboard navigation for dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === keyboardNavigation.ESCAPE) {
      setIsResearchDropdownOpen(false);
    }
  };

  // Handle keyboard navigation for mobile menu
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === keyboardNavigation.ESCAPE) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="flex items-center space-x-8" role="navigation" aria-label={ariaLabels.navigation}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navigationItems.map((item) => (
          <div key={item.href} className="relative">
            {item.children ? (
              // Dropdown menu for Research
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={() => setIsResearchDropdownOpen(true)}
                onMouseLeave={() => setIsResearchDropdownOpen(false)}
                onKeyDown={handleDropdownKeyDown}
              >
                <button
                  onClick={() => setIsResearchDropdownOpen(!isResearchDropdownOpen)}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-blue-900 flex items-center space-x-1 ${focusVisible} ${
                    isActiveLink(item.href)
                      ? 'text-blue-900 border-b-2 border-blue-900'
                      : 'text-gray-700'
                  }`}
                  aria-expanded={isResearchDropdownOpen}
                  aria-haspopup="true"
                  aria-label={`${item.label} menu`}
                >
                  <span>{item.label}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isResearchDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isResearchDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                    role="menu"
                    aria-label={`${item.label} submenu`}
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 transition-colors duration-200 ${focusVisible}`}
                        role="menuitem"
                        onClick={() => setIsResearchDropdownOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Regular navigation link
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-blue-900 rounded-md px-2 py-1 ${focusVisible} ${
                  isActiveLink(item.href)
                    ? 'text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-700'
                }`}
                aria-current={isActiveLink(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] ${focusVisible}`}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
        >
          <ScreenReaderOnly>
            {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
          </ScreenReaderOnly>
          {/* Hamburger icon */}
          <svg
            className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {/* Close icon */}
          <svg
            className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          id="mobile-menu"
          className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-40"
          onKeyDown={handleMobileMenuKeyDown}
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 min-h-[44px] flex items-center ${focusVisible} ${
                    isActiveLink(item.href)
                      ? 'text-blue-900 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  role="menuitem"
                  aria-current={isActiveLink(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
                
                {/* Mobile Research Division Links */}
                {item.children && (
                  <div className="ml-4 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-blue-900 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] flex items-center ${focusVisible}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Mobile Authentication Buttons */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Welcome back!
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-900 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] ${focusVisible}`}
                    role="menuitem"
                    aria-label="Sign out of your account"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      signIn();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-900 hover:bg-blue-50 transition-colors duration-200 min-h-[44px] ${focusVisible}`}
                    role="menuitem"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      signIn();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-ngsrn-blue text-white hover:bg-ngsrn-green transition-colors duration-200 min-h-[44px] ${focusVisible}`}
                    role="menuitem"
                    aria-label="Get started with NGSRN"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;