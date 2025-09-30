'use client';

import React, { useState } from 'react';
import { MediaSelector } from '@/components/media/MediaSelector';
import { MediaFile } from '@/types';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZES } from '@/lib/storage';

export default function TestMediaPage() {
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<MediaFile[]>([]);
  const [selectedAnyFiles, setSelectedAnyFiles] = useState<MediaFile[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            Media Management System Test
          </h1>

          <div className="space-y-8">
            {/* Image Selector */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Image Selector (Images Only)
              </h2>
              <MediaSelector
                selectedMedia={selectedImages}
                onSelectionChange={setSelectedImages}
                allowedTypes={SUPPORTED_FILE_TYPES.images}
                maxFileSize={MAX_FILE_SIZES.image}
                multiple={true}
                label="Article Images"
                description="Select images for your article"
              />
            </div>

            {/* Document Selector */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Document Selector (Documents Only, Single Selection)
              </h2>
              <MediaSelector
                selectedMedia={selectedDocuments}
                onSelectionChange={setSelectedDocuments}
                allowedTypes={SUPPORTED_FILE_TYPES.documents}
                maxFileSize={MAX_FILE_SIZES.document}
                multiple={false}
                label="Article PDF"
                description="Select a PDF document for download"
              />
            </div>

            {/* Any File Selector */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Any File Selector (All Types)
              </h2>
              <MediaSelector
                selectedMedia={selectedAnyFiles}
                onSelectionChange={setSelectedAnyFiles}
                allowedTypes={SUPPORTED_FILE_TYPES.all}
                maxFileSize={MAX_FILE_SIZES.default}
                multiple={true}
                label="Media Files"
                description="Select any type of media files"
              />
            </div>

            {/* Selection Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selection Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700">Images Selected</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedImages.length}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Documents Selected</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedDocuments.length}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700">Any Files Selected</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedAnyFiles.length}
                  </p>
                </div>
              </div>
            </div>

            {/* JSON Output for Debugging */}
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
              <h4 className="text-white font-bold mb-2">Debug Output:</h4>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  images: selectedImages.map(f => ({ id: f.id, name: f.originalName })),
                  documents: selectedDocuments.map(f => ({ id: f.id, name: f.originalName })),
                  anyFiles: selectedAnyFiles.map(f => ({ id: f.id, name: f.originalName }))
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}