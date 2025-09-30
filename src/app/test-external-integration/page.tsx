import React from 'react';
import { Metadata } from 'next/types';
import SocialShare from '@/components/social/SocialShare';
import ContactForm from '@/components/contact/ContactForm';
import ExternalLink from '@/components/ui/ExternalLink';

export const metadata: Metadata = {
  title: 'Test External Integration Features | NGSRN',
  description: 'Testing page for external integration features including social sharing, contact forms, and external links.',
};

export default function TestExternalIntegrationPage() {
  const handleContactSubmit = async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    organization?: string;
  }) => {
    // eslint-disable-next-line no-console
    console.log('Contact form submitted:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            External Integration Features Test
          </h1>

          {/* Social Share Component Test */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Social Media Sharing
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Test Article Sharing</h3>
              <SocialShare
                url="/articles/test-article"
                title="Test Research Article: Sustainable Development in Africa"
                description="This is a test article about sustainable development practices and their impact on African communities."
              />
            </div>
          </section>

          {/* External Links Test */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              External Link Handling
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">LinkedIn Links</h3>
                <div className="space-y-2">
                  <ExternalLink 
                    href="https://www.linkedin.com/company/ngsrn"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    NGSRN Company Page
                  </ExternalLink>
                  <br />
                  <ExternalLink 
                    href="https://www.linkedin.com/in/example-profile"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Example Leadership Profile
                  </ExternalLink>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Email Links</h3>
                <div className="space-y-2">
                  <ExternalLink 
                    href="mailto:info@ngsrn.org"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    General Inquiries
                  </ExternalLink>
                  <br />
                  <ExternalLink 
                    href="mailto:research@ngsrn.org?subject=Research Collaboration"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Research Collaboration
                  </ExternalLink>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Internal Links</h3>
                <div className="space-y-2">
                  <ExternalLink 
                    href="/leadership"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Leadership Team (Internal)
                  </ExternalLink>
                  <br />
                  <ExternalLink 
                    href="/contact"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Contact Page (Internal)
                  </ExternalLink>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">External Website Links</h3>
                <div className="space-y-2">
                  <ExternalLink 
                    href="https://sdgs.un.org/goals"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    UN Sustainable Development Goals
                  </ExternalLink>
                  <br />
                  <ExternalLink 
                    href="https://www.worldbank.org"
                    className="text-blue-600 hover:text-blue-800"
                    showIcon={false}
                  >
                    World Bank (No Icon)
                  </ExternalLink>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Test */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Form
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ContactForm onSubmit={handleContactSubmit} />
            </div>
          </section>

          {/* LinkedIn Integration Test */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              LinkedIn Profile Integration
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    JD
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Dr. Jane Doe</h3>
                    <p className="text-gray-600">Senior Research Fellow</p>
                    <div className="mt-2 flex space-x-3">
                      <ExternalLink 
                        href="mailto:jane.doe@ngsrn.org"
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        showIcon={false}
                      >
                        Contact
                      </ExternalLink>
                      <ExternalLink 
                        href="https://www.linkedin.com/in/jane-doe-example"
                        className="inline-flex items-center px-3 py-1 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800"
                      >
                        LinkedIn Profile
                      </ExternalLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation Links Test */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Navigation Integration
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                The contact page has been added to the main navigation. You can access it from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Main navigation menu (desktop and mobile)</li>
                <li>Footer quick links section</li>
                <li>Direct URL: <code className="bg-gray-200 px-2 py-1 rounded">/contact</code></li>
              </ul>
            </div>
          </section>

          {/* Requirements Verification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Requirements Verification
            </h2>
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                Task 18 Implementation Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ LinkedIn profile integration for leadership team</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ Social media sharing components</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ Contact form for general inquiries</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ External link handling with proper target attributes</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}