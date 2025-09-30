'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Author } from '@/types';

interface AuthorProfileProps {
  author: Author;
  showFullBio?: boolean;
  className?: string;
}

const AuthorProfile: React.FC<AuthorProfileProps> = ({ 
  author, 
  showFullBio = false, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Profile Image */}
      <div className="relative h-64 w-full">
        {author.profileImage ? (
          <Image
            src={author.profileImage}
            alt={`${author.name} - ${author.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <p className="text-lg font-semibold">{author.name}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Profile Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {author.name}
        </h3>
        
        <p className="text-lg text-blue-600 font-medium mb-4">
          {author.title}
        </p>
        
        {/* Bio */}
        <div className="text-gray-700 mb-4">
          {showFullBio ? (
            <div className="space-y-3">
              <p className="leading-relaxed">{author.bio}</p>
              
              {/* Research Areas */}
              {(author as any).researchDivisions && (author as any).researchDivisions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Research Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {(author as any).researchDivisions.map((rd: any) => (
                      <span
                        key={rd.division.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {rd.division.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="leading-relaxed">
              {author.bio.length > 150 
                ? `${author.bio.substring(0, 150)}...` 
                : author.bio
              }
            </p>
          )}
        </div>

        {/* Statistics */}
        {(author as any).articles && (
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {(author as any).articles.length} Article{(author as any).articles.length !== 1 ? 's' : ''}
            </div>
            {(author as any).researchDivisions && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {(author as any).researchDivisions.length} Division{(author as any).researchDivisions.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
        
        {/* Contact Information */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Email */}
          <a
            href={`mailto:${author.email}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact
          </a>
          
          {/* LinkedIn */}
          {author.linkedinUrl && (
            <a
              href={author.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
              aria-label={`View ${author.name}'s LinkedIn profile (opens in new tab)`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn Profile
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        
        {/* View Full Profile Link (if not showing full bio) */}
        {!showFullBio && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href={`/leadership/${author.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
            >
              View Full Profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorProfile;