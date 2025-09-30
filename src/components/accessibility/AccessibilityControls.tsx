/**
 * Accessibility Controls Component
 * Provides user controls for accessibility preferences
 * WCAG 2.1 AA Requirement: User preferences for accessibility
 */

'use client';

import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { focusVisible, touchTargets } from '@/lib/accessibility';
import { ScreenReaderOnly } from './ScreenReaderOnly';

export function AccessibilityControls() {
  const { fontSize, setFontSize, announceMessage } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleFontSizeChange = (newSize: 'normal' | 'large' | 'larger') => {
    setFontSize(newSize);
    announceMessage(`Font size changed to ${newSize}`, 'assertive');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors ${touchTargets.comfortable} ${focusVisible}`}
          aria-expanded={isOpen}
          aria-controls="accessibility-panel"
          aria-label="Accessibility settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <ScreenReaderOnly>
            {isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
          </ScreenReaderOnly>
        </button>

        {/* Accessibility Panel */}
        {isOpen && (
          <div
            id="accessibility-panel"
            className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-64"
            role="dialog"
            aria-labelledby="accessibility-panel-title"
          >
            <h3 id="accessibility-panel-title" className="text-lg font-semibold text-gray-900 mb-4">
              Accessibility Settings
            </h3>

            {/* Font Size Controls */}
            <div className="mb-4">
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </legend>
                <div className="space-y-2">
                  {[
                    { value: 'normal', label: 'Normal' },
                    { value: 'large', label: 'Large' },
                    { value: 'larger', label: 'Larger' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="font-size"
                        value={option.value}
                        checked={fontSize === option.value}
                        onChange={() => handleFontSizeChange(option.value as 'normal' | 'large' | 'larger')}
                        className={`mr-2 ${focusVisible}`}
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className={`w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium ${touchTargets.minimum} ${focusVisible}`}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}