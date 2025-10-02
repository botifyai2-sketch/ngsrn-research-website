/**
 * Monitoring and Error Tracking Library
 * Centralized monitoring setup for error tracking, performance monitoring, and analytics
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

// Types
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
  url: string;
  sessionId: string;
}

interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string>;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;
  private originalFetch: typeof fetch;

  constructor() {
    this.sessionId = this.generateSessionId();
    // Only access window.fetch on the client side
    this.originalFetch = typeof window !== 'undefined' ? window.fetch : fetch;
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    // Skip monitoring in development to prevent issues
    if (process.env.NODE_ENV === 'development') {
      console.log('Monitoring disabled in development mode');
      return;
    }

    // Set up global error handlers
    this.setupErrorHandlers();
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    // Set up user session tracking
    this.setupSessionTracking();
    
    this.isInitialized = true;
  }

  private setupErrorHandlers() {
    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        sessionId: this.sessionId,
        userId: this.userId
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        sessionId: this.sessionId,
        userId: this.userId,
        additionalData: { type: 'unhandledrejection' }
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Web Vitals monitoring
    onCLS(this.reportWebVital.bind(this));
    onINP(this.reportWebVital.bind(this));
    onFCP(this.reportWebVital.bind(this));
    onLCP(this.reportWebVital.bind(this));
    onTTFB(this.reportWebVital.bind(this));

    // Custom performance monitoring
    this.monitorPageLoad();
    this.monitorAPIRequests();
  }

  private setupSessionTracking() {
    // Track page views
    this.trackPageView();
    
    // Track user interactions
    this.setupInteractionTracking();
    
    // Track session duration
    this.trackSessionDuration();
  }

  private reportWebVital(metric: any) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date(),
      url: window.location.href,
      sessionId: this.sessionId
    };

    this.sendPerformanceMetric(performanceMetric);
  }

  private monitorPageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.fetchStart
          };

          Object.entries(metrics).forEach(([name, value]) => {
            this.sendPerformanceMetric({
              name: `page_load_${name}`,
              value,
              rating: value < 1000 ? 'good' : value < 2500 ? 'needs-improvement' : 'poor',
              timestamp: new Date(),
              url: window.location.href,
              sessionId: this.sessionId
            });
          });
        }
      }, 0);
    });
  }

  private monitorAPIRequests() {
    // Intercept fetch requests
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      
      // Skip monitoring for monitoring API endpoints to prevent infinite loops
      if (url.includes('/api/monitoring/')) {
        return this.originalFetch(...args);
      }
      
      try {
        const response = await this.originalFetch(...args);
        const endTime = performance.now();
        
        this.trackAPIRequest({
          url,
          method: (args[1]?.method || 'GET') as string,
          status: response.status,
          duration: endTime - startTime,
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        this.trackAPIRequest({
          url,
          method: (args[1]?.method || 'GET') as string,
          status: 0,
          duration: endTime - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    };
  }

  private setupInteractionTracking() {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('button, a, [role="button"]')) {
        this.trackEvent({
          event: 'click',
          category: 'interaction',
          action: 'click',
          label: target.textContent?.trim() || target.getAttribute('aria-label') || 'unknown',
          customDimensions: {
            element_type: target.tagName.toLowerCase(),
            element_id: target.id || '',
            element_class: target.className || ''
          }
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      this.trackEvent({
        event: 'form_submit',
        category: 'interaction',
        action: 'submit',
        label: form.id || form.className || 'unknown_form'
      });
    });
  }

  private trackSessionDuration() {
    const startTime = Date.now();
    
    const trackDuration = () => {
      const duration = Date.now() - startTime;
      this.sendAnalytics({
        event: 'session_duration',
        category: 'engagement',
        action: 'session_end',
        value: Math.round(duration / 1000) // Convert to seconds
      });
    };

    window.addEventListener('beforeunload', trackDuration);
    
    // Also track every 30 seconds for active sessions
    setInterval(() => {
      const duration = Date.now() - startTime;
      this.sendAnalytics({
        event: 'session_heartbeat',
        category: 'engagement',
        action: 'session_active',
        value: Math.round(duration / 1000)
      });
    }, 30000);
  }

  // Public methods
  public setUserId(userId: string) {
    this.userId = userId;
  }

  public reportError(error: ErrorReport) {
    // Send to error tracking service
    this.sendToErrorService(error);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error);
    }
  }

  public trackEvent(event: AnalyticsEvent) {
    this.sendAnalytics(event);
  }

  public trackPageView(path?: string) {
    const url = path || window.location.pathname;
    
    this.sendAnalytics({
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      label: url,
      customDimensions: {
        page_title: document.title,
        referrer: document.referrer
      }
    });
  }

  public trackAPIRequest(request: {
    url: string;
    method: string;
    status: number;
    duration: number;
    success: boolean;
    error?: string;
  }) {
    this.sendAnalytics({
      event: 'api_request',
      category: 'performance',
      action: request.method.toLowerCase(),
      label: request.url,
      value: Math.round(request.duration),
      customDimensions: {
        status: request.status.toString(),
        success: request.success.toString(),
        error: request.error || ''
      }
    });
  }

  public trackSearchQuery(query: string, results: number, duration: number) {
    this.sendAnalytics({
      event: 'search',
      category: 'search',
      action: 'query',
      label: query,
      value: results,
      customDimensions: {
        query_length: query.length.toString(),
        duration: duration.toString()
      }
    });
  }

  public trackAIInteraction(type: 'question' | 'summary' | 'explanation', success: boolean) {
    this.sendAnalytics({
      event: 'ai_interaction',
      category: 'ai',
      action: type,
      label: success ? 'success' : 'failure',
      customDimensions: {
        success: success.toString()
      }
    });
  }

  // Private methods for sending data
  private async sendToErrorService(error: ErrorReport) {
    try {
      // Use the original fetch to avoid infinite loops
      await this.originalFetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silently fail to prevent console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send error report:', e);
      }
    }
  }

  private async sendPerformanceMetric(metric: PerformanceMetric) {
    try {
      // Use the original fetch to avoid infinite loops
      await this.originalFetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
    } catch (e) {
      // Silently fail to prevent console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send performance metric:', e);
      }
    }
  }

  private async sendAnalytics(event: AnalyticsEvent) {
    try {
      // Use the original fetch to avoid infinite loops
      await this.originalFetch('/api/monitoring/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: new Date(),
          url: window.location.href
        })
      });

      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_map: event.customDimensions
        });
      }
    } catch (e) {
      // Silently fail to prevent console spam
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send analytics event:', e);
      }
    }
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Export types for use in other files
export type { ErrorReport, PerformanceMetric, AnalyticsEvent };