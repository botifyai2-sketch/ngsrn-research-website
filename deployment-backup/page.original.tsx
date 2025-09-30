import Link from 'next/link';
import { Suspense } from 'react';
import { SITE_CONFIG } from '@/lib/constants';
import { getPublishedArticles } from '@/lib/db/articles';
import { getAllDivisions } from '@/lib/db/divisions';

// Loading components
function ArticlesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DivisionsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

// Separate components for better performance
async function RecentArticles() {
  const articles = await getPublishedArticles().then(articles => articles.slice(0, 3));
  
  if (articles.length === 0) return null;
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Latest Research
          </h2>
          <p className="text-lg text-gray-600">
            Discover our most recent policy-focused research
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="text-sm text-ngsrn-primary font-medium mb-2">
                  {article.division.name}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <Link 
                    href={`/articles/${article.slug}`}
                    className="hover:text-ngsrn-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {article.readTime} min read
                  </div>
                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-ngsrn-primary hover:text-ngsrn-secondary font-medium text-sm"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link
            href="/articles"
            className="inline-block bg-ngsrn-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}

async function ResearchDivisions() {
  const divisions = await getAllDivisions();
  
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Research Divisions
          </h2>
          <p className="text-lg text-gray-600">
            Explore our multidisciplinary research areas aligned with UN SDGs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {divisions.slice(0, 6).map((division) => (
            <div key={division.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
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
                {division.description.length > 100 
                  ? `${division.description.substring(0, 100)}...` 
                  : division.description
                }
              </p>
              <Link
                href={`/research/${division.id}`}
                className="text-ngsrn-primary hover:text-ngsrn-secondary font-medium"
              >
                Learn More →
              </Link>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link
            href="/research"
            className="inline-block bg-ngsrn-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200"
          >
            View All Research Divisions
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  // Get basic stats for immediate display
  const [recentArticles, divisions] = await Promise.all([
    getPublishedArticles().then(articles => articles.slice(0, 3)),
    getAllDivisions()
  ]);
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-ngsrn-primary via-blue-800 to-ngsrn-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              NextGen Sustainable Research Network
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {SITE_CONFIG.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/research"
                className="bg-ngsrn-accent text-ngsrn-primary px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200 text-center"
              >
                Explore Research
              </Link>
              <Link
                href="/articles"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-ngsrn-primary transition-colors duration-200 text-center"
              >
                Read Articles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              We advance policy-focused research to shape sustainable futures for Africa through 
              multidisciplinary collaboration, connecting scholars, practitioners, and young researchers 
              across governance, education, gender equity, environmental sustainability, and other 
              SDG-aligned fields.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Research Impact
            </h2>
            <p className="text-lg text-gray-600">
              Our growing network of research and collaboration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-primary mb-2">
                {recentArticles.length > 0 ? `${recentArticles.length}+` : '0'}
              </div>
              <div className="text-lg text-gray-600">Published Articles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-secondary mb-2">
                {divisions.length}
              </div>
              <div className="text-lg text-gray-600">Research Divisions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ngsrn-accent mb-2">
                17
              </div>
              <div className="text-lg text-gray-600">SDG Alignments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Articles Section with Suspense */}
      <Suspense fallback={
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Research</h2>
              <p className="text-lg text-gray-600">Discover our most recent policy-focused research</p>
            </div>
            <ArticlesLoading />
          </div>
        </section>
      }>
        <RecentArticles />
      </Suspense>

      {/* Research Divisions with Suspense */}
      <Suspense fallback={
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Research Divisions</h2>
              <p className="text-lg text-gray-600">Explore our multidisciplinary research areas aligned with UN SDGs</p>
            </div>
            <DivisionsLoading />
          </div>
        </section>
      }>
        <ResearchDivisions />
      </Suspense>
    </div>
  );
}
