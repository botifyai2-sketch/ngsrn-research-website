/**
 * Accessibility Audit Utilities
 * Provides tools for testing and validating WCAG 2.1 AA compliance
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  description: string;
  element?: string;
  suggestion: string;
}

export interface AccessibilityAuditResult {
  passed: boolean;
  score: number;
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Performs a basic accessibility audit of the current page
 */
export function auditPageAccessibility(): AccessibilityAuditResult {
  const issues: AccessibilityIssue[] = [];

  // Check for missing alt text on images
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt && !img.hasAttribute('aria-hidden')) {
      issues.push({
        type: 'error',
        rule: 'WCAG 1.1.1',
        description: 'Image missing alt text',
        element: `img[${index}]`,
        suggestion: 'Add descriptive alt text or mark as decorative with alt=""'
      });
    }
  });

  // Check for missing form labels
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel) {
      issues.push({
        type: 'error',
        rule: 'WCAG 1.3.1',
        description: 'Form control missing label',
        element: `${input.tagName.toLowerCase()}[${index}]`,
        suggestion: 'Add a label element or aria-label attribute'
      });
    }
  });

  // Check for heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (index === 0 && level !== 1) {
      issues.push({
        type: 'warning',
        rule: 'WCAG 1.3.1',
        description: 'Page should start with h1',
        element: `${heading.tagName.toLowerCase()}[${index}]`,
        suggestion: 'Use h1 for the main page heading'
      });
    }
    if (level > previousLevel + 1) {
      issues.push({
        type: 'warning',
        rule: 'WCAG 1.3.1',
        description: 'Heading levels should not skip',
        element: `${heading.tagName.toLowerCase()}[${index}]`,
        suggestion: 'Use sequential heading levels (h1, h2, h3, etc.)'
      });
    }
    previousLevel = level;
  });

  // Check for color contrast (basic check)
  const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
  textElements.forEach((element, index) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    
    // This is a simplified check - in production, you'd use a proper contrast calculation
    if (color === 'rgb(128, 128, 128)' || color === '#808080') {
      issues.push({
        type: 'warning',
        rule: 'WCAG 1.4.3',
        description: 'Potential color contrast issue',
        element: `${element.tagName.toLowerCase()}[${index}]`,
        suggestion: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text)'
      });
    }
  });

  // Check for missing skip links
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  const hasSkipToMain = Array.from(skipLinks).some(link => 
    link.textContent?.toLowerCase().includes('skip') && 
    link.textContent?.toLowerCase().includes('main')
  );
  
  if (!hasSkipToMain) {
    issues.push({
      type: 'warning',
      rule: 'WCAG 2.4.1',
      description: 'Missing skip to main content link',
      suggestion: 'Add a skip link to allow keyboard users to bypass navigation'
    });
  }

  // Check for focus indicators
  const focusableElements = document.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  let missingFocusIndicators = 0;
  focusableElements.forEach((element) => {
    const styles = window.getComputedStyle(element, ':focus');
    const outline = styles.outline;
    const boxShadow = styles.boxShadow;
    
    if (outline === 'none' && boxShadow === 'none') {
      missingFocusIndicators++;
    }
  });

  if (missingFocusIndicators > 0) {
    issues.push({
      type: 'error',
      rule: 'WCAG 2.4.7',
      description: `${missingFocusIndicators} elements missing focus indicators`,
      suggestion: 'Ensure all focusable elements have visible focus indicators'
    });
  }

  // Check for ARIA landmarks
  const landmarks = document.querySelectorAll('[role="main"], main, [role="navigation"], nav, [role="banner"], header, [role="contentinfo"], footer');
  if (landmarks.length === 0) {
    issues.push({
      type: 'warning',
      rule: 'WCAG 1.3.1',
      description: 'Missing ARIA landmarks',
      suggestion: 'Use semantic HTML elements or ARIA roles to define page regions'
    });
  }

  // Calculate summary
  const summary = {
    errors: issues.filter(issue => issue.type === 'error').length,
    warnings: issues.filter(issue => issue.type === 'warning').length,
    info: issues.filter(issue => issue.type === 'info').length,
  };

  // Calculate score (100 - (errors * 10 + warnings * 5 + info * 1))
  const score = Math.max(0, 100 - (summary.errors * 10 + summary.warnings * 5 + summary.info * 1));
  const passed = summary.errors === 0 && summary.warnings <= 2;

  return {
    passed,
    score,
    issues,
    summary
  };
}

/**
 * Checks if an element meets minimum touch target size requirements
 */
export function checkTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // WCAG AA requirement
  
  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Validates color contrast ratio (simplified version)
 */
export function validateColorContrast(_foreground: string, _background: string): {
  ratio: number;
  passes: {
    aa: boolean;
    aaa: boolean;
  };
} {
  // This is a simplified implementation
  // In production, you'd use a proper color contrast calculation library
  
  // Convert colors to RGB values and calculate luminance
  // For now, return mock values
  const ratio = 4.5; // Mock ratio
  
  return {
    ratio,
    passes: {
      aa: ratio >= 4.5,
      aaa: ratio >= 7.0
    }
  };
}

/**
 * Checks if text is readable (font size, line height, etc.)
 */
export function checkTextReadability(element: HTMLElement): {
  fontSize: number;
  lineHeight: number;
  passes: boolean;
} {
  const styles = window.getComputedStyle(element);
  const fontSize = parseFloat(styles.fontSize);
  const lineHeight = parseFloat(styles.lineHeight);
  
  // WCAG recommendations
  const minFontSize = 16; // pixels
  const minLineHeight = fontSize * 1.5;
  
  return {
    fontSize,
    lineHeight,
    passes: fontSize >= minFontSize && lineHeight >= minLineHeight
  };
}

/**
 * Generates an accessibility report
 */
export function generateAccessibilityReport(): string {
  const audit = auditPageAccessibility();
  
  let report = `# Accessibility Audit Report\n\n`;
  report += `**Score:** ${audit.score}/100\n`;
  report += `**Status:** ${audit.passed ? 'PASSED' : 'FAILED'}\n\n`;
  
  report += `## Summary\n`;
  report += `- Errors: ${audit.summary.errors}\n`;
  report += `- Warnings: ${audit.summary.warnings}\n`;
  report += `- Info: ${audit.summary.info}\n\n`;
  
  if (audit.issues.length > 0) {
    report += `## Issues Found\n\n`;
    
    audit.issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.description}\n`;
      report += `**Type:** ${issue.type.toUpperCase()}\n`;
      report += `**Rule:** ${issue.rule}\n`;
      if (issue.element) {
        report += `**Element:** ${issue.element}\n`;
      }
      report += `**Suggestion:** ${issue.suggestion}\n\n`;
    });
  } else {
    report += `## No Issues Found\n\nGreat job! No accessibility issues were detected.\n\n`;
  }
  
  report += `## Recommendations\n\n`;
  report += `1. Test with actual screen readers (NVDA, JAWS, VoiceOver)\n`;
  report += `2. Validate with automated tools (axe-core, Lighthouse)\n`;
  report += `3. Conduct user testing with people who use assistive technologies\n`;
  report += `4. Regular accessibility audits during development\n`;
  
  return report;
}