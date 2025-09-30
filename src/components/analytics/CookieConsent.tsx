'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from './AnalyticsProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { consentToAnalytics, revokeAnalyticsConsent } = useAnalytics();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('analytics-consent');
    const consentTimestamp = localStorage.getItem('analytics-consent-timestamp');
    
    // Show banner if no consent or consent is older than 1 year
    if (!consent || !consentTimestamp) {
      setShowBanner(true);
    } else {
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      if (parseInt(consentTimestamp) < oneYearAgo) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAccept = async () => {
    setIsLoading(true);
    
    try {
      // Store consent with timestamp
      localStorage.setItem('analytics-consent-timestamp', Date.now().toString());
      
      // Grant consent to analytics
      consentToAnalytics();
      
      // Hide banner
      setShowBanner(false);
    } catch (error) {
      console.error('Error accepting analytics consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    
    try {
      // Store decline with timestamp
      localStorage.setItem('analytics-consent', 'denied');
      localStorage.setItem('analytics-consent-timestamp', Date.now().toString());
      
      // Revoke consent
      revokeAnalyticsConsent();
      
      // Hide banner
      setShowBanner(false);
    } catch (error) {
      console.error('Error declining analytics consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomize = () => {
    // For now, just show the accept/decline options
    // In a full implementation, this could open a detailed preferences modal
    console.log('Cookie customization not implemented yet');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/20 to-transparent">
      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              We value your privacy
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze site usage, 
              and assist with our marketing efforts. This includes Google Analytics to help us understand 
              how visitors interact with our website. You can choose to accept or decline these analytics cookies.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Essential cookies for site functionality are always enabled. 
              <a 
                href="/legal/privacy" 
                className="text-blue-600 hover:text-blue-800 underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about our privacy practices
              </a>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              disabled={isLoading}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Decline Analytics
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomize}
              disabled={isLoading}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Customize
            </Button>
            
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Processing...' : 'Accept Analytics'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Privacy settings component for user preferences
export function PrivacySettings() {
  const [currentConsent, setCurrentConsent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { consentToAnalytics, revokeAnalyticsConsent } = useAnalytics();

  useEffect(() => {
    const consent = localStorage.getItem('analytics-consent');
    setCurrentConsent(consent);
  }, []);

  const handleToggleConsent = async () => {
    setIsLoading(true);
    
    try {
      if (currentConsent === 'granted') {
        localStorage.setItem('analytics-consent-timestamp', Date.now().toString());
        revokeAnalyticsConsent();
        setCurrentConsent('denied');
      } else {
        localStorage.setItem('analytics-consent-timestamp', Date.now().toString());
        consentToAnalytics();
        setCurrentConsent('granted');
      }
    } catch (error) {
      console.error('Error toggling analytics consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Privacy Settings
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
            <p className="text-sm text-gray-600 mt-1">
              Help us understand how visitors interact with our website through Google Analytics.
            </p>
          </div>
          
          <Button
            variant={currentConsent === 'granted' ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleConsent}
            disabled={isLoading}
            className="ml-4"
          >
            {isLoading ? 'Updating...' : currentConsent === 'granted' ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Essential Cookies</h4>
            <p className="text-sm text-gray-600 mt-1">
              Required for basic site functionality. These cannot be disabled.
            </p>
          </div>
          
          <Button
            variant="default"
            size="sm"
            disabled
            className="ml-4"
          >
            Always Enabled
          </Button>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Changes take effect immediately. For more information about our data practices, 
          please review our{' '}
          <a 
            href="/legal/privacy" 
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>.
        </p>
      </div>
    </Card>
  );
}