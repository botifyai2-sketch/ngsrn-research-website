import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  ResearchDivisionHeader, 
  ResearchDivisionNavigation 
} from '@/components/research';
import { getAllDivisions, getDivisionWithStats } from '@/lib/db/divisions';
import { RESEARCH_DIVISIONS } from '@/lib/constants';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateDivisionSEO, generateMetadata as generateSEOMetadata } from '@/lib/seo';

interface ResearchDivisionPageProps {
  params: {
    divisionId: string;
  };
}

export async function generateStaticParams() {
  // Generate static params for all research divisions
  return RESEARCH_DIVISIONS.map((division) => ({
    divisionId: division.id,
  }));
}

export async function generateMetadata({ params }: ResearchDivisionPageProps): Promise<Metadata> {
  const { divisionId } = params;
  
  // Try to get division from database first, fallback to constants
  let division;
  try {
    division = await getDivisionWithStats(divisionId);
  } catch {
    division = RESEARCH_DIVISIONS.find(d => d.id === divisionId);
  }
  
  if (!division) {
    return {
      title: 'Division Not Found | NGSRN',
    };
  }

  // Generate SEO data using our utility functions
  // Extract only the ResearchDivision properties for SEO
  const divisionForSEO = {
    id: division.id,
    name: division.name,
    description: division.description,
    sdgAlignment: division.sdgAlignment,
    color: division.color,
    icon: division.icon,
    createdAt: (division as any).createdAt || new Date(),
    updatedAt: (division as any).updatedAt || new Date()
  };
  const seoData = generateDivisionSEO(divisionForSEO);
  return generateSEOMetadata(seoData);
}

export default async function ResearchDivisionPage({ params }: ResearchDivisionPageProps) {
  const { divisionId } = params;

  // Get all divisions for navigation
  let allDivisions;
  try {
    allDivisions = await getAllDivisions();
  } catch {
    allDivisions = RESEARCH_DIVISIONS.map(div => ({
      id: div.id,
      name: div.name,
      description: div.description,
      sdgAlignment: div.sdgAlignment,
      color: div.color,
      icon: div.icon,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // Get specific division with stats
  let divisionWithStats;
  try {
    divisionWithStats = await getDivisionWithStats(divisionId);
  } catch {
    // Fallback to constants
    const constantDivision = RESEARCH_DIVISIONS.find(d => d.id === divisionId);
    if (constantDivision) {
      divisionWithStats = {
        id: constantDivision.id,
        name: constantDivision.name,
        description: constantDivision.description,
        sdgAlignment: constantDivision.sdgAlignment,
        color: constantDivision.color,
        icon: constantDivision.icon,
        createdAt: new Date(),
        updatedAt: new Date(),
        articles: [],
        authors: [],
        articleCount: 0,
        authorCount: 0,
      };
    }
  }

  if (!divisionWithStats) {
    notFound();
  }

  // Generate structured data for the division
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${divisionWithStats.name} Research`,
    description: divisionWithStats.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'}/research/${divisionId}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'NextGen Sustainable Research Network',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://ngsrn.org'
    },
    about: {
      '@type': 'Thing',
      name: divisionWithStats.name,
      description: divisionWithStats.description
    },
    numberOfItems: divisionWithStats.articleCount
  };

  return (
    <div>
      <StructuredData data={structuredData} />
      {/* Navigation */}
      <ResearchDivisionNavigation 
        divisions={allDivisions} 
        currentDivisionId={divisionId}
      />

      {/* Division Header */}
      <ResearchDivisionHeader
        division={divisionWithStats}
        articleCount={divisionWithStats.articleCount}
        authorCount={divisionWithStats.authorCount}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Articles Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Latest Research Articles
            </h2>
            {divisionWithStats.articleCount > 0 && (
              <a 
                href={`/articles?division=${divisionId}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View all articles →
              </a>
            )}
          </div>

          {divisionWithStats.articleCount === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles yet
              </h3>
              <p className="text-gray-600">
                Research articles for this division will be published here as they become available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Article cards will be implemented in a future task */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Researchers Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Research Team
            </h2>
            {divisionWithStats.authorCount > 0 && (
              <a 
                href={`/leadership?division=${divisionId}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View all researchers →
              </a>
            )}
          </div>

          {divisionWithStats.authorCount === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Research team coming soon
              </h3>
              <p className="text-gray-600">
                Information about researchers in this division will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Author cards will be implemented in a future task */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related Divisions */}
        <div className="bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Explore Other Research Areas
          </h2>
          <p className="text-gray-700 mb-6">
            Discover how our other research divisions contribute to sustainable development across Africa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allDivisions
              .filter(d => d.id !== divisionId)
              .map((division) => (
                <a
                  key={division.id}
                  href={`/research/${division.id}`}
                  className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: division.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {division.name}
                    </span>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}