'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { loadGA4Script, initializeGA4, analyticsConfig } from '@/lib/analytics';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || analyticsConfig.measurementId;

  useEffect(() => {
    // Initialize GA4 when component mounts
    if (gaId && typeof window !== 'undefined') {
      initializeGA4();
    }
  }, [gaId]);

  // Don't render in development or if no measurement ID
  if (process.env.NODE_ENV === 'development' || !gaId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize GA4 after script loads
          initializeGA4();
        }}
      />
      
      {/* GA4 Configuration Script */}
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Set up consent mode first
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              functionality_storage: 'granted',
              personalization_storage: 'denied',
              security_storage: 'granted'
            });
            
            // Initialize GA4
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
              cookie_expires: 63072000,
              cookie_update: true,
              cookie_flags: 'SameSite=Strict;Secure',
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

// Enhanced Google Analytics component with privacy controls
export function GoogleAnalyticsWithConsent({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || analyticsConfig.measurementId;

  useEffect(() => {
    // Check for existing consent and update GA4 accordingly
    const checkConsent = () => {
      if (typeof window === 'undefined' || !window.gtag) return;
      
      const consent = localStorage.getItem('analytics-consent');
      if (consent === 'granted') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          personalization_storage: 'granted'
        });
      }
    };

    // Check consent after a short delay to ensure GA4 is loaded
    const timer = setTimeout(checkConsent, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Don't render if no measurement ID
  if (!gaId) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics measurementId={gaId} />
      
      {/* Additional privacy-focused configuration */}
      <Script
        id="ga4-privacy-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Enhanced privacy configuration
            if (typeof gtag !== 'undefined') {
              // Disable automatic page view tracking
              gtag('config', '${gaId}', {
                send_page_view: false,
                custom_map: {
                  'custom_parameter_1': 'user_type',
                  'custom_parameter_2': 'content_category',
                  'custom_parameter_3': 'engagement_level'
                }
              });
              
              // Set up enhanced measurement controls
              gtag('config', '${gaId}', {
                enhanced_measurement: {
                  scrolls: true,
                  outbound_clicks: true,
                  site_search: false, // We handle this manually
                  video_engagement: true,
                  file_downloads: true
                }
              });
            }
          `,
        }}
      />
    </>
  );
}