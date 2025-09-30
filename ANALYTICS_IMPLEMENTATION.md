# Google Analytics 4 Implementation Guide

## Overview

This document describes the Google Analytics 4 (GA4) implementation for the NGSRN website, including privacy-compliant tracking, consent management, and event configuration.

## Features Implemented

### 1. Privacy-Compliant Analytics
- **Consent Management**: Users can grant or revoke analytics consent
- **Cookie Consent Banner**: GDPR/CCPA compliant consent interface
- **Anonymized IP**: All tracking anonymizes user IP addresses
- **No Ad Personalization**: Advertising features are disabled
- **Secure Cookies**: SameSite=Strict and Secure flags enabled

### 2. Event Tracking
- **Page Views**: Automatic tracking of page navigation
- **User Interactions**: Button clicks, form submissions, downloads
- **Search Events**: Search queries with results and performance metrics
- **AI Interactions**: AI assistant usage tracking
- **Custom Events**: Flexible event tracking system
- **Error Tracking**: Client-side error monitoring

### 3. Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Page Load Performance**: Navigation timing metrics
- **API Performance**: Request duration and success rates
- **User Engagement**: Session duration and interaction depth

## Configuration

### Environment Variables

Add the following to your environment configuration:

```bash
# Google Analytics 4 Measurement ID
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### Vercel Deployment

1. **Add Environment Variable**:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add `NEXT_PUBLIC_GA_ID` with your GA4 measurement ID

2. **Create GA4 Property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property for your website
   - Copy the measurement ID (format: G-XXXXXXXXXX)

## Usage Examples

### Basic Event Tracking

```typescript
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

function MyComponent() {
  const analytics = useAnalytics();

  const handleButtonClick = () => {
    analytics.trackEvent('button_click', {
      button_name: 'Subscribe',
      location: 'header',
      category: 'engagement'
    });
  };

  return <button onClick={handleButtonClick}>Subscribe</button>;
}
```

### Enhanced Tracking Hook

```typescript
import { useAnalyticsTracking } from '@/components/analytics/AnalyticsProvider';

function MyComponent() {
  const tracking = useAnalyticsTracking();

  const handleDownload = () => {
    tracking.trackDownload('research-paper.pdf', 'pdf');
  };

  const handleExternalLink = () => {
    tracking.trackExternalLink('https://example.com', 'External Resource');
  };

  return (
    <div>
      <button onClick={handleDownload}>Download PDF</button>
      <a href="https://example.com" onClick={handleExternalLink}>
        External Link
      </a>
    </div>
  );
}
```

### User Identification

```typescript
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

function UserProfile({ user }) {
  const analytics = useAnalytics();

  useEffect(() => {
    if (user?.id) {
      analytics.setUserId(user.id);
      analytics.setUserProperties({
        user_type: user.role,
        engagement_level: user.activityLevel,
        content_category: user.interests
      });
    }
  }, [user, analytics]);

  return <div>User Profile</div>;
}
```

## Event Categories

### Standard Events

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `page_view` | Page navigation | `page_title`, `page_path` |
| `button_click` | Button interactions | `button_name`, `location` |
| `form_submit` | Form submissions | `form_name`, `success` |
| `search` | Search queries | `search_term`, `results_count` |
| `file_download` | File downloads | `file_name`, `file_type` |
| `external_link_click` | External links | `link_url`, `link_text` |
| `ai_interaction` | AI assistant usage | `interaction_type`, `success` |

### Custom Events

```typescript
// Research-specific events
analytics.trackEvent('research_paper_view', {
  paper_id: 'paper-123',
  paper_title: 'Sustainable Development in Africa',
  category: 'research',
  division: 'environmental'
});

// Newsletter subscription
analytics.trackEvent('newsletter_signup', {
  source: 'homepage',
  category: 'conversion'
});

// Contact form
analytics.trackEvent('contact_form_submit', {
  inquiry_type: 'research_collaboration',
  success: true,
  category: 'lead_generation'
});
```

## Privacy Compliance

### Consent Management

The implementation includes a comprehensive consent management system:

1. **Cookie Banner**: Appears on first visit
2. **Consent Storage**: Preferences stored locally
3. **Consent Updates**: Users can change preferences anytime
4. **Automatic Expiry**: Consent expires after 1 year

### Privacy Settings Page

Users can manage their privacy preferences:

```typescript
import { PrivacySettings } from '@/components/analytics/CookieConsent';

function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Settings</h1>
      <PrivacySettings />
    </div>
  );
}
```

### GDPR Compliance Features

- **Opt-in Consent**: Analytics disabled by default
- **Granular Control**: Separate consent for different tracking types
- **Data Minimization**: Only essential data collected
- **Right to Withdraw**: Easy consent revocation
- **Transparent Information**: Clear privacy policy links

## Testing

### Development Testing

In development mode, analytics events are logged to the console:

```bash
npm run dev
# Navigate to /test-analytics to test implementation
```

### Production Testing

1. **Deploy to Vercel** with GA4 measurement ID
2. **Grant consent** using the cookie banner
3. **Trigger events** through user interactions
4. **Verify in GA4** real-time reports

### Test Page

Visit `/test-analytics` to access the comprehensive testing interface:

- Event tracking verification
- Consent management testing
- Debug information display
- Privacy controls testing

## Performance Considerations

### Script Loading

- **Async Loading**: GA4 script loads asynchronously
- **DNS Prefetch**: Preconnect to Google Analytics domains
- **Consent-Based Loading**: Scripts only active with consent
- **Error Handling**: Graceful fallback if scripts fail

### Data Efficiency

- **Event Batching**: Multiple events sent together
- **Parameter Optimization**: Minimal data transmission
- **Caching**: Consent preferences cached locally
- **Conditional Loading**: Analytics only in production

## Monitoring and Debugging

### Debug Mode

Enable debug mode in development:

```typescript
import { getAnalyticsDebugInfo } from '@/lib/analytics';

const debugInfo = getAnalyticsDebugInfo();
console.log('Analytics Debug:', debugInfo);
```

### Common Issues

1. **Events Not Appearing**: Check consent status and measurement ID
2. **Console Errors**: Verify script loading and network connectivity
3. **Missing Data**: Ensure events are properly formatted
4. **Privacy Violations**: Review consent implementation

### GA4 Real-Time Reports

Monitor events in Google Analytics:
1. Go to Reports > Real-time
2. Trigger events on your site
3. Verify events appear within 30 seconds

## Advanced Configuration

### Custom Dimensions

Configure custom dimensions in GA4:

```typescript
// Set up custom dimensions in GA4 dashboard
// Then use in events:
analytics.trackEvent('custom_event', {
  custom_parameter_1: 'user_type',
  custom_parameter_2: 'content_category',
  custom_parameter_3: 'engagement_level'
});
```

### Enhanced Measurement

GA4 automatically tracks:
- Scrolls (90% depth)
- Outbound clicks
- Site search (disabled - we handle manually)
- Video engagement
- File downloads

### Conversion Tracking

Set up conversion events:

```typescript
analytics.trackConversion('newsletter_signup', 1, 'USD');
analytics.trackConversion('contact_form_complete');
```

## Security Considerations

### Data Protection

- **No PII Collection**: Personal information excluded from tracking
- **Secure Transmission**: HTTPS-only data transfer
- **Access Controls**: Limited GA4 account access
- **Data Retention**: Automatic data expiration configured

### Content Security Policy

Add GA4 domains to CSP:

```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://analytics.google.com;
```

## Maintenance

### Regular Tasks

1. **Review Events**: Monthly event analysis
2. **Update Consent**: Annual consent renewal prompts
3. **Performance Check**: Quarterly performance review
4. **Privacy Audit**: Semi-annual privacy compliance review

### Updates and Changes

- **GA4 Updates**: Monitor Google Analytics release notes
- **Consent Laws**: Stay updated on privacy regulations
- **Performance Impact**: Regular performance monitoring
- **User Feedback**: Collect feedback on privacy experience

## Support and Resources

### Documentation
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Privacy and Compliance](https://support.google.com/analytics/topic/2919631)
- [Event Tracking Guide](https://developers.google.com/analytics/devguides/collection/ga4/events)

### Tools
- [GA4 Event Builder](https://ga-dev-tools.web.app/ga4/event-builder/)
- [Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)

### Contact
For questions about the analytics implementation, contact the development team or refer to the project documentation.