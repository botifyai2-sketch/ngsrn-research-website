import React from 'react';
import { ArticleReader } from '@/components/articles';

// Sample article data for testing
const sampleArticle = {
  id: 'test-1',
  title: 'Test Article: Sustainable Development in Africa',
  slug: 'test-sustainable-development-africa',
  content: `# Sustainable Development in Africa

## Introduction

This is a test article to demonstrate the article display functionality. It includes various markdown elements to showcase the rendering capabilities.

## Key Points

### Environmental Sustainability

Africa faces unique environmental challenges that require innovative solutions:

1. **Climate Change Adaptation**
   - Rising temperatures
   - Changing precipitation patterns
   - Extreme weather events

2. **Biodiversity Conservation**
   - Protecting endangered species
   - Maintaining ecosystem services
   - Sustainable resource management

### Economic Development

Sustainable economic growth requires:

- Investment in renewable energy
- Support for local communities
- Technology transfer and innovation

> "Sustainable development is not just about the environment; it's about creating a future where all people can thrive." - Test Quote

## Code Example

Here's a simple example of data analysis:

\`\`\`javascript
const sustainabilityMetrics = {
  carbonFootprint: 'reduced by 25%',
  renewableEnergy: 'increased to 40%',
  biodiversityIndex: 'improved by 15%'
};

console.log('Progress:', sustainabilityMetrics);
\`\`\`

## Data Table

| Country | Renewable Energy % | Carbon Reduction |
|---------|-------------------|------------------|
| Kenya | 85% | 20% |
| Ghana | 42% | 15% |
| Morocco | 37% | 18% |

## Conclusion

This test article demonstrates the various formatting capabilities of our article display system, including headings, lists, blockquotes, code blocks, and tables.

### References

- United Nations Sustainable Development Goals
- African Development Bank Reports
- Climate Change Research Institute`,
  summary: 'A test article demonstrating sustainable development challenges and opportunities in Africa, showcasing various markdown formatting elements.',
  tags: ['sustainability', 'africa', 'development', 'test'],
  status: 'PUBLISHED' as const,
  publishedAt: new Date('2024-03-01'),
  scheduledFor: null,
  readTime: 5,
  downloadUrl: null,
  seoTitle: 'Test Article: Sustainable Development in Africa',
  seoDescription: 'A comprehensive test article about sustainable development in Africa',
  seoKeywords: '["sustainable development", "africa", "environment", "test"]',
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
  divisionId: 'test-division',
  division: {
    id: 'test-division',
    name: 'Environment Climate & Sustainability',
    description: 'Research focused on environmental sustainability and climate change',
    sdgAlignment: '["SDG 13", "SDG 15", "SDG 7"]',
    color: '#2E8B57',
    icon: 'leaf',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  authors: [
    {
      author: {
        id: 'test-author-1',
        name: 'Dr. Test Author',
        title: 'Senior Research Fellow',
        bio: 'Expert in sustainable development and environmental policy',
        email: 'test.author@ngsrn.org',
        linkedinUrl: 'https://linkedin.com/in/testauthor',
        profileImage: null,
        isLeadership: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        researchDivisions: [
          {
            division: {
              id: 'test-division',
              name: 'Environment Climate & Sustainability',
              description: 'Research focused on environmental sustainability',
              sdgAlignment: '["SDG 13", "SDG 15"]',
              color: '#2E8B57',
              icon: 'leaf',
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01')
            }
          }
        ]
      },
      order: 0
    }
  ],
  mediaFiles: []
};

export default function TestArticlePage() {
  return (
    <div className="bg-gray-50">
      <div className="bg-ngsrn-blue text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Article Display Test Page</h1>
          <p className="text-blue-100">Testing the article reader component with sample content</p>
        </div>
      </div>
      
      <ArticleReader 
        article={sampleArticle as any}
        showTableOfContents={true}
        enableAIAssistant={false}
      />
    </div>
  );
}

export const metadata = {
  title: 'Test Article | NGSRN',
  description: 'Test page for article display functionality',
};