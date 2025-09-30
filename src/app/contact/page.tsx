import React from 'react';
import { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';
import ExternalLink from '@/components/ui/ExternalLink';

export const metadata: Metadata = {
  title: 'Contact Us | NextGen Sustainable Research Network',
  description: 'Get in touch with NGSRN for research collaborations, media inquiries, partnerships, and general questions about our work in sustainable development.',
  keywords: ['contact', 'NGSRN', 'research collaboration', 'partnership', 'inquiry'],
  openGraph: {
    title: 'Contact Us | NextGen Sustainable Research Network',
    description: 'Get in touch with NGSRN for research collaborations, media inquiries, partnerships, and general questions about our work in sustainable development.',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We&apos;d love to hear from you. Whether you&apos;re interested in research collaboration, 
              have media inquiries, or want to learn more about our work, we&apos;re here to help.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a message
              </h2>
              <ContactForm />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Quick Contact */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Contact
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <ExternalLink 
                      href="mailto:info@ngsrn.org" 
                      className="text-blue-600 hover:text-blue-800"
                      showIcon={false}
                    >
                      info@ngsrn.org
                    </ExternalLink>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">LinkedIn</p>
                    <ExternalLink 
                      href="https://www.linkedin.com/company/ngsrn" 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      NextGen Sustainable Research Network
                    </ExternalLink>
                  </div>
                </div>
              </div>
            </div>

            {/* Research Collaboration */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Research Collaboration
              </h3>
              <p className="text-gray-600 mb-4">
                Interested in collaborating on research projects? We welcome partnerships 
                with academic institutions, policy organizations, and development practitioners.
              </p>
              <ExternalLink 
                href="mailto:research@ngsrn.org?subject=Research Collaboration Inquiry" 
                className="text-blue-600 hover:text-blue-800 font-medium"
                showIcon={false}
              >
                research@ngsrn.org
              </ExternalLink>
            </div>

            {/* Media Inquiries */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Media Inquiries
              </h3>
              <p className="text-gray-600 mb-4">
                For media requests, interviews, and press inquiries, please contact our 
                communications team.
              </p>
              <ExternalLink 
                href="mailto:media@ngsrn.org?subject=Media Inquiry" 
                className="text-blue-600 hover:text-blue-800 font-medium"
                showIcon={false}
              >
                media@ngsrn.org
              </ExternalLink>
            </div>

            {/* Leadership Team */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Leadership Team
              </h3>
              <p className="text-gray-600 mb-4">
                Connect directly with our leadership team members for specific inquiries 
                related to their research areas.
              </p>
              <ExternalLink 
                href="/leadership" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View Leadership Profiles →
              </ExternalLink>
            </div>

            {/* Office Hours */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Response Time
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>General Inquiries:</strong> 2-3 business days</p>
                <p><strong>Media Requests:</strong> 24-48 hours</p>
                <p><strong>Research Collaboration:</strong> 3-5 business days</p>
                <p><strong>Technical Support:</strong> 1-2 business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How can I access your research articles?
                </h3>
                <p className="text-gray-600 text-sm">
                  All our research articles are freely available on our website. 
                  Visit our <ExternalLink href="/articles" className="text-blue-600 hover:text-blue-800">articles section</ExternalLink> to browse by research division or use our search feature.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I use your research in my work?
                </h3>
                <p className="text-gray-600 text-sm">
                  Our research is available for educational and policy purposes. 
                  Please review our <ExternalLink href="/legal/usage-guidelines" className="text-blue-600 hover:text-blue-800">usage guidelines</ExternalLink> and contact us for permission requests.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Do you offer internship opportunities?
                </h3>
                <p className="text-gray-600 text-sm">
                  We occasionally offer research internships for graduate students. 
                  Please send your CV and research interests to our general email address.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How can I stay updated on your latest research?
                </h3>
                <p className="text-gray-600 text-sm">
                  Follow us on <ExternalLink href="https://www.linkedin.com/company/ngsrn" className="text-blue-600 hover:text-blue-800">LinkedIn</ExternalLink> for regular updates on our latest publications and research activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}