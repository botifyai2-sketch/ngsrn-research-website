# NGSRN Website Accessibility Compliance

This document outlines the accessibility features implemented in the NGSRN website to ensure WCAG 2.1 AA compliance.

## Overview

The NGSRN website has been designed and developed with accessibility as a core principle, ensuring that all users, including those with disabilities, can access and interact with our research content effectively.

## WCAG 2.1 AA Compliance

### 1. Perceivable

#### 1.1 Text Alternatives
- **1.1.1 Non-text Content**: All images include appropriate alt text or are marked as decorative
- Implemented via `AccessibleImage` component with alt text validation
- Decorative images use `alt=""` or `aria-hidden="true"`

#### 1.2 Time-based Media
- **1.2.1 Audio-only and Video-only**: Transcripts provided for audio content
- **1.2.2 Captions**: Captions provided for video content when applicable

#### 1.3 Adaptable
- **1.3.1 Info and Relationships**: Semantic HTML structure with proper headings, lists, and landmarks
- **1.3.2 Meaningful Sequence**: Logical reading order maintained
- **1.3.3 Sensory Characteristics**: Instructions don't rely solely on sensory characteristics

#### 1.4 Distinguishable
- **1.4.1 Use of Color**: Information not conveyed by color alone
- **1.4.2 Audio Control**: Audio controls provided when applicable
- **1.4.3 Contrast (Minimum)**: 4.5:1 contrast ratio for normal text, 3:1 for large text
- **1.4.4 Resize Text**: Text can be resized up to 200% without loss of functionality
- **1.4.5 Images of Text**: Text used instead of images of text where possible

### 2. Operable

#### 2.1 Keyboard Accessible
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap**: Focus can move away from any component
- **2.1.4 Character Key Shortcuts**: No character key shortcuts that conflict with assistive technology

#### 2.2 Enough Time
- **2.2.1 Timing Adjustable**: Users can extend time limits
- **2.2.2 Pause, Stop, Hide**: Users can control moving content

#### 2.3 Seizures and Physical Reactions
- **2.3.1 Three Flashes or Below Threshold**: No content flashes more than three times per second

#### 2.4 Navigable
- **2.4.1 Bypass Blocks**: Skip links provided to bypass navigation
- **2.4.2 Page Titled**: Descriptive page titles provided
- **2.4.3 Focus Order**: Logical focus order maintained
- **2.4.4 Link Purpose**: Link purposes clear from context
- **2.4.5 Multiple Ways**: Multiple ways to locate pages (navigation, search, sitemap)
- **2.4.6 Headings and Labels**: Descriptive headings and labels provided
- **2.4.7 Focus Visible**: Keyboard focus indicators visible

### 3. Understandable

#### 3.1 Readable
- **3.1.1 Language of Page**: Page language identified (`lang="en"`)
- **3.1.2 Language of Parts**: Language changes identified when applicable

#### 3.2 Predictable
- **3.2.1 On Focus**: No unexpected context changes on focus
- **3.2.2 On Input**: No unexpected context changes on input
- **3.2.3 Consistent Navigation**: Navigation consistent across pages
- **3.2.4 Consistent Identification**: Components with same functionality identified consistently

#### 3.3 Input Assistance
- **3.3.1 Error Identification**: Errors clearly identified
- **3.3.2 Labels or Instructions**: Labels and instructions provided for user input
- **3.3.3 Error Suggestion**: Error correction suggestions provided
- **3.3.4 Error Prevention**: Error prevention for important data

### 4. Robust

#### 4.1 Compatible
- **4.1.1 Parsing**: Valid HTML markup used
- **4.1.2 Name, Role, Value**: Proper ARIA attributes for custom components
- **4.1.3 Status Messages**: Status messages announced to screen readers

## Implementation Details

### Components

#### Accessibility Components
- `SkipLink`: Provides skip navigation functionality
- `ScreenReaderOnly`: Hides content visually while keeping it available to screen readers
- `AccessibleImage`: Ensures proper alt text and loading states for images
- `FocusTrap`: Manages focus within modals and dropdowns
- `LiveRegion`: Announces dynamic content changes to screen readers
- `AccessibilityProvider`: Manages accessibility preferences and context
- `AccessibilityControls`: User controls for accessibility preferences

#### Enhanced Components
- `Button`: Includes proper focus indicators and minimum touch target sizes
- `Navigation`: Keyboard navigation support with ARIA attributes
- `SearchComponent`: Accessible search with proper labeling and announcements
- `Article`: Semantic HTML structure with accessible markdown rendering

### Utilities

#### Accessibility Library (`/src/lib/accessibility.ts`)
- Focus management utilities
- Color contrast helpers
- ARIA label constants
- Keyboard navigation constants
- Screen reader announcement functions
- Touch target size utilities

#### Accessibility Audit (`/src/lib/accessibility-audit.ts`)
- Automated accessibility testing functions
- Color contrast validation
- Touch target size checking
- Accessibility report generation

### Styling

#### CSS Features
- High contrast mode support
- Reduced motion preferences
- Focus indicators
- Screen reader only styles
- Minimum touch target sizes
- Print accessibility styles

### Testing

#### Manual Testing
- Keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification
- Touch target size validation

#### Automated Testing
- axe-core integration for automated accessibility testing
- Custom accessibility audit functions
- Lighthouse accessibility scoring

#### Test Page
- `/test-accessibility`: Comprehensive testing page demonstrating all accessibility features

## Browser and Assistive Technology Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Supported Assistive Technologies
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)
- Dragon NaturallySpeaking
- Switch navigation devices

## User Preferences

### Accessibility Controls
Users can customize their experience through the accessibility controls panel:
- Font size adjustment (Normal, Large, Larger)
- Reduced motion preferences (automatically detected)
- High contrast mode (automatically detected)

### Responsive Design
- Mobile-first approach ensures accessibility across all devices
- Touch target sizes optimized for mobile interaction
- Keyboard navigation works on all screen sizes

## Content Guidelines

### Writing for Accessibility
- Use clear, simple language
- Provide descriptive headings
- Use bullet points and short paragraphs
- Include alt text for all meaningful images
- Provide captions for videos
- Use descriptive link text

### Image Guidelines
- Decorative images: Use `alt=""` or `aria-hidden="true"`
- Informative images: Provide descriptive alt text
- Complex images: Include detailed descriptions
- Charts/graphs: Provide data tables as alternatives

### Form Guidelines
- Associate labels with form controls
- Provide clear instructions
- Indicate required fields
- Provide error messages and suggestions
- Group related fields with fieldsets

## Maintenance and Updates

### Regular Audits
- Monthly automated accessibility scans
- Quarterly manual testing with assistive technologies
- Annual comprehensive accessibility review

### Development Process
- Accessibility considerations in design phase
- Code reviews include accessibility checks
- Testing with keyboard navigation and screen readers
- User testing with people who use assistive technologies

### Training
- Development team trained in accessibility best practices
- Regular updates on WCAG guidelines and techniques
- Accessibility testing tools and methods

## Resources and References

### WCAG 2.1 Guidelines
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.1 Understanding Documents](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA (Free)](https://www.nvaccess.org/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Built into macOS/iOS)](https://www.apple.com/accessibility/mac/vision/)

## Contact

For accessibility-related questions or to report accessibility issues, please contact:
- Email: accessibility@ngsrn.org
- Phone: [Contact Number]

We are committed to maintaining and improving the accessibility of our website and welcome feedback from all users.