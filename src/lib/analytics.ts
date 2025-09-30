/**
 * Google Analytics 4 Configuration and Utilities
 * Privacy-compliant analytics implementation with consent management
 */

// GA4 Event Types
export interface GA4Event {
  event_name: string;
  event_parameters?: Record<string, any>;
}

export interface GA4PageView {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface GA4CustomEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// Analytics Configuration
export const analyticsConfig = {
  // Google Analytics 4 Measurement ID
  measurementId: process.env.NEXT_PUBLIC_GA_ID,
  
  // Privacy settings
  anonymizeIp: true,
  allowGoogleSignals: false, // Disable by default for privacy
  allowAdPersonalizationSignals: false,
  
  // Cookie settings
  cookieExpires: 63072000, // 2 years in seconds
  cookieUpdate: true,
  cookieFlags: 'SameSite=Strict;Secure',
  
  // Debug mode (only in development)
  debugMode: process.env.NODE_ENV === 'development',
  
  // Custom dimensions and metrics
  customDimensions: {
    user_type: 'custom_parameter_1',
    content_category: 'custom_parameter_2',
    engagement_level: 'custom_parameter_3'
  }
};

// Initialize Google Analytics 4
export function initializeGA4(): void {
  if (typeof window === 'undefined' || !analyticsConfig.measurementId) {
    return;
  }

  // Check for consent
  const hasConsent = getAnalyticsConsent();
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  // Make gtag globally available
  window.gtag = gtag;

  // Set up consent mode
  gtag('consent', 'default', {
    analytics_storage: hasConsent ? 'granted' : 'denied',
    ad_storage: 'denied', // We don't use advertising
    functionality_storage: 'granted',
    personalization_storage: hasConsent ? 'granted' : 'denied',
    security_storage: 'granted'
  });

  // Initialize GA4
  gtag('js', new Date());
  gtag('config', analyticsConfig.measurementId, {
    anonymize_ip: analyticsConfig.anonymizeIp,
    allow_google_signals: hasConsent && analyticsConfig.allowGoogleSignals,
    allow_ad_personalization_signals: analyticsConfig.allowAdPersonalizationSignals,
    cookie_expires: analyticsConfig.cookieExpires,
    cookie_update: analyticsConfig.cookieUpdate,
    cookie_flags: analyticsConfig.cookieFlags,
    send_page_view: false, // We'll handle page views manually
    debug_mode: analyticsConfig.debugMode
  });
}

// Load GA4 script
export function loadGA4Script(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !analyticsConfig.measurementId) {
      resolve();
      return;
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="gtag/js?id=${analyticsConfig.measurementId}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.measurementId}`;
    script.async = true;
    
    script.onload = () => {
      initializeGA4();
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Analytics script'));
    };
    
    document.head.appendChild(script);
  });
}

// Consent management
export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  
  const consent = localStorage.getItem('analytics-consent');
  return consent === 'granted';
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  
  const consentValue = granted ? 'granted' : 'denied';
  localStorage.setItem('analytics-consent', consentValue);
  localStorage.setItem('analytics-consent-timestamp', Date.now().toString());
  
  // Update GA4 consent
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: consentValue,
      personalization_storage: consentValue
    });
  }
}

// Event tracking functions
export function trackGA4Event(eventName: string, parameters: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.gtag || !getAnalyticsConsent()) {
    if (analyticsConfig.debugMode) {
      console.log('GA4 Event (not sent):', { eventName, parameters });
    }
    return;
  }

  // Clean parameters (remove undefined values)
  const cleanParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  window.gtag('event', eventName, {
    ...cleanParameters,
    timestamp: Date.now()
  });

  if (analyticsConfig.debugMode) {
    console.log('GA4 Event sent:', { eventName, parameters: cleanParameters });
  }
}

export function trackGA4PageView(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag || !getAnalyticsConsent()) {
    if (analyticsConfig.debugMode) {
      console.log('GA4 Page View (not sent):', { path, title });
    }
    return;
  }

  window.gtag('event', 'page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: path
  });

  if (analyticsConfig.debugMode) {
    console.log('GA4 Page View sent:', { path, title });
  }
}

// Enhanced event tracking for common interactions
export const ga4Events = {
  // Navigation events
  pageView: (path: string, title?: string) => {
    trackGA4PageView(path, title);
  },

  // User engagement events
  buttonClick: (buttonName: string, location: string) => {
    trackGA4Event('button_click', {
      button_name: buttonName,
      location: location,
      event_category: 'engagement'
    });
  },

  linkClick: (url: string, linkText: string, isExternal: boolean = false) => {
    trackGA4Event(isExternal ? 'external_link_click' : 'internal_link_click', {
      link_url: url,
      link_text: linkText,
      event_category: 'navigation'
    });
  },

  // Content events
  articleView: (articleId: string, articleTitle: string, category: string) => {
    trackGA4Event('article_view', {
      article_id: articleId,
      article_title: articleTitle,
      content_category: category,
      event_category: 'content'
    });
  },

  downloadFile: (fileName: string, fileType: string, fileSize?: number) => {
    trackGA4Event('file_download', {
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      event_category: 'engagement'
    });
  },

  // Search events
  search: (searchTerm: string, resultsCount: number, searchDuration: number) => {
    trackGA4Event('search', {
      search_term: searchTerm,
      results_count: resultsCount,
      search_duration: searchDuration,
      event_category: 'search'
    });
  },

  // Form events
  formStart: (formName: string) => {
    trackGA4Event('form_start', {
      form_name: formName,
      event_category: 'form'
    });
  },

  formSubmit: (formName: string, success: boolean) => {
    trackGA4Event('form_submit', {
      form_name: formName,
      success: success,
      event_category: 'form'
    });
  },

  // AI interaction events
  aiInteraction: (interactionType: string, success: boolean, duration?: number) => {
    trackGA4Event('ai_interaction', {
      interaction_type: interactionType,
      success: success,
      duration: duration,
      event_category: 'ai'
    });
  },

  // Error events
  error: (errorType: string, errorMessage: string, errorLocation: string) => {
    trackGA4Event('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation,
      event_category: 'error'
    });
  },

  // Performance events
  performanceMetric: (metricName: string, metricValue: number, metricUnit: string) => {
    trackGA4Event('performance_metric', {
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: metricUnit,
      event_category: 'performance'
    });
  }
};

// User properties
export function setGA4UserProperties(properties: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.gtag || !getAnalyticsConsent()) {
    if (analyticsConfig.debugMode) {
      console.log('GA4 User Properties (not sent):', properties);
    }
    return;
  }

  // Clean properties
  const cleanProperties = Object.entries(properties).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  window.gtag('set', 'user_properties', cleanProperties);

  if (analyticsConfig.debugMode) {
    console.log('GA4 User Properties sent:', cleanProperties);
  }
}

export function setGA4UserId(userId: string): void {
  if (typeof window === 'undefined' || !window.gtag || !analyticsConfig.measurementId || !getAnalyticsConsent()) {
    if (analyticsConfig.debugMode) {
      console.log('GA4 User ID (not sent):', userId);
    }
    return;
  }

  window.gtag('config', analyticsConfig.measurementId, {
    user_id: userId
  });

  if (analyticsConfig.debugMode) {
    console.log('GA4 User ID sent:', userId);
  }
}

// Utility functions
export function isAnalyticsEnabled(): boolean {
  return !!(analyticsConfig.measurementId && getAnalyticsConsent());
}

export function getAnalyticsDebugInfo(): Record<string, any> {
  return {
    measurementId: analyticsConfig.measurementId,
    hasConsent: getAnalyticsConsent(),
    isEnabled: isAnalyticsEnabled(),
    debugMode: analyticsConfig.debugMode,
    gtag: typeof window !== 'undefined' ? !!window.gtag : false
  };
}