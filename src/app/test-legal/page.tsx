import React from 'react';
import CopyrightNotice from '@/components/legal/CopyrightNotice';
import UsageGuidelines from '@/components/legal/UsageGuidelines';
import PermissionContact from '@/components/legal/PermissionContact';

export default function TestLegalPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Legal Components Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Testing all legal and copyright management components.
          </p>
        </div>

        {/* Copyright Notice Variants */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Copyright Notice Components
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Footer Variant
              </h3>
              <CopyrightNotice variant="footer" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Inline Variant
              </h3>
              <CopyrightNotice variant="inline" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Article Variant
              </h3>
              <CopyrightNotice variant="article" />
            </div>
          </div>
        </section>

        {/* Usage Guidelines Variants */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Usage Guidelines Components
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Inline Variant
              </h3>
              <UsageGuidelines variant="inline" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Compact Variant (Expandable)
              </h3>
              <UsageGuidelines variant="compact" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Full Variant
              </h3>
              <UsageGuidelines variant="full" />
            </div>
          </div>
        </section>

        {/* Permission Contact Variants */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Permission Contact Components
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Inline Variant
              </h3>
              <PermissionContact variant="inline" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Card Variant
              </h3>
              <PermissionContact variant="card" />
            </div>
          </div>
        </section>

        {/* Legal Pages Links */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Legal Pages
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/legal/terms"
              className="block p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Terms of Use
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Legal terms and conditions for using NGSRN content
              </p>
            </a>

            <a
              href="/legal/privacy"
              className="block p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Privacy Policy
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                How we collect, use, and protect your information
              </p>
            </a>

            <a
              href="/legal/usage-guidelines"
              className="block p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Usage Guidelines
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Guidelines for using NGSRN research content
              </p>
            </a>

            <a
              href="/legal/contact"
              className="block p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Legal Contact
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Contact our legal team for permissions and questions
              </p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}