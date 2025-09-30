import React from 'react';
import { Metadata } from 'next';
import CopyrightNotice from '@/components/legal/CopyrightNotice';
import UsageGuidelines from '@/components/legal/UsageGuidelines';
import PermissionContact from '@/components/legal/PermissionContact';

export const metadata: Metadata = {
  title: 'Usage Guidelines | NGSRN',
  description: 'Guidelines for using NGSRN research content, including permitted uses, restrictions, and how to request permissions.',
  robots: 'index, follow'
};

export default function UsageGuidelinesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Usage Guidelines
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
            Learn how you can use NGSRN research content for educational, policy, and research purposes.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <UsageGuidelines variant="full" showContactInfo={false} />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                How to Cite NGSRN Content
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When citing NGSRN research in your work, please use the following format:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Academic Papers (APA Style)
                  </h3>
                  <code className="text-sm text-gray-700 dark:text-gray-300 block">
                    Author, A. A. (Year). Title of article. NextGen Sustainable Research Network. 
                    Retrieved from https://ngsrn.org/articles/article-slug
                  </code>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Policy Documents
                  </h3>
                  <code className="text-sm text-gray-700 dark:text-gray-300 block">
                    NextGen Sustainable Research Network. (Year). &quot;Title of Research.&quot; 
                    NGSRN Policy Brief Series. Available at: https://ngsrn.org/articles/article-slug
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Can I use NGSRN content in my thesis or dissertation?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, you may cite and reference NGSRN content in academic work with proper attribution. 
                    For extensive quotations or reproduction of figures/tables, please request permission.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Can I translate NGSRN articles into other languages?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Translation requires written permission. Please contact us with details about 
                    the intended translation and distribution plans.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Can I share NGSRN articles on social media?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, you may share links to NGSRN articles on social media. Please use the 
                    original article URL rather than copying and pasting the full text.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    How long does it take to get permission for commercial use?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We typically respond to permission requests within 2-3 business days. 
                    Complex requests may require additional review time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Quick Reference
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                <li>✓ Educational use allowed</li>
                <li>✓ Academic citation permitted</li>
                <li>✓ Policy research encouraged</li>
                <li>✗ Commercial use requires permission</li>
                <li>✗ Redistribution needs authorization</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Related Pages
              </h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="/legal/terms" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a 
                    href="/legal/privacy" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/legal/contact" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Contact Legal Team
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Need Help?
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm mb-3">
                Have questions about using our content? Our team is here to help.
              </p>
              <a 
                href="/legal/contact" 
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <PermissionContact variant="card" />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
          <CopyrightNotice variant="article" />
        </div>
      </div>
    </div>
  );
}