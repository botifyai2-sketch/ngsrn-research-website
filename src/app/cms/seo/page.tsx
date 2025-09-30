'use client';

import React, { useState, useEffect } from 'react';
import { SEOMetadataForm } from '@/components/seo/SEOMetadataForm';
import { SEOPreview } from '@/components/seo/SEOPreview';
import { SEOData, generateSlug } from '@/lib/seo';

interface SitemapStats {
  totalUrls: number;
  lastGenerated: string;
  articles: number;
  divisions: number;
  authors: number;
  static: number;
}

export default function SEOManagementPage() {
  const [activeTab, setActiveTab] = useState<'metadata' | 'sitemap' | 'tools'>('metadata');
  const [seoData, setSeoData] = useState<SEOData>({
    title: '',
    description: '',
    keywords: [],
  });
  const [sitemapStats, setSitemapStats] = useState<SitemapStats | null>(null);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');

  // Load sitemap stats and SEO settings on component mount
  useEffect(() => {
    loadSitemapStats();
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      const response = await fetch('/api/settings?key=global_seo');
      if (response.ok) {
        const setting = await response.json();
        if (setting.value) {
          setSeoData(setting.value);
        }
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
    }
  };

  const loadSitemapStats = async () => {
    try {
      const response = await fetch('/api/seo/sitemap-stats');
      if (response.ok) {
        const stats = await response.json();
        setSitemapStats(stats);
      }
    } catch (error) {
      console.error('Failed to load sitemap stats:', error);
    }
  };

  const handleSEOSave = async (newSeoData: SEOData) => {
    setSeoData(newSeoData);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'global_seo',
          value: newSeoData,
          description: 'Global SEO settings for the website'
        }),
      });

      if (response.ok) {
        alert('SEO settings saved successfully!');
      } else {
        alert('Failed to save SEO settings');
      }
    } catch (error) {
      console.error('Failed to save SEO settings:', error);
      alert('Failed to save SEO settings');
    }
  };

  const handleRegenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      const response = await fetch('/api/seo/regenerate-sitemap', {
        method: 'POST',
      });
      if (response.ok) {
        await loadSitemapStats();
        alert('Sitemap regenerated successfully!');
      } else {
        alert('Failed to regenerate sitemap');
      }
    } catch (error) {
      console.error('Failed to regenerate sitemap:', error);
      alert('Failed to regenerate sitemap');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const handleSlugGeneration = () => {
    if (slugInput.trim()) {
      setGeneratedSlug(generateSlug(slugInput));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="mt-2 text-gray-600">
            Manage SEO settings, sitemaps, and optimization tools for the NGSRN website.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'metadata', label: 'SEO Metadata', icon: '🏷️' },
              { id: 'sitemap', label: 'Sitemap Management', icon: '🗺️' },
              { id: 'tools', label: 'SEO Tools', icon: '🛠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {activeTab === 'metadata' && (
            <>
              <div>
                <SEOMetadataForm
                  initialData={seoData}
                  onSave={handleSEOSave}
                />
              </div>
              <div>
                <SEOPreview seoData={seoData} />
              </div>
            </>
          )}

          {activeTab === 'sitemap' && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Sitemap Management</h3>
                  <button
                    onClick={handleRegenerateSitemap}
                    disabled={isGeneratingSitemap}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingSitemap ? 'Regenerating...' : 'Regenerate Sitemap'}
                  </button>
                </div>

                {sitemapStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{sitemapStats.totalUrls}</div>
                      <div className="text-sm text-blue-800">Total URLs</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{sitemapStats.articles}</div>
                      <div className="text-sm text-green-800">Articles</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{sitemapStats.divisions}</div>
                      <div className="text-sm text-purple-800">Research Divisions</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{sitemapStats.authors}</div>
                      <div className="text-sm text-orange-800">Leadership Pages</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Loading sitemap statistics...
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Sitemap URLs</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Main Sitemap:</span>
                      <a 
                        href="/sitemap.xml" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        /sitemap.xml
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Robots.txt:</span>
                      <a 
                        href="/robots.txt" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        /robots.txt
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="lg:col-span-2 space-y-6">
              {/* URL Slug Generator */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">URL Slug Generator</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="slug-input" className="block text-sm font-medium text-gray-700 mb-2">
                      Article Title
                    </label>
                    <input
                      id="slug-input"
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter article title to generate SEO-friendly slug"
                    />
                  </div>
                  <button
                    onClick={handleSlugGeneration}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Generate Slug
                  </button>
                  {generatedSlug && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600 mb-1">Generated Slug:</div>
                      <div className="font-mono text-sm text-gray-900 bg-white px-2 py-1 rounded border">
                        {generatedSlug}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Checklist */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Best Practices Checklist</h3>
                <div className="space-y-3">
                  {[
                    'Title tags are 30-60 characters long',
                    'Meta descriptions are 120-160 characters long',
                    'URLs are SEO-friendly and descriptive',
                    'Images have alt text for accessibility',
                    'Content includes relevant keywords naturally',
                    'Internal linking between related articles',
                    'Structured data markup is implemented',
                    'Page loading speed is optimized',
                    'Mobile responsiveness is ensured',
                    'Sitemap is regularly updated',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}