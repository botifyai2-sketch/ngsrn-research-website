import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, RESEARCH_DIVISIONS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About Us | NGSRN',
  description: 'Learn about NextGen Sustainable Research Network\'s mission, vision, and commitment to advancing policy-focused research for sustainable futures in Africa.',
};

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-ngsrn-primary mb-6">
              About NextGen Sustainable Research Network
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {SITE_CONFIG.description}
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section id="mission" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                We advance policy-focused research to shape sustainable futures for Africa through 
                multidisciplinary collaboration, connecting scholars, practitioners, and young researchers 
                across governance, education, gender equity, environmental sustainability, and other 
                SDG-aligned fields.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our network serves as a bridge between academic research and practical policy implementation, 
                ensuring that scholarly work translates into meaningful change across the continent.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-ngsrn-primary mb-4">
                Our Vision
              </h3>
              <p className="text-gray-700 mb-6">
                To be the leading research network driving evidence-based policy solutions for 
                sustainable development across Africa.
              </p>
              <h3 className="text-2xl font-semibold text-ngsrn-primary mb-4">
                Our Values
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-ngsrn-secondary mr-2">•</span>
                  Excellence in research and scholarship
                </li>
                <li className="flex items-start">
                  <span className="text-ngsrn-secondary mr-2">•</span>
                  Collaborative and inclusive approach
                </li>
                <li className="flex items-start">
                  <span className="text-ngsrn-secondary mr-2">•</span>
                  Commitment to sustainable development
                </li>
                <li className="flex items-start">
                  <span className="text-ngsrn-secondary mr-2">•</span>
                  Policy-relevant research impact
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Research Areas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Research Focus Areas
            </h2>
            <p className="text-lg text-gray-600">
              We conduct research across {RESEARCH_DIVISIONS.length} key divisions aligned with UN SDGs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {RESEARCH_DIVISIONS.map((division) => (
              <div key={division.id} className="bg-gray-50 p-6 rounded-lg">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: division.color }}
                >
                  <span className="text-white font-bold text-sm">
                    {division.name.split(' ').map(word => word[0]).join('').substring(0, 2)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {division.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {division.description}
                </p>
                <div className="space-y-1">
                  {division.sdgAlignment.map((sdg, index) => (
                    <div key={index} className="text-sm text-ngsrn-primary">
                      {sdg}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              href="/research"
              className="inline-block bg-ngsrn-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200"
            >
              Explore Our Research
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-gray-600">
              Measuring our contribution to sustainable development
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-primary mb-2">
                25+
              </div>
              <div className="text-lg text-gray-600">Published Articles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-secondary mb-2">
                {RESEARCH_DIVISIONS.length}
              </div>
              <div className="text-lg text-gray-600">Research Divisions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-accent mb-2">
                17
              </div>
              <div className="text-lg text-gray-600">SDG Alignments</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-primary mb-2">
                50+
              </div>
              <div className="text-lg text-gray-600">Research Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-ngsrn-secondary via-green-700 to-ngsrn-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-black">
            Join Our Research Community
          </h2>
          <p className="text-xl mb-8 text-black max-w-2xl mx-auto">
            Be part of a network that's shaping the future of sustainable development in Africa through evidence-based research.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Involved
            </Link>
            <Link
              href="/articles"
              className="border-2 border-black text-black px-8 py-3 rounded-lg font-semibold hover:bg-black hover:text-white transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Read Our Research
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}