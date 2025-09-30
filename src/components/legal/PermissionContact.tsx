'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { EnvelopeIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PermissionContactProps {
  className?: string;
  variant?: 'card' | 'inline' | 'modal';
  showForm?: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  organization: string;
  contentTitle: string;
  intendedUse: string;
  message: string;
}

export const PermissionContact: React.FC<PermissionContactProps> = ({
  className,
  variant = 'card',
  showForm = false
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    organization: '',
    contentTitle: '',
    intendedUse: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(showForm);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      organization: '',
      contentTitle: '',
      intendedUse: '',
      message: ''
    });
    setIsSubmitting(false);
    alert('Permission request submitted successfully. We will respond within 2-3 business days.');
  };

  if (variant === 'inline') {
    return (
      <div className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
        <p>
          For permission requests, contact us at{' '}
          <a 
            href="mailto:permissions@ngsrn.org" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            permissions@ngsrn.org
          </a>{' '}
          or{' '}
          <button
            onClick={() => setShowContactForm(true)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            use our contact form
          </button>.
        </p>
      </div>
    );
  }

  const cardClasses = variant === 'card' 
    ? "bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
    : "p-4";

  return (
    <div className={cn(cardClasses, className)}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Request Permission
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Need permission to use NGSRN content? Contact our permissions team for authorization.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Contact Information
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email
                </p>
                <a 
                  href="mailto:permissions@ngsrn.org"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  permissions@ngsrn.org
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Phone
                </p>
                <a 
                  href="tel:+1234567890"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  +1 (234) 567-8900
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Response Time
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  2-3 business days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Tip:</strong> Include specific details about your intended use to expedite the review process.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          {!showContactForm ? (
            <div className="text-center">
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Open Contact Form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="contentTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content Title *
                </label>
                <input
                  type="text"
                  id="contentTitle"
                  name="contentTitle"
                  required
                  value={formData.contentTitle}
                  onChange={handleInputChange}
                  placeholder="Title of the article or content you want to use"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Intended Use *
                </label>
                <select
                  id="intendedUse"
                  name="intendedUse"
                  required
                  value={formData.intendedUse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select intended use</option>
                  <option value="academic">Academic Research</option>
                  <option value="policy">Policy Development</option>
                  <option value="commercial">Commercial Use</option>
                  <option value="media">Media/Journalism</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Details *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please provide details about how you plan to use the content..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionContact;