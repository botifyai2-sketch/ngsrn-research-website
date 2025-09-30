'use client';

import { useState } from 'react';
import { useAnalytics, useAnalyticsTracking } from '@/components/analytics/AnalyticsProvider';
import { PrivacySettings } from '@/components/analytics/CookieConsent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAnalyticsDebugInfo, isAnalyticsEnabled } from '@/lib/analytics';

export default function TestAnalyticsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  const analytics = useAnalytics();
  const tracking = useAnalyticsTracking();

  const addToLog = (message: string) => {
    setEventLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleTestEvent = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        analytics.trackPageView('/test-analytics', 'Analytics Test Page');
        addToLog('Page view tracked');
        break;
        
      case 'button_click':
        tracking.trackButtonClick('Test Button', 'Analytics Test Page');
        addToLog('Button click tracked');
        break;
        
      case 'search':
        analytics.trackSearch('test query', 5, 250);
        addToLog('Search event tracked');
        break;
        
      case 'ai_interaction':
        analytics.trackAIInteraction('question', true);
        addToLog('AI interaction tracked');
        break;
        
      case 'form_submit':
        tracking.trackFormSubmission('Test Form', true);
        addToLog('Form submission tracked');
        break;
        
      case 'download':
        tracking.trackDownload('test-file.pdf', 'pdf');
        addToLog('Download tracked');
        break;
        
      case 'external_link':
        tracking.trackExternalLink('https://example.com', 'Example Link');
        addToLog('External link tracked');
        break;
        
      case 'custom_event':
        analytics.trackEvent('custom_test_event', {
          category: 'test',
          action: 'custom_action',
          label: 'test_label',
          value: 42,
          custom_parameter_1: 'test_value'
        });
        addToLog('Custom event tracked');
        break;
        
      default:
        addToLog('Unknown event type');
    }
  };

  const handleSetUserId = () => {
    const userId = `test_user_${Date.now()}`;
    analytics.setUserId(userId);
    addToLog(`User ID set: ${userId}`);
  };

  const handleSetUserProperties = () => {
    analytics.setUserProperties({
      user_type: 'test_user',
      engagement_level: 'high',
      content_category: 'analytics_testing'
    });
    addToLog('User properties set');
  };

  const handleGetDebugInfo = () => {
    const info = getAnalyticsDebugInfo();
    setDebugInfo(info);
    addToLog('Debug info retrieved');
  };

  const handleConsentGrant = () => {
    analytics.consentToAnalytics();
    addToLog('Analytics consent granted');
  };

  const handleConsentRevoke = () => {
    analytics.revokeAnalyticsConsent();
    addToLog('Analytics consent revoked');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Google Analytics 4 Test Page
        </h1>
        <p className="text-gray-600">
          Test Google Analytics 4 integration, event tracking, and privacy compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analytics Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Analytics Status</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Analytics Enabled:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isAnalyticsEnabled() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isAnalyticsEnabled() ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Environment:</span>
              <span className="text-sm text-gray-600">
                {process.env.NODE_ENV}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">GA4 ID:</span>
              <span className="text-sm text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_GA_ID || 'Not set'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button 
              onClick={handleGetDebugInfo}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Get Debug Info
            </Button>
            
            {debugInfo && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </Card>

        {/* Event Testing */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Event Testing</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button 
              onClick={() => handleTestEvent('page_view')}
              variant="outline" 
              size="sm"
            >
              Page View
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('button_click')}
              variant="outline" 
              size="sm"
            >
              Button Click
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('search')}
              variant="outline" 
              size="sm"
            >
              Search
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('ai_interaction')}
              variant="outline" 
              size="sm"
            >
              AI Interaction
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('form_submit')}
              variant="outline" 
              size="sm"
            >
              Form Submit
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('download')}
              variant="outline" 
              size="sm"
            >
              Download
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('external_link')}
              variant="outline" 
              size="sm"
            >
              External Link
            </Button>
            
            <Button 
              onClick={() => handleTestEvent('custom_event')}
              variant="outline" 
              size="sm"
            >
              Custom Event
            </Button>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleSetUserId}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Set User ID
            </Button>
            
            <Button 
              onClick={handleSetUserProperties}
              variant="outline" 
              size="sm"
              className="w-full"
            >
              Set User Properties
            </Button>
          </div>
        </Card>

        {/* Privacy Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Privacy Controls</h2>
          
          <div className="space-y-2 mb-4">
            <Button 
              onClick={handleConsentGrant}
              variant="default" 
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Grant Analytics Consent
            </Button>
            
            <Button 
              onClick={handleConsentRevoke}
              variant="outline" 
              size="sm"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              Revoke Analytics Consent
            </Button>
          </div>

          <div className="mt-4">
            <PrivacySettings />
          </div>
        </Card>

        {/* Event Log */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Event Log</h2>
          
          <div className="bg-gray-50 rounded p-3 h-64 overflow-y-auto">
            {eventLog.length === 0 ? (
              <p className="text-gray-500 text-sm">No events logged yet...</p>
            ) : (
              <div className="space-y-1">
                {eventLog.map((log, index) => (
                  <div key={index} className="text-xs text-gray-700 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => setEventLog([])}
            variant="outline" 
            size="sm"
            className="w-full mt-3"
          >
            Clear Log
          </Button>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        
        <div className="prose prose-sm max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              <strong>Set up Google Analytics:</strong> Add your GA4 measurement ID to the 
              <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GA_ID</code> environment variable.
            </li>
            <li>
              <strong>Grant consent:</strong> Use the "Grant Analytics Consent" button to enable tracking.
            </li>
            <li>
              <strong>Test events:</strong> Click the various event buttons to send test data to GA4.
            </li>
            <li>
              <strong>Check GA4:</strong> View your Google Analytics 4 dashboard to see the events in real-time.
            </li>
            <li>
              <strong>Test privacy:</strong> Revoke consent and verify that events are no longer sent.
            </li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> In development mode, analytics events are logged to the console 
              instead of being sent to Google Analytics. Set NODE_ENV to production to test actual tracking.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}