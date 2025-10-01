'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PAGE_ROUTES, RESEARCH_DIVISIONS } from '@/lib/constants';
import { HeaderProps } from '@/types';
import { focusVisible } from '@/lib/accessibility';
import Logo from '@/components/ui/Logo';

const Header: React.FC<HeaderProps> = ({ isAuthenticated, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResearchDropdownOpen, setIsResearchDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === PAGE_ROUTES.home) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const navigationItems = [
    { label: 'Home', href: PAGE_ROUTES.home },
    { 
      label: 'Research', 
      href: PAGE_ROUTES.research,
      hasDropdown: true,
      children: RESEARCH_DIVISIONS.map(division => ({
        label: division.name,
        href: `${PAGE_ROUTES.research}/${division.id}`,
      }))
    },
    { label: 'Leadership', href: PAGE_ROUTES.leadership },
    { label: 'Articles', href: PAGE_ROUTES.articles },
    { label: 'Search', href: PAGE_ROUTES.search },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: PAGE_ROUTES.contact },
  ];

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.href} className="relative">
                {item.hasDropdown ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsResearchDropdownOpen(true)}
                    onMouseLeave={() => setIsResearchDropdownOpen(false)}
                  >
                    <Link
                      href={item.href}
                      className={`text-sm font-medium transition-colors duration-200 hover:text-blue-900 flex items-center space-x-1 px-2 py-1 rounded-md ${focusVisible} ${
                        isActiveLink(item.href)
                          ? 'text-blue-900 border-b-2 border-blue-900'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{item.label}</span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isResearchDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    
                    {/* Dropdown Menu */}
                    {isResearchDropdownOpen && item.children && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-900 transition-colors duration-200"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors duration-200 hover:text-blue-900 px-2 py-1 rounded-md ${focusVisible} ${
                      isActiveLink(item.href)
                        ? 'text-blue-900 border-b-2 border-blue-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-900 hover:bg-gray-100"
            >
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActiveLink(item.href)
                        ? 'text-blue-900 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
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
                          className="block px-3 py-2 rounded-md text-sm text-gray-600 hover:text-blue-900 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;