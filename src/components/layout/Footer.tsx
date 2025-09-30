'use client';

import React from 'react';
import Link from 'next/link';
import { SITE_CONFIG, PAGE_ROUTES, RESEARCH_DIVISIONS } from '@/lib/constants';
import CopyrightNotice from '@/components/legal/CopyrightNotice';
import Logo from '@/components/ui/Logo';

const Footer: React.FC = () => {

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand and Mission */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo 
                size="md" 
                showText={true} 
                textColor="text-white"
              />
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              {SITE_CONFIG.description}
            </p>
            <div className="flex space-x-4">
              <a
                href={SITE_CONFIG.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
                aria-label="Follow NGSRN on LinkedIn (opens in new tab)"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Research Divisions */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Research Divisions</h4>
            <nav aria-label="Research divisions">
              <ul className="space-y-2">
                {RESEARCH_DIVISIONS.map((division) => (
                  <li key={division.id}>
                    <Link
                      href={`${PAGE_ROUTES.research}/${division.id}`}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    >
                      {division.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <nav aria-label="Quick links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href={PAGE_ROUTES.leadership}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Leadership Team
                  </Link>
                </li>
                <li>
                  <Link
                    href={PAGE_ROUTES.articles}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    All Articles
                  </Link>
                </li>
                <li>
                  <Link
                    href={PAGE_ROUTES.search}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Search
                  </Link>
                </li>
                <li>
                  <Link
                    href={PAGE_ROUTES.contact}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/legal/usage-guidelines"
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Usage Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/terms"
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/contact"
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  >
                    Legal Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright Notice */}
            <div className="text-sm text-gray-300 mb-4 md:mb-0">
              <CopyrightNotice variant="footer" className="text-gray-300" />
              <p className="mt-1">
                Content is for educational and policy purposes. 
                <Link
                  href="/legal/contact"
                  className="text-blue-400 hover:text-blue-300 ml-1"
                >
                  Contact us for reproduction permissions.
                </Link>
              </p>
            </div>

            {/* Additional Links */}
            <nav aria-label="Legal links">
              <div className="flex space-x-6 text-sm">
                <Link
                  href="/legal/privacy"
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/legal/terms"
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                >
                  Terms of Use
                </Link>
                <Link
                  href="/legal/usage-guidelines"
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                >
                  Usage Guidelines
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;