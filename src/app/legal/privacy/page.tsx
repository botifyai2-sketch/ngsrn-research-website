import React from 'react';
import { Metadata } from 'next';
import CopyrightNotice from '@/components/legal/CopyrightNotice';

export const metadata: Metadata = {
  title: 'Privacy Policy | NGSRN',
  description: 'Privacy policy for the NextGen Sustainable Research Network website, detailing how we collect, use, and protect your personal information.',
  robots: 'index, follow'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Privacy Policy
          </h1>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-400 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              <strong>Last Updated:</strong> January 2025
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              NextGen Sustainable Research Network (NGSRN) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you visit our website and use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              2. Information We Collect
            </h2>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
              2.1 Information You Provide
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may collect information you voluntarily provide, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Contact information (name, email address, phone number)</li>
              <li>Organization or institutional affiliation</li>
              <li>Research interests and professional background</li>
              <li>Permission requests and correspondence</li>
              <li>Feedback and survey responses</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
              2.2 Automatically Collected Information
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We automatically collect certain information when you visit our website:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>IP address and location information</li>
              <li>Browser type and version</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on site</li>
              <li>Referral sources and search terms</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Providing and improving our website and services</li>
              <li>Responding to your inquiries and permission requests</li>
              <li>Sending relevant research updates and newsletters (with consent)</li>
              <li>Analyzing website usage and performance</li>
              <li>Ensuring website security and preventing fraud</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal requirements or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>With trusted service providers who assist in website operations</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your browsing experience:
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
              5.1 Types of Cookies
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for website functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand website usage</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Used for targeted content (with consent)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
              5.2 Managing Cookies
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You can control cookies through your browser settings. Note that disabling 
              certain cookies may affect website functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              6. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication measures</li>
              <li>Secure hosting and backup procedures</li>
              <li>Staff training on data protection practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Access:</strong> Request information about data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              8. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We retain your information only as long as necessary for the purposes outlined 
              in this policy or as required by law. Retention periods vary based on:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>The nature of the information</li>
              <li>Legal and regulatory requirements</li>
              <li>Business and operational needs</li>
              <li>Your preferences and consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              9. International Data Transfers
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than 
              your own. We ensure appropriate safeguards are in place to protect your 
              information during such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              10. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our website is not intended for children under 13 years of age. We do not 
              knowingly collect personal information from children under 13. If we become 
              aware of such collection, we will take steps to delete the information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may update this Privacy Policy periodically. We will notify you of 
              significant changes by posting the updated policy on our website and 
              updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have questions about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Privacy Officer:</strong>{' '}
                <a 
                  href="mailto:privacy@ngsrn.org" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  privacy@ngsrn.org
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>General Contact:</strong>{' '}
                <a 
                  href="mailto:info@ngsrn.org" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  info@ngsrn.org
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Address:</strong> NextGen Sustainable Research Network<br />
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