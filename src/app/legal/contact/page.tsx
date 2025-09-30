import React from 'react';
import { Metadata } from 'next';
import CopyrightNotice from '@/components/legal/CopyrightNotice';
import PermissionContact from '@/components/legal/PermissionContact';

export const metadata: Metadata = {
  title: 'Legal Contact | NGSRN',
  description: 'Contact NGSRN for legal inquiries, permission requests, and copyright questions.',
  robots: 'index, follow'
};

export default function LegalContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Legal Contact
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
            Get in touch with our legal team for permission requests, copyright questions, 
            and other legal inquiries.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Types */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                How Can We Help?
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Permission Requests
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Need permission to use our content commercially or redistribute our research?
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📧 permissions@ngsrn.org
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Copyright Questions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Questions about copyright, fair use, or intellectual property?
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📧 legal@ngsrn.org
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Privacy Concerns
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Questions about data privacy, cookies, or personal information?
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📧 privacy@ngsrn.org
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      General Legal
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Other legal questions or concerns not covered above?
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      📧 legal@ngsrn.org
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Response Times
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Permission Requests
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    2-3 business days
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Copyright Questions
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    1-2 business days
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Privacy Concerns
                  </span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    24-48 hours
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    General Legal
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    3-5 business days
                  </span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Note:</strong> Complex requests may require additional review time. 
                  We&apos;ll acknowledge receipt within 24 hours and provide an estimated timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Before You Contact Us
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                <li>• Check our <a href="/legal/usage-guidelines" className="underline">Usage Guidelines</a></li>
                <li>• Review our <a href="/legal/terms" className="underline">Terms of Use</a></li>
                <li>• Read our <a href="/legal/privacy" className="underline">Privacy Policy</a></li>
                <li>• Prepare specific details about your request</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Office Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Address</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    NextGen Sustainable Research Network<br />
                    Research and Policy Institute<br />
                    Africa
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Phone</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    +1 (234) 567-8900
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Business Hours</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Monday - Friday<br />
                    9:00 AM - 5:00 PM (GMT)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Urgent Matters
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm mb-3">
                For urgent legal matters requiring immediate attention, please call our office directly.
              </p>
              <p className="text-green-700 dark:text-green-300 font-medium text-sm">
                📞 +1 (234) 567-8900
              </p>
            </div>
          </div>
        </div>

        {/* Permission Request Form */}
        <PermissionContact variant="card" showForm={false} />

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
          <CopyrightNotice variant="article" />
        </div>
      </div>
    </div>
  );
}