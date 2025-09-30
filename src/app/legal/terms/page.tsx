import React from 'react';
import { Metadata } from 'next';
import CopyrightNotice from '@/components/legal/CopyrightNotice';

export const metadata: Metadata = {
  title: 'Terms of Use | NGSRN',
  description: 'Terms of use and conditions for the NextGen Sustainable Research Network website and content.',
  robots: 'index, follow'
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Terms of Use
          </h1>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-400 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              <strong>Last Updated:</strong> January 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and using the NextGen Sustainable Research Network (NGSRN) website, 
              you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              2. Intellectual Property Rights
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              All content on this website, including but not limited to research articles, 
              reports, images, graphics, logos, and text, is the intellectual property of 
              NGSRN and is protected by copyright laws.
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Content may be viewed and downloaded for personal, educational, and non-commercial use only</li>
              <li>Any reproduction, distribution, or commercial use requires written permission</li>
              <li>Proper attribution must be provided when citing or referencing our content</li>
              <li>Modification of content without consent is prohibited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              3. Permitted Uses
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may use our content for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Educational purposes in academic institutions</li>
              <li>Policy research and analysis</li>
              <li>Non-commercial research activities</li>
              <li>Citation in academic papers with proper attribution</li>
              <li>Personal reference and study</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              4. Prohibited Uses
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The following uses are strictly prohibited:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Commercial use without written permission</li>
              <li>Redistribution or republication without authorization</li>
              <li>Modification of content without consent</li>
              <li>Use in ways that misrepresent NGSRN&apos;s positions or findings</li>
              <li>Any illegal or unauthorized use</li>
              <li>Systematic downloading or data mining</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              5. User Conduct
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Users of this website agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Use the website in accordance with all applicable laws and regulations</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to gain unauthorized access to any part of the website</li>
              <li>Not interfere with the website&apos;s operation or security</li>
              <li>Provide accurate information when submitting forms or requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              6. Privacy and Data Protection
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your privacy is important to us. Please review our{' '}
              <a 
                href="/legal/privacy" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Privacy Policy
              </a>{' '}
              to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The information on this website is provided on an &quot;as is&quot; basis. NGSRN makes no 
              representations or warranties of any kind, express or implied, about the completeness, 
              accuracy, reliability, suitability, or availability of the website or the information 
              contained on the website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In no event shall NGSRN be liable for any direct, indirect, incidental, special, 
              or consequential damages arising out of or in connection with your use of this website 
              or the information contained herein.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              9. External Links
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our website may contain links to external sites. NGSRN is not responsible for 
              the content or privacy practices of these external sites. Links to external 
              sites do not constitute an endorsement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              NGSRN reserves the right to modify these terms at any time. Changes will be 
              effective immediately upon posting on this website. Your continued use of the 
              website after changes are posted constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have questions about these Terms of Use, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong>{' '}
                <a 
                  href="mailto:legal@ngsrn.org" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  legal@ngsrn.org
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Address:</strong> NextGen Sustainable Research Network
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Research and Policy Institute, Africa
              </p>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
            <CopyrightNotice variant="article" />
          </div>
        </div>
      </div>
    </div>
  );
}