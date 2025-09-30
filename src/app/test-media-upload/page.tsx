'use client';

import React, { useState } from 'react';

export default function TestMediaUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('alt', 'Test upload');

      console.log('Uploading file:', file.name, file.size, file.type);

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResult(data);
      } else {
        setError(`Upload failed: ${response.status} - ${responseText}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 Media Upload Test</h1>
          
          <div className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>

            {/* Results */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-semibold text-red-900 mb-2">Upload Error:</h3>
                <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-900 mb-2">Upload Success!</h3>
                <pre className="text-sm text-green-800 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
                {result.files && result.files[0] && (
                  <div className="mt-4">
                    <img 
                      src={result.files[0].url} 
                      alt="Uploaded file" 
                      className="max-w-xs rounded-md shadow-md"
                    />
                  </div>
                )}
              </div>
            )}

            {/* API Info */}
            <div className="p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">API Details:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Endpoint:</strong> POST /api/media</li>
                <li><strong>Field Name:</strong> files (FormData)</li>
                <li><strong>Max Size:</strong> 50MB</li>
                <li><strong>Accepted:</strong> All image types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}