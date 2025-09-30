'use client';

import React, { useState, useEffect } from 'react';
import { SEOData, validateSEO, extractKeywords } from '@/lib/seo';

interface SEOMetadataFormProps {
  initialData?: Partial<SEOData>;
  content?: string; // Article content for keyword extraction
  onSave: (seoData: SEOData) => void;
  onCancel?: () => void;
}

export function SEOMetadataForm({ 
  initialData = {}, 
  content = '', 
  onSave, 
  onCancel 
}: SEOMetadataFormProps) {
  const [seoData, setSeoData] = useState<SEOData>({
    title: initialData.title || '',
    description: initialData.description || '',
    keywords: initialData.keywords || [],
    canonicalUrl: initialData.canonicalUrl || '',
    ogImage: initialData.ogImage || '',
    ...initialData
  });

  const [validation, setValidation] = useState({ isValid: true, issues: [] as string[] });
  const [keywordInput, setKeywordInput] = useState('');

  // Validate SEO data whenever it changes
  useEffect(() => {
    const result = validateSEO(seoData);
    setValidation(result);
  }, [seoData]);

  const handleInputChange = (field: keyof SEOData, value: string | string[]) => {
    setSeoData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seoData.keywords.includes(keywordInput.trim())) {
      setSeoData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSeoData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleExtractKeywords = () => {
    if (content) {
      const extractedKeywords = extractKeywords(content, 8);
      const newKeywords = extractedKeywords.filter(k => !seoData.keywords.includes(k));
      setSeoData(prev => ({
        ...prev,
        keywords: [...prev.keywords, ...newKeywords].slice(0, 10)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.isValid) {
      onSave(seoData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Metadata</h3>
        {!validation.isValid && (
          <span className="text-sm text-red-600 font-medium">
            {validation.issues.length} issue{validation.issues.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="seo-title" className="block text-sm font-medium text-gray-700 mb-2">
            SEO Title
          </label>
          <input
            id="seo-title"
            type="text"
            value={seoData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter SEO title (30-60 characters recommended)"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{seoData.title.length} characters</span>
            <span className={seoData.title.length > 60 ? 'text-red-500' : seoData.title.length < 30 ? 'text-yellow-500' : 'text-green-500'}>
              {seoData.title.length < 30 ? 'Too short' : seoData.title.length > 60 ? 'Too long' : 'Good length'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="seo-description" className="block text-sm font-medium text-gray-700 mb-2">
            Meta Description
          </label>
          <textarea
            id="seo-description"
            value={seoData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter meta description (120-160 characters recommended)"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{seoData.description.length} characters</span>
            <span className={seoData.description.length > 160 ? 'text-red-500' : seoData.description.length < 120 ? 'text-yellow-500' : 'text-green-500'}>
              {seoData.description.length < 120 ? 'Too short' : seoData.description.length > 160 ? 'Too long' : 'Good length'}
            </span>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Keywords
            </label>
            {content && (
              <button
                type="button"
                onClick={handleExtractKeywords}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Extract from content
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add keyword and press Enter"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {seoData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="mt-1 text-xs text-gray-500">
            {seoData.keywords.length}/10 keywords
            {seoData.keywords.length > 10 && (
              <span className="text-red-500 ml-2">Too many keywords</span>
            )}
          </div>
        </div>

        {/* Canonical URL */}
        <div>
          <label htmlFor="canonical-url" className="block text-sm font-medium text-gray-700 mb-2">
            Canonical URL (optional)
          </label>
          <input
            id="canonical-url"
            type="text"
            value={seoData.canonicalUrl || ''}
            onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/articles/article-slug"
          />
        </div>

        {/* OG Image */}
        <div>
          <label htmlFor="og-image" className="block text-sm font-medium text-gray-700 mb-2">
            Open Graph Image URL (optional)
          </label>
          <input
            id="og-image"
            type="text"
            value={seoData.ogImage || ''}
            onChange={(e) => handleInputChange('ogImage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/images/article-image.jpg"
          />
        </div>

        {/* Validation Issues */}
        {!validation.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">SEO Issues:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!validation.isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save SEO Settings
          </button>
        </div>
      </form>
    </div>
  );
}