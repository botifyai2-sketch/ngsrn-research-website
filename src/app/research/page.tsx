import React from 'react';
import { Metadata } from 'next';
import { ResearchDivisionGrid, ResearchDivisionNavigation } from '@/components/research';
import { getAllDivisions } from '@/lib/db/divisions';
import { RESEARCH_DIVISIONS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Research Divisions | NGSRN',
  description: 'Explore NGSRN&apos;s research divisions focused on sustainable development and policy research across Africa.',
};

export default async function ResearchPage() {
  // Get divisions from database, fallback to constants if needed
  let divisions;
  try {
    divisions = await getAllDivisions();
  } catch {
    // Fallback to constants with proper typing
    divisions = RESEARCH_DIVISIONS.map(div => ({
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

  return (
    <div>
      {/* Navigation */}
      <ResearchDivisionNavigation divisions={divisions} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Research Divisions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            NGSRN organizes research across five key divisions, each aligned with UN Sustainable 
            Development Goals to address Africa&apos;s most pressing challenges through evidence-based policy research.
          </p>
        </div>

        {/* Research Division Grid */}
        <ResearchDivisionGrid 
          divisions={divisions}
          showStats={true}
        />

        {/* Additional Information */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Interdisciplinary Approach
            </h2>
            <p className="text-gray-700 max-w-4xl mx-auto">
              Our research divisions work collaboratively to address complex challenges that span multiple 
              disciplines. Each division contributes unique perspectives while maintaining alignment with 
              the UN Sustainable Development Goals, ensuring our research has maximum impact on policy 
              and sustainable development across Africa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}