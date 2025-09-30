'use client';

import React from 'react';
import { ResearchDivision } from '@/types';
import ResearchDivisionCard from './ResearchDivisionCard';

interface ResearchDivisionGridProps {
  divisions: ResearchDivision[];
  divisionStats?: Record<string, { articleCount: number; authorCount: number }>;
  showStats?: boolean;
}

const ResearchDivisionGrid: React.FC<ResearchDivisionGridProps> = ({
  divisions,
  divisionStats,
  showStats = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {divisions.map((division) => (
        <ResearchDivisionCard
          key={division.id}
          division={division}
          articleCount={divisionStats?.[division.id]?.articleCount}
          showStats={showStats}
        />
      ))}
    </div>
  );
};

export default ResearchDivisionGrid;