import React from 'react';
import { Metadata } from 'next';
import { getLeadershipTeam } from '@/lib/db/authors';
import LeadershipTeamGrid from '@/components/leadership/LeadershipTeamGrid';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Leadership Team - ${SITE_CONFIG.name}`,
  description: 'Meet the leadership team of the NextGen Sustainable Research Network (NGSRN), driving policy-focused research for sustainable futures in Africa.',
  openGraph: {
    title: `Leadership Team - ${SITE_CONFIG.name}`,
    description: 'Meet the leadership team of the NextGen Sustainable Research Network (NGSRN), driving policy-focused research for sustainable futures in Africa.',
    url: `${SITE_CONFIG.url}/leadership`,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-leadership.jpg`,
        width: 1200,
        height: 630,
        alt: 'NGSRN Leadership Team',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Leadership Team - ${SITE_CONFIG.name}`,
    description: 'Meet the leadership team of the NextGen Sustainable Research Network (NGSRN), driving policy-focused research for sustainable futures in Africa.',
    images: [`${SITE_CONFIG.url}/og-leadership.jpg`],
  },
};

export default async function LeadershipPage() {
  const leaders = await getLeadershipTeam();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Leadership Team
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Meet the distinguished researchers and policy experts leading NGSRN&apos;s mission to advance 
              sustainable development through evidence-based research across Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Leadership
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our leadership team brings together decades of experience in research, policy development, 
              and sustainable development across multiple disciplines and African contexts.
            </p>
          </div>

          {/* Leadership Grid */}
          <LeadershipTeamGrid leaders={leaders} />

          {/* Mission Statement */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8 md:p-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Our Collective Mission
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                Together, our leadership team is committed to advancing policy-focused research that shapes 
                sustainable futures for Africa. We believe in the power of evidence-based research to inform 
                policy decisions, drive innovation, and create lasting positive change across the continent. 
                Our multidisciplinary approach ensures that we address the complex, interconnected challenges 
                facing African communities today.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Connect with Our Team
            </h3>
            <p className="text-gray-600 mb-6">
              Interested in collaborating or learning more about our research? 
              Reach out to any of our leadership team members directly.
            </p>
            <a
              href={`mailto:${SITE_CONFIG.links.email}`}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact NGSRN
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}