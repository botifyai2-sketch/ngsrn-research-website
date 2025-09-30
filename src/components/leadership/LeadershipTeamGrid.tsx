'use client';

import React from 'react';
import { Author } from '@/types';
import AuthorProfile from './AuthorProfile';

interface LeadershipTeamGridProps {
  leaders: Author[];
  className?: string;
}

const LeadershipTeamGrid: React.FC<LeadershipTeamGridProps> = ({ 
  leaders, 
  className = '' 
}) => {
  if (leaders.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 text-lg">No leadership team members found.</p>
      </div>
    );
  }

  // Sort leaders to put Executive Director first
  const sortedLeaders = [...leaders].sort((a, b) => {
    if (a.title.includes('Executive Director')) return -1;
    if (b.title.includes('Executive Director')) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={className}>
      {/* Executive Director - Featured */}
      {sortedLeaders.length > 0 && sortedLeaders[0].title.includes('Executive Director') && (
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Executive Leadership</h3>
            <p className="text-gray-600">Leading NGSRN's vision and strategic direction</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <AuthorProfile
              key={sortedLeaders[0].id}
              author={sortedLeaders[0]}
              showFullBio={false}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Research Directors */}
      {sortedLeaders.filter(leader => !leader.title.includes('Executive Director')).length > 0 && (
        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Research Directors</h3>
            <p className="text-gray-600">Leading specialized research divisions across key areas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {sortedLeaders
              .filter(leader => !leader.title.includes('Executive Director'))
              .map((leader) => (
                <AuthorProfile
                  key={leader.id}
                  author={leader}
                  showFullBio={false}
                  className="h-full"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadershipTeamGrid;