import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthorById, getLeadershipTeam } from '@/lib/db/authors';
import AuthorProfile from '@/components/leadership/AuthorProfile';

import { StructuredData } from '@/components/seo/StructuredData';
import { generateAuthorSEO, generateMetadata as generateSEOMetadata } from '@/lib/seo';

interface LeadershipProfilePageProps {
  params: {
    authorId: string;
  };
}

export async function generateStaticParams() {
  const leaders = await getLeadershipTeam();
  
  return leaders.map((leader) => ({
    authorId: leader.id,
  }));
}

export async function generateMetadata({ params }: LeadershipProfilePageProps): Promise<Metadata> {
  const author = await getAuthorById(params.authorId);
  
  if (!author || !author.isLeadership) {
    return {
      title: 'Profile Not Found',
    };
  }

  // Generate SEO data using our utility functions
  const divisions = author.researchDivisions?.map(rd => rd.division) || [];
  const seoData = generateAuthorSEO(author, divisions);
  return generateSEOMetadata(seoData);
}

export default async function LeadershipProfilePage({ params }: LeadershipProfilePageProps) {
  const author = await getAuthorById(params.authorId);
  
  if (!author || !author.isLeadership) {
    notFound();
  }

  // Generate structured data for the author
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    email: author.email,
    image: author.profileImage,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'}/leadership/${author.id}`,
    worksFor: {
      '@type': 'Organization',
      name: 'NextGen Sustainable Research Network',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
    },
    ...(author.linkedinUrl && { sameAs: [author.linkedinUrl] }),
    knowsAbout: author.researchDivisions?.map(rd => rd.division.name) || []
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StructuredData data={structuredData} />
      {/* Breadcrumb Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/leadership" className="hover:text-blue-600 transition-colors">
              Leadership
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{author.name}</span>
          </div>
        </div>
      </nav>

      {/* Profile Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Leadership Link */}
          <div className="mb-8">
            <Link
              href="/leadership"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Leadership Team
            </Link>
          </div>

          {/* Author Profile */}
          <AuthorProfile 
            author={author} 
            showFullBio={true}
            className="mb-12"
          />

          {/* Key Achievements Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Achievements & Background</h3>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                {author.bio}
              </p>
              
              {/* Professional Highlights */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Professional Highlights</h4>
                <div className="text-blue-800 space-y-2">
                  {/* Extract key highlights from bio */}
                  {author.bio.split('.').slice(0, 4).map((sentence, index) => (
                    sentence.trim() && (
                      <p key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{sentence.trim()}</span>
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Sections */}
          <div className="space-y-8">
            {/* Research Focus */}
            {author.researchDivisions && author.researchDivisions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Research Focus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {author.researchDivisions.map((division) => (
                    <Link
                      key={division.division.id}
                      href={`/research/${division.division.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {division.division.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {division.division.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Publications */}
            {author.articles && author.articles.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Publications</h3>
                <div className="space-y-4">
                  {author.articles.slice(0, 5).map((articleRelation) => (
                    <div key={articleRelation.article.id} className="border-l-4 border-blue-500 pl-4">
                      <Link
                        href={`/articles/${articleRelation.article.slug}`}
                        className="block hover:bg-gray-50 p-2 rounded transition-colors duration-200"
                      >
                        <h4 className="font-semibold text-gray-900 hover:text-blue-600 mb-1">
                          {articleRelation.article.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {articleRelation.article.summary}
                        </p>
                        <p className="text-xs text-gray-500">
                          {articleRelation.article.publishedAt 
                            ? new Date(articleRelation.article.publishedAt).toLocaleDateString()
                            : 'Draft'
                          }
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
                
                {author.articles.length > 5 && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/articles?author=${author.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      View All Publications →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              
              {/* Contact Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <a
                  href={`mailto:${author.email}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
                
                {author.linkedinUrl && (
                  <a
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-700 text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Connect on LinkedIn
                  </a>
                )}
              </div>

              {/* Contact Information Display */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{author.email}</span>
                  </div>
                  {author.linkedinUrl && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn Profile</span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600">
                Interested in collaboration, research partnerships, or have questions about our work? 
                Feel free to reach out directly using any of the contact methods above.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}