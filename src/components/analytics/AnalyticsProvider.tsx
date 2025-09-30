'use client';

import { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { monitoring } from '@/lib/monitoring';

interface AnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackPageView: (path?: string, title?: string) => void;
  trackSearch: (query: string, results: number, duration: number) => void;
  trackAIInteraction: (type: 'question' | 'summary' | 'explanation', success: boolean) => void;
  trackConversion: (eventName: string, value?: number, currency?: string) => void;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  consentToAnalytics: () => void;
  revokeAnalyticsConsent: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  userId?: string;
}

// Privacy-compliant analytics with consent management
export function AnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Google Analytics 4
  const initializeGA4 = useCallback(() => {
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_GA_ID) return;

    // Check for existing consent
    const hasConsent = localStorage.getItem('analytics-consent') === 'granted';
    
    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;

      // Configure consent mode
      gtag('consent', 'default', {
        analytics_storage: hasConsent ? 'granted' : 'denied',
        ad_storage: 'denied', // We don't use ads
        functionality_storage: 'granted',
        personalization_storage: hasConsent ? 'granted' : 'denied',
        security_storage: 'granted'
      });

      // Initialize GA4
      gtag('js', new Date());
      gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true, // Privacy compliance
        allow_google_signals: hasConsent,
        allow_ad_personalization_signals: false,
        cookie_expires: 63072000, // 2 years in seconds
        send_page_view: false // We'll handle page views manually
      });

      // Set user ID if provided
      if (userId) {
        gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          user_id: userId
        });
      }
    };
  }, [userId]);

  useEffect(() => {
    // Skip analytics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics disabled in development mode');
      return;
    }

    initializeGA4();

    // Set user ID in monitoring service
    if (userId) {
      monitoring.setUserId(userId);
    }
  }, [userId, initializeGA4]);

  // Track page views automatically on route changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url, document.title);
  }, [pathname, searchParams]);

  // Analytics methods
  const trackEvent = useCallback((eventName: string, parameters: Record<string, any> = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', { eventName, parameters });
      return;
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        ...parameters,
        timestamp: Date.now()
      });
    }

    // Send to monitoring service for internal tracking
    monitoring.trackEvent({
      event: eventName,
      category: parameters.category || 'general',
      action: parameters.action || eventName,
      label: parameters.label,
      value: parameters.value
    });
  }, []);

  const trackPageView = useCallback((path?: string, title?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Page View:', { path, title });
      return;
    }

    const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    const currentTitle = title || (typeof document !== 'undefined' ? document.title : '');

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: currentTitle,
        page_location: window.location.href,
        page_path: currentPath
      });
    }

    // Send to monitoring service
    monitoring.trackPageView(currentPath);
  }, []);

  const trackSearch = useCallback((query: string, results: number, duration: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Search:', { query, results, duration });
      return;
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: query,
        results_count: results,
        search_duration: duration,
        engagement_time_msec: duration
      });
    }

    // Send to monitoring service
    monitoring.trackSearchQuery(query, results, duration);
  }, []);

  const trackAIInteraction = useCallback((type: 'question' | 'summary' | 'explanation', success: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics AI Interaction:', { type, success });
      return;
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ai_interaction', {
        interaction_type: type,
        success: success,
        custom_parameter_1: type,
        custom_parameter_2: success ? 'success' : 'failure'
      });
    }

    // Send to monitoring service
    monitoring.trackAIInteraction(type, success);
  }, []);

  const trackConversion = useCallback((eventName: string, value?: number, currency: string = 'USD') => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Conversion:', { eventName, value, currency });
      return;
    }

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        currency: currency,
        value: value || 0,
        event_category: 'conversion'
      });
    }

    // Send to monitoring service
    monitoring.trackEvent({
      event: eventName,
      category: 'conversion',
      action: eventName,
      value: value
    });
  }, []);

  const setUserId = useCallback((userId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics User ID:', userId);
      return;
    }

    // Set in Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        user_id: userId
      });
    }

    // Set in monitoring service
    monitoring.setUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics User Properties:', properties);
      return;
    }

    // Set in Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_properties', properties);
    }
  }, []);

  const consentToAnalytics = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Store consent
    localStorage.setItem('analytics-consent', 'granted');

    // Update Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        personalization_storage: 'granted'
      });
    }

    // Re-initialize if needed
    if (!window.gtag) {
      initializeGA4();
    }
  }, [initializeGA4]);

  const revokeAnalyticsConsent = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Remove consent
    localStorage.setItem('analytics-consent', 'denied');

    // Update Google Analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        personalization_storage: 'denied'
      });
    }
  }, []);

  const value: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackSearch,
    trackAIInteraction,
    trackConversion,
    setUserId,
    setUserProperties,
    consentToAnalytics,
    revokeAnalyticsConsent
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Privacy-compliant analytics hook for components
export function useAnalyticsTracking() {
  const analytics = useAnalytics();
  
  return {
    // Common tracking methods with privacy considerations
    trackButtonClick: (buttonName: string, location: string) => {
      analytics.trackEvent('button_click', {
        button_name: buttonName,
        location: location,
        category: 'engagement'
      });
    },
    
    trackFormSubmission: (formName: string, success: boolean) => {
      analytics.trackEvent('form_submit', {
        form_name: formName,
        success: success,
        category: 'conversion'
      });
    },
    
    trackDownload: (fileName: string, fileType: string) => {
      analytics.trackEvent('file_download', {
        file_name: fileName,
        file_type: fileType,
        category: 'engagement'
      });
    },
    
    trackExternalLink: (url: string, linkText: string) => {
      analytics.trackEvent('external_link_click', {
        link_url: url,
        link_text: linkText,
        category: 'engagement'
      });
    },
    
    trackVideoPlay: (videoTitle: string, duration?: number) => {
      analytics.trackEvent('video_play', {
        video_title: videoTitle,
        video_duration: duration,
        category: 'engagement'
      });
    },
    
    trackScrollDepth: (depth: number, page: string) => {
      analytics.trackEvent('scroll_depth', {
        scroll_depth: depth,
        page: page,
        category: 'engagement'
      });
    }
  };
}

// Declare global types for analytics services
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    hj: (...args: any[]) => void;
  }
}