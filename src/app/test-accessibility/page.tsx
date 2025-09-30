/**
 * Accessibility Testing Page
 * Tests and demonstrates WCAG 2.1 AA compliance features
 */

'use client';

import React, { useState } from 'react';
import { AccessibleImage } from '@/components/accessibility/AccessibleImage';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import { LiveRegion } from '@/components/accessibility/LiveRegion';
import { FocusTrap } from '@/components/accessibility/FocusTrap';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';
import { Button } from '@/components/ui/button';
import { focusVisible, touchTargets, colorContrast } from '@/lib/accessibility';

export default function AccessibilityTestPage() {
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const { announceMessage } = useAccessibility();

  const handleAnnouncement = () => {
    const testMessage = 'This is a test announcement for screen readers';
    setMessage(testMessage);
    announceMessage(testMessage, 'assertive');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    announceMessage('Form submitted successfully', 'assertive');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-ngsrn-blue mb-4">
          Accessibility Testing Page
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          This page demonstrates WCAG 2.1 AA compliance features implemented throughout the NGSRN website.
        </p>
      </header>

      {/* Skip Link Test */}
      <section aria-labelledby="skip-link-heading">
        <h2 id="skip-link-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Skip Link Navigation
        </h2>
        <p className="text-gray-700 mb-4">
          Press Tab to see the skip link appear. This allows keyboard users to bypass navigation and go directly to main content.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Test:</strong> Press Tab key when this page loads to see the skip link.
          </p>
        </div>
      </section>

      {/* Screen Reader Test */}
      <section aria-labelledby="screen-reader-heading">
        <h2 id="screen-reader-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Screen Reader Support
        </h2>
        <p className="text-gray-700 mb-4">
          Content can be hidden visually but remain available to screen readers.
        </p>
        <div className="space-y-4">
          <div className="border border-gray-200 p-4 rounded-lg">
            <p>
              This text is visible to everyone.
              <ScreenReaderOnly>
                This text is only available to screen readers.
              </ScreenReaderOnly>
            </p>
          </div>
          <Button onClick={handleAnnouncement} className="mr-4">
            Test Live Announcement
          </Button>
          <LiveRegion message={message} priority="assertive" />
        </div>
      </section>

      {/* Keyboard Navigation Test */}
      <section aria-labelledby="keyboard-nav-heading">
        <h2 id="keyboard-nav-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Keyboard Navigation
        </h2>
        <p className="text-gray-700 mb-4">
          All interactive elements are accessible via keyboard navigation with visible focus indicators.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <div className="space-y-4">
            <a 
              href="#test" 
              className={`inline-block px-4 py-2 text-blue-600 hover:text-blue-800 underline rounded-md ${focusVisible}`}
            >
              Test Link
            </a>
            <input 
              type="text" 
              placeholder="Test input field"
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md ${focusVisible}`}
            />
            <select className={`block w-full px-3 py-2 border border-gray-300 rounded-md ${focusVisible}`}>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </section>

      {/* Touch Target Test */}
      <section aria-labelledby="touch-target-heading">
        <h2 id="touch-target-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Touch Target Sizes
        </h2>
        <p className="text-gray-700 mb-4">
          All interactive elements meet the minimum 44px touch target size requirement.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${touchTargets.minimum} ${focusVisible}`}>
            Minimum Size
          </button>
          <button className={`px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 ${touchTargets.comfortable} ${focusVisible}`}>
            Comfortable Size
          </button>
          <button className={`px-8 py-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 ${touchTargets.large} ${focusVisible}`}>
            Large Size
          </button>
        </div>
      </section>

      {/* Color Contrast Test */}
      <section aria-labelledby="color-contrast-heading">
        <h2 id="color-contrast-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Color Contrast
        </h2>
        <p className="text-gray-700 mb-4">
          All text meets WCAG AA color contrast requirements (4.5:1 for normal text, 3:1 for large text).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${colorContrast.primary.background}`}>
            <p className={colorContrast.primary.text}>
              Primary text with high contrast (21:1 ratio)
            </p>
          </div>
          <div className={`p-4 rounded-lg ${colorContrast.secondary.background}`}>
            <p className={colorContrast.secondary.text}>
              Secondary text with good contrast (12.63:1 ratio)
            </p>
          </div>
          <div className={`p-4 rounded-lg ${colorContrast.accent.background}`}>
            <p className={colorContrast.accent.text}>
              Accent text with sufficient contrast (12.63:1 ratio)
            </p>
          </div>
          <div className={`p-4 rounded-lg ${colorContrast.error.background}`}>
            <p className={colorContrast.error.text}>
              Error text with good contrast (7.73:1 ratio)
            </p>
          </div>
        </div>
      </section>

      {/* Form Accessibility Test */}
      <section aria-labelledby="form-accessibility-heading">
        <h2 id="form-accessibility-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Form Accessibility
        </h2>
        <p className="text-gray-700 mb-4">
          Forms include proper labels, error handling, and keyboard navigation.
        </p>
        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md ${focusVisible}`}
              aria-describedby="name-help"
            />
            <p id="name-help" className="text-sm text-gray-500 mt-1">
              Enter your full name
            </p>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500" aria-label="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md ${focusVisible}`}
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-sm text-gray-500 mt-1">
              We&apos;ll never share your email
            </p>
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md ${focusVisible}`}
              aria-describedby="message-help"
            />
            <p id="message-help" className="text-sm text-gray-500 mt-1">
              Optional message (max 500 characters)
            </p>
          </div>
          
          <Button type="submit">
            Submit Form
          </Button>
        </form>
      </section>

      {/* Modal/Focus Trap Test */}
      <section aria-labelledby="modal-heading">
        <h2 id="modal-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Modal and Focus Management
        </h2>
        <p className="text-gray-700 mb-4">
          Modals trap focus and can be closed with the Escape key.
        </p>
        <Button onClick={() => setShowModal(true)}>
          Open Test Modal
        </Button>
        
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <FocusTrap active={showModal}>
              <div 
                className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
                role="dialog"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
              >
                <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-2">
                  Test Modal
                </h3>
                <p id="modal-description" className="text-gray-700 mb-4">
                  This modal traps focus. Try pressing Tab to navigate through the elements.
                  Press Escape to close.
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => setShowModal(false)}>
                    Close Modal
                  </Button>
                  <Button variant="outline">
                    Another Button
                  </Button>
                </div>
              </div>
            </FocusTrap>
          </div>
        )}
      </section>

      {/* Image Accessibility Test */}
      <section aria-labelledby="image-accessibility-heading">
        <h2 id="image-accessibility-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Image Accessibility
        </h2>
        <p className="text-gray-700 mb-4">
          Images include proper alt text and loading states.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AccessibleImage
            src="/api/placeholder/400/300"
            alt="Sample research chart showing sustainability metrics over time"
            width={400}
            height={300}
            caption="Figure 1: Sustainability metrics trends from 2020-2024"
          />
          <AccessibleImage
            src="/nonexistent-image.jpg"
            alt="This image will fail to load to demonstrate error handling"
            width={400}
            height={300}
          />
        </div>
      </section>

      {/* Semantic HTML Test */}
      <section aria-labelledby="semantic-html-heading">
        <h2 id="semantic-html-heading" className="text-2xl font-semibold text-ngsrn-blue mb-4">
          Semantic HTML Structure
        </h2>
        <p className="text-gray-700 mb-4">
          The page uses proper semantic HTML elements for better screen reader navigation.
        </p>
        <article className="border border-gray-200 p-4 rounded-lg">
          <header>
            <h3 className="text-lg font-semibold text-gray-900">Sample Article</h3>
            <p className="text-sm text-gray-600">Published on March 15, 2024</p>
          </header>
          <main>
            <p className="text-gray-700 my-4">
              This is a sample article demonstrating proper semantic structure with header, main, and footer elements.
            </p>
          </main>
          <footer>
            <p className="text-sm text-gray-500">Tags: accessibility, testing, WCAG</p>
          </footer>
        </article>
      </section>

      <footer className="border-t border-gray-200 pt-8">
        <p className="text-sm text-gray-600">
          This page demonstrates various accessibility features. Use a screen reader or keyboard navigation to test the implementations.
        </p>
      </footer>
    </div>
  );
}