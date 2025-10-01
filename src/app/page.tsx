import Link from 'next/link';
import { SITE_CONFIG, RESEARCH_DIVISIONS } from '@/lib/constants';

export default function Home() {
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
          </div>
        </div>
      </section>

      {/* Research Divisions */}
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
            {RESEARCH_DIVISIONS.slice(0, 6).map((division) => (
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

      {/* Call to Action */}
      <section className="py-16 bg-ngsrn-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Join Our Research Network
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Connect with researchers, access our publications, and contribute to sustainable development in Africa.
          </p>
          <Link
            href="/contact"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </div>
  );
}