'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { MediaManager } from '@/components/media/MediaManager';
import { MediaFile } from '@/types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from '@/lib/storage';

export default function MediaManagementPage() {
  const { data: session, status } = useSession();
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);

  const handleUpload = useCallback(async (files: File[]): Promise<MediaFile[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.files;
  }, []);

  const handleSelect = useCallback((media: MediaFile) => {
    setSelectedMedia(prev => {
      const exists = prev.find(m => m.id === media.id);
      if (exists) {
        return prev.filter(m => m.id !== media.id);
      } else {
        return [...prev, media];
      }
    });
  }, []);

  const handleDelete = useCallback(async (mediaId: string): Promise<void> => {
    const response = await fetch(`/api/media/${mediaId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    // Remove from selected media if it was selected
    setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
  }, []);

  // Redirect if not authenticated or not authorized
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || (session.user as any).role === 'VIEWER') {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Media Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload and manage your media files
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {(session.user as any).role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MediaManager
          allowedTypes={SUPPORTED_FILE_TYPES.all}
          maxFileSize={MAX_FILE_SIZES.default}
          onUpload={handleUpload}
          onSelect={handleSelect}
          onDelete={handleDelete}
          selectedMedia={selectedMedia}
          mode="manage"
          multiple={true}
        />

        {/* Selected Media Summary */}
        {selectedMedia.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selected Media ({selectedMedia.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedMedia.map((media) => (
                <div key={media.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {media.mimeType.startsWith('image/') ? (
                    <img
                      src={media.url}
                      alt={media.alt || media.originalName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {media.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {media.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(media.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelect(media)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}