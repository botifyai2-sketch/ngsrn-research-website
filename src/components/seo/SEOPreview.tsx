'use client';

import React from 'react';
import { SEOData } from '@/lib/seo';

interface SEOPreviewProps {
  seoData: SEOData;
  baseUrl?: string;
}

export function SEOPreview({ seoData, baseUrl = 'https://ngsrn.org' }: SEOPreviewProps) {
  const fullUrl = seoData.canonicalUrl ? `${baseUrl}${seoData.canonicalUrl}` : baseUrl;
  const displayUrl = fullUrl.replace(/^https?:\/\//, '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Preview</h3>
      
      {/* Google Search Result Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Google Search Result</h4>
        <div className="bg-gray-50 p-4 rounded-md border">
          <div className="space-y-1">
            <div className="text-xs text-green-700">{displayUrl}</div>
            <div className="text-lg text-blue-600 hover:underline cursor-pointer">
              {seoData.title || 'No title set'}
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {seoData.description || 'No description set'}
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Social Media Preview</h4>
        <div className="bg-gray-50 p-4 rounded-md border">
          <div className="flex">
            <div className="w-32 h-20 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 mr-4 flex-shrink-0">
              {seoData.ogImage ? (
                <img 
                  src={seoData.ogImage} 
                  alt="OG Preview" 
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                'No image'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {seoData.title || 'No title set'}
              </div>
              <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                {seoData.description || 'No description set'}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase">
                {displayUrl}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {seoData.keywords && seoData.keywords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {seoData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Technical Details</h4>
        <div className="bg-gray-50 p-4 rounded-md text-xs font-mono space-y-2">
          <div>
            <span className="text-gray-600">Title Length:</span>{' '}
            <span className={seoData.title.length > 60 ? 'text-red-600' : seoData.title.length < 30 ? 'text-yellow-600' : 'text-green-600'}>
              {seoData.title.length} chars
            </span>
          </div>
          <div>
            <span className="text-gray-600">Description Length:</span>{' '}
            <span className={seoData.description.length > 160 ? 'text-red-600' : seoData.description.length < 120 ? 'text-yellow-600' : 'text-green-600'}>
              {seoData.description.length} chars
            </span>
          </div>
          <div>
            <span className="text-gray-600">Keywords:</span>{' '}
            <span className={seoData.keywords.length > 10 ? 'text-red-600' : 'text-gray-900'}>
              {seoData.keywords.length}/10
            </span>
          </div>
          {seoData.canonicalUrl && (
            <div>
              <span className="text-gray-600">Canonical URL:</span>{' '}
              <span className="text-gray-900">{seoData.canonicalUrl}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}