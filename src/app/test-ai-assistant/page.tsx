import React from 'react';
import { ArticleWithAI } from '@/components/articles/ArticleWithAI';

// Mock article data for testing the AI assistant
const mockArticle = {
  id: 'test-ai-article',
  title: 'Sustainable Agriculture Practices in Sub-Saharan Africa: A Policy Framework',
  slug: 'sustainable-agriculture-practices-sub-saharan-africa',
  content: `# Sustainable Agriculture Practices in Sub-Saharan Africa

## Introduction

Agriculture remains the backbone of many Sub-Saharan African economies, employing over 60% of the population and contributing significantly to GDP. However, the sector faces numerous challenges including **climate change**, **soil degradation**, and limited access to modern farming technologies.

## Key Challenges

### Climate Change Impact
Climate variability and extreme weather events pose significant threats to agricultural productivity. Farmers are experiencing:

- Irregular rainfall patterns
- Prolonged droughts  
- Increased frequency of floods
- Rising temperatures affecting crop yields

### Soil Degradation
Soil fertility decline is a major concern across the region:

1. **Nutrient depletion** due to continuous cropping without adequate fertilization
2. **Erosion** caused by poor land management practices
3. **Salinization** in irrigated areas
4. **Compaction** from heavy machinery and overgrazing

## Sustainable Solutions

### Agroecological Approaches

**Crop Rotation and Diversification**
Implementing diverse cropping systems helps maintain soil health and reduces pest pressure. Farmers are adopting:

- Legume-cereal rotations to fix nitrogen naturally
- Intercropping systems that maximize land use efficiency
- Indigenous crop varieties adapted to local conditions

**Conservation Agriculture**
This approach focuses on three main principles:
1. Minimal soil disturbance
2. Permanent soil cover
3. Crop rotation and diversification

### Technology Integration

Modern technologies are being adapted to local contexts:

- **Precision agriculture** using mobile apps for crop monitoring
- **Drip irrigation** systems for water conservation
- **Solar-powered** equipment for processing and storage

## Policy Recommendations

Governments and international organizations should prioritize:

1. Investment in agricultural research and development
2. Support for farmer education and training programs
3. Development of climate-resilient infrastructure
4. Promotion of sustainable land management practices

## Conclusion

Sustainable agriculture in Sub-Saharan Africa requires a holistic approach that combines traditional knowledge with modern innovations. Success depends on coordinated efforts from farmers, governments, and international partners to build resilient food systems.

> "The future of African agriculture lies in sustainable practices that work with nature, not against it." - Dr. Amina Hassan, Agricultural Sustainability Expert`,
  summary: 'An analysis of sustainable agriculture practices in Sub-Saharan Africa, examining challenges like climate change and soil degradation while proposing agroecological solutions and policy recommendations.',
  tags: ['agriculture', 'sustainability', 'climate-change', 'food-security', 'africa'],
  status: 'PUBLISHED' as const,
  publishedAt: new Date('2024-01-15'),
  readTime: 8,
  seoTitle: 'Sustainable Agriculture Practices in Sub-Saharan Africa | NGSRN Research',
  seoDescription: 'Comprehensive analysis of sustainable agriculture challenges and solutions in Sub-Saharan Africa.',
  seoKeywords: ['sustainable agriculture', 'Sub-Saharan Africa', 'climate change', 'food security'],
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-15'),
  divisionId: 'env-climate-sustainability',
  division: {
    id: 'env-climate-sustainability',
    name: 'Environment Climate & Sustainability',
    description: 'Environmental research and climate change mitigation strategies',
    sdgAlignment: ['SDG 13: Climate Action', 'SDG 15: Life on Land', 'SDG 14: Life Below Water'],
    color: '#228B22',
    icon: 'leaf',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  authors: [
    {
      author: {
        id: 'author-1',
        name: 'Dr. Wirajing Muhamadu Awal Kindzeka',
        title: 'Executive Director',
        bio: 'Development Economist and Researcher specializing in fisheries, food security, poverty reduction, and sustainable development.',
        email: 'wirajing.kindzeka@ngsrn.org',
        linkedinUrl: 'https://linkedin.com/in/wirajing-kindzeka',
        profileImage: '/images/leadership/wirajing-kindzeka.jpg',
        isLeadership: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        researchDivisions: []
      },
      order: 0
    }
  ],
  mediaFiles: []
};

export default function TestAIAssistantPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">🤖 AI Assistant Test Page</h1>
          <p className="text-blue-100">
            Test the Gemini-powered research assistant with a sample article
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">🧪 How to Test the AI Assistant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Desktop Testing:</h3>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>• Look for "Ask NGSRN AI" widget on the right side</li>
                <li>• Click "Start Conversation" to open the chat</li>
                <li>• Try the quick action buttons</li>
                <li>• Minimize/maximize the chat window</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Mobile Testing:</h3>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>• Look for floating AI chat button (bottom-right)</li>
                <li>• Tap to open full-screen chat interface</li>
                <li>• Test touch interactions and scrolling</li>
                <li>• Try text selection on mobile</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded border">
            <h3 className="font-semibold text-blue-900 mb-2">💬 Sample Questions to Try:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Quick Actions:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>📖 "Summarize this article"</li>
                  <li>💡 "Explain concepts"</li>
                  <li>❓ "Ask a question"</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Custom Questions:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• "What are the main challenges?"</li>
                  <li>• "Explain agroecological approaches"</li>
                  <li>• "What are the policy recommendations?"</li>
                  <li>• "How does climate change affect agriculture?"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Text Selection:</strong> Highlight any text in the article below to see explanation options appear!
            </p>
          </div>
        </div>

        {/* Article with AI Assistant */}
        <ArticleWithAI 
          article={mockArticle}
          showTableOfContents={true}
          enableAIAssistant={true}
        />
      </div>
    </div>
  );
}