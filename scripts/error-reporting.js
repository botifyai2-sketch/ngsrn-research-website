#!/usr/bin/env node

/**
 * Enhanced Error Reporting and User Guidance System
 * Provides detailed error messages, troubleshooting steps, and Vercel setup instructions
 */

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive error types and their detailed information
 */
const ERROR_TYPES = {
  MISSING_REQUIRED_VAR: {
    severity: 'error',
    category: 'Environment Configuration',
    description: 'A required environment variable is missing',
    icon: '❌'
  },
  INVALID_FORMAT: {
    severity: 'error',
    category: 'Environment Configuration',
    description: 'An environment variable has an invalid format',
    icon: '🔧'
  },
  FEATURE_CONFLICT: {
    severity: 'warning',
    category: 'Feature Configuration',
    description: 'Feature flags have conflicting or inconsistent settings',
    icon: '⚠️'
  },
  VERCEL_MISMATCH: {
    severity: 'warning',
    category: 'Vercel Integration',
    description: 'Environment configuration conflicts with Vercel auto-provided values',
    icon: '🚀'
  },
  MISSING_OPTIONAL_VAR: {
    severity: 'warning',
    category: 'Optional Configuration',
    description: 'An optional environment variable is missing',
    icon: 'ℹ️'
  },
  SECURITY_WARNING: {
    severity: 'warning',
    category: 'Security',
    description: 'Potential security configuration issue',
    icon: '🔒'
  },
  PRECEDENCE_WARNING: {
    severity: 'warning',
    category: 'Environment Precedence',
    description: 'Environment variable precedence issue between local and Vercel settings',
    icon: '🔄'
  },
  VERCEL_URL_CONFLICT: {
    severity: 'warning',
    category: 'Vercel Integration',
    description: 'URL configuration conflicts with Vercel auto-generated URLs',
    icon: '🌐'
  },
  VERCEL_URL_MISMATCH: {
    severity: 'warning',
    category: 'Vercel Integration',
    description: 'URL does not match expected Vercel deployment URL',
    icon: '🔗'
  },
  ENVIRONMENT_MISMATCH: {
    severity: 'error',
    category: 'Environment Configuration',
    description: 'Environment configuration mismatch with deployment context',
    icon: '🔄'
  },
  PREVIEW_WARNING: {
    severity: 'warning',
    category: 'Preview Deployment',
    description: 'Configuration issue specific to preview deployments',
    icon: '👁️'
  },
  PERFORMANCE_WARNING: {
    severity: 'warning',
    category: 'Performance',
    description: 'Configuration may impact performance',
    icon: '⚡'
  }
};

/**
 * Detailed troubleshooting guides for common issues
 */
const TROUBLESHOOTING_GUIDES = {
  NEXT_PUBLIC_SITE_NAME: {
    title: 'Setting Up Site Name',
    description: 'Configure the display name for your website',
    steps: [
      'Choose a descriptive name for your website (e.g., "My Research Website")',
      'In Vercel Dashboard: Go to Project Settings > Environment Variables',
      'Add new variable: NEXT_PUBLIC_SITE_NAME = "Your Site Name"',
      'Deploy to apply changes, or set locally in .env.local for development'
    ],
    vercelInstructions: {
      dashboard: 'Project Settings > Environment Variables > Add New',
      cli: 'vercel env add NEXT_PUBLIC_SITE_NAME'
    },
    localSetup: 'Add to .env.local: NEXT_PUBLIC_SITE_NAME="Your Site Name"',
    validation: 'Should be a descriptive string without special characters'
  },
  NEXT_PUBLIC_BASE_URL: {
    title: 'Configuring Base URL',
    description: 'Set the canonical URL for your application',
    steps: [
      'For Vercel deployment: Usually auto-generated from VERCEL_URL',
      'For custom domains: Set to your full domain (https://yourdomain.com)',
      'For development: Use http://localhost:3000',
      'Ensure URL includes protocol (https:// or http://)'
    ],
    vercelInstructions: {
      dashboard: 'Often auto-provided by Vercel, but can be set manually if needed',
      cli: 'vercel env add NEXT_PUBLIC_BASE_URL'
    },
    localSetup: 'Add to .env.local: NEXT_PUBLIC_BASE_URL="http://localhost:3000"',
    validation: 'Must be a valid URL with protocol (https:// recommended for production)'
  },
  DATABASE_URL: {
    title: 'Database Connection Setup',
    description: 'Configure PostgreSQL database connection for full deployment',
    steps: [
      'Choose a PostgreSQL provider (Vercel Postgres, Supabase, PlanetScale, etc.)',
      'Create a new database instance',
      'Copy the connection string from your provider',
      'Add to Vercel environment variables as DATABASE_URL',
      'Ensure connection string includes all required parameters'
    ],
    vercelInstructions: {
      dashboard: 'Project Settings > Environment Variables > Add DATABASE_URL',
      cli: 'vercel env add DATABASE_URL'
    },
    localSetup: 'Add to .env.local: DATABASE_URL="postgresql://..."',
    validation: 'Must be a valid PostgreSQL connection string',
    providers: [
      { name: 'Vercel Postgres', url: 'https://vercel.com/docs/storage/vercel-postgres' },
      { name: 'Supabase', url: 'https://supabase.com/docs/guides/database' },
      { name: 'PlanetScale', url: 'https://planetscale.com/docs' },
      { name: 'Railway', url: 'https://railway.app/docs' }
    ]
  },
  NEXTAUTH_SECRET: {
    title: 'Authentication Secret Setup',
    description: 'Generate and configure secure authentication secret',
    steps: [
      'Generate a secure random string (32+ characters)',
      'Use: openssl rand -base64 32 (on Unix systems)',
      'Or use online generator: https://generate-secret.vercel.app/32',
      'Add to Vercel environment variables as NEXTAUTH_SECRET',
      'Keep this secret secure and never commit to version control'
    ],
    vercelInstructions: {
      dashboard: 'Project Settings > Environment Variables > Add NEXTAUTH_SECRET (mark as sensitive)',
      cli: 'vercel env add NEXTAUTH_SECRET'
    },
    localSetup: 'Add to .env.local: NEXTAUTH_SECRET="your-generated-secret"',
    validation: 'Should be a long, random string (32+ characters)',
    security: 'This is a sensitive value - never expose in client-side code'
  },
  GEMINI_API_KEY: {
    title: 'Google Gemini AI API Setup',
    description: 'Configure Google Gemini API for AI features',
    steps: [
      'Go to Google AI Studio: https://aistudio.google.com/',
      'Create a new project or select existing one',
      'Generate an API key in the API Keys section',
      'Add to Vercel environment variables as GEMINI_API_KEY',
      'Test the API key with a simple request'
    ],
    vercelInstructions: {
      dashboard: 'Project Settings > Environment Variables > Add GEMINI_API_KEY (mark as sensitive)',
      cli: 'vercel env add GEMINI_API_KEY'
    },
    localSetup: 'Add to .env.local: GEMINI_API_KEY="your-api-key"',
    validation: 'Should start with "AI" followed by alphanumeric characters',
    security: 'This is a sensitive API key - never expose in client-side code'
  }
};

/**
 * Vercel-specific setup instructions
 */
const VERCEL_SETUP_GUIDE = {
  dashboard: {
    title: 'Setting Environment Variables in Vercel Dashboard',
    steps: [
      'Log in to your Vercel dashboard (https://vercel.com/dashboard)',
      'Select your project from the projects list',
      'Navigate to Settings tab',
      'Click on "Environment Variables" in the left sidebar',
      'Click "Add New" to create a new environment variable',
      'Enter the variable name (e.g., NEXT_PUBLIC_SITE_NAME)',
      'Enter the variable value',
      'Select the environments where this variable should be available:',
      '  - Production: For live deployments',
      '  - Preview: For preview deployments (pull requests)',
      '  - Development: For local development (optional)',
      'Click "Save" to add the variable',
      'Redeploy your application to apply the changes'
    ],
    tips: [
      'Mark sensitive variables (API keys, secrets) as "Sensitive" to hide their values',
      'Use different values for different environments when needed',
      'Group related variables using consistent naming (e.g., AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)',
      'Document your environment variables in your project README'
    ]
  },
  cli: {
    title: 'Setting Environment Variables with Vercel CLI',
    prerequisites: [
      'Install Vercel CLI: npm i -g vercel',
      'Login to Vercel: vercel login',
      'Link your project: vercel link'
    ],
    commands: [
      {
        command: 'vercel env add VARIABLE_NAME',
        description: 'Add a new environment variable interactively'
      },
      {
        command: 'vercel env add VARIABLE_NAME production',
        description: 'Add variable for production environment only'
      },
      {
        command: 'vercel env ls',
        description: 'List all environment variables'
      },
      {
        command: 'vercel env rm VARIABLE_NAME',
        description: 'Remove an environment variable'
      },
      {
        command: 'vercel env pull .env.local',
        description: 'Download environment variables to local file'
      }
    ],
    tips: [
      'Use vercel env pull to sync remote variables to your local development',
      'The CLI will prompt you to select environments for each variable',
      'Use production-specific values for sensitive data',
      'Test locally with vercel dev after setting variables'
    ]
  }
};

/**
 * Enhanced error reporter class
 */
class EnhancedErrorReporter {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  /**
   * Add an error with detailed information
   */
  addError(type, variable, customMessage = null, context = {}) {
    const errorType = ERROR_TYPES[type];
    if (!errorType) {
      throw new Error(`Unknown error type: ${type}`);
    }

    const error = {
      type,
      variable,
      severity: errorType.severity,
      category: errorType.category,
      icon: errorType.icon,
      message: customMessage || this.generateErrorMessage(type, variable, context),
      troubleshooting: this.getTroubleshootingGuide(variable),
      vercelInstructions: this.getVercelInstructions(variable),
      context
    };

    if (errorType.severity === 'error') {
      this.errors.push(error);
    } else {
      this.warnings.push(error);
    }
  }

  /**
   * Generate contextual error message
   */
  generateErrorMessage(type, variable, context) {
    const descriptions = {
      MISSING_REQUIRED_VAR: `Required environment variable '${variable}' is not set`,
      INVALID_FORMAT: `Environment variable '${variable}' has an invalid format`,
      FEATURE_CONFLICT: `Feature configuration conflict involving '${variable}'`,
      VERCEL_MISMATCH: `Vercel integration issue with '${variable}'`,
      MISSING_OPTIONAL_VAR: `Optional environment variable '${variable}' is not configured`,
      SECURITY_WARNING: `Security concern with '${variable}' configuration`,
      PRECEDENCE_WARNING: `Environment precedence issue with '${variable}'`,
      VERCEL_URL_CONFLICT: `URL conflict with Vercel auto-generation for '${variable}'`,
      VERCEL_URL_MISMATCH: `URL mismatch for '${variable}' in Vercel deployment`,
      ENVIRONMENT_MISMATCH: `Environment mismatch for '${variable}'`,
      PREVIEW_WARNING: `Preview deployment issue with '${variable}'`,
      PERFORMANCE_WARNING: `Performance concern with '${variable}' configuration`
    };

    let message = descriptions[type] || `Issue with environment variable '${variable}'`;

    // Add context-specific details
    if (context.expectedFormat) {
      message += `. Expected format: ${context.expectedFormat}`;
    }
    if (context.currentValue && type === 'INVALID_FORMAT') {
      message += `. Current value does not match expected pattern`;
    }
    if (context.currentValue && context.expectedValue && type.includes('MISMATCH')) {
      message += `. Current: ${context.currentValue}, Expected: ${context.expectedValue}`;
    }
    if (context.vercelUrl && type === 'VERCEL_URL_CONFLICT') {
      message += `. Vercel will auto-generate: ${context.vercelUrl}`;
    }
    if (context.environment && type === 'ENVIRONMENT_MISMATCH') {
      message += `. Deployment environment: ${context.environment}`;
    }
    if (context.suggestion) {
      message += `. ${context.suggestion}`;
    }

    return message;
  }

  /**
   * Get troubleshooting guide for a variable
   */
  getTroubleshootingGuide(variable) {
    return TROUBLESHOOTING_GUIDES[variable] || {
      title: `Setting up ${variable}`,
      description: `Configure the ${variable} environment variable`,
      steps: [
        'Check the variable name for typos',
        'Ensure the value is properly formatted',
        'Set the variable in your environment or .env file',
        'Restart your application after making changes'
      ],
      vercelInstructions: {
        dashboard: 'Project Settings > Environment Variables > Add New',
        cli: `vercel env add ${variable}`
      }
    };
  }

  /**
   * Get Vercel-specific setup instructions
   */
  getVercelInstructions(variable) {
    const guide = TROUBLESHOOTING_GUIDES[variable];
    if (guide && guide.vercelInstructions) {
      return guide.vercelInstructions;
    }

    return {
      dashboard: 'Project Settings > Environment Variables > Add New',
      cli: `vercel env add ${variable}`
    };
  }

  /**
   * Generate comprehensive error report
   */
  generateReport(phase, vercelInfo = null) {
    const report = {
      summary: this.generateSummary(phase),
      errors: this.errors,
      warnings: this.warnings,
      vercelContext: vercelInfo,
      quickFixes: this.generateQuickFixes(),
      detailedGuides: this.generateDetailedGuides(),
      nextSteps: this.generateNextSteps(phase, vercelInfo)
    };

    return report;
  }

  /**
   * Generate summary of issues
   */
  generateSummary(phase) {
    const totalIssues = this.errors.length + this.warnings.length;
    
    return {
      phase,
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalIssues,
      isValid: this.errors.length === 0,
      categories: this.getCategorySummary()
    };
  }

  /**
   * Get summary by category
   */
  getCategorySummary() {
    const categories = {};
    
    [...this.errors, ...this.warnings].forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = { errors: 0, warnings: 0 };
      }
      
      if (issue.severity === 'error') {
        categories[issue.category].errors++;
      } else {
        categories[issue.category].warnings++;
      }
    });

    return categories;
  }

  /**
   * Generate quick fix suggestions
   */
  generateQuickFixes() {
    const fixes = [];

    this.errors.forEach(error => {
      if (error.variable === 'NEXT_PUBLIC_SITE_NAME') {
        fixes.push({
          variable: error.variable,
          command: 'export NEXT_PUBLIC_SITE_NAME="Your Site Name"',
          description: 'Set a default site name for immediate testing'
        });
      }

      if (error.variable === 'NEXT_PUBLIC_BASE_URL') {
        fixes.push({
          variable: error.variable,
          command: 'export NEXT_PUBLIC_BASE_URL="http://localhost:3000"',
          description: 'Set base URL for local development'
        });
      }

      if (error.variable === 'NEXTAUTH_SECRET') {
        fixes.push({
          variable: error.variable,
          command: 'export NEXTAUTH_SECRET="$(openssl rand -base64 32)"',
          description: 'Generate and set a secure authentication secret'
        });
      }
    });

    return fixes;
  }

  /**
   * Generate detailed setup guides
   */
  generateDetailedGuides() {
    const guides = [];
    const uniqueVariables = [...new Set([...this.errors, ...this.warnings].map(issue => issue.variable))];

    uniqueVariables.forEach(variable => {
      const guide = TROUBLESHOOTING_GUIDES[variable];
      if (guide) {
        guides.push({
          variable,
          ...guide
        });
      }
    });

    return guides;
  }

  /**
   * Generate next steps based on context
   */
  generateNextSteps(phase, vercelInfo) {
    const steps = [];

    if (this.errors.length > 0) {
      steps.push({
        priority: 'high',
        action: 'Fix Required Variables',
        description: 'Set all required environment variables before proceeding',
        variables: this.errors.map(e => e.variable)
      });
    }

    if (vercelInfo?.isVercel) {
      steps.push({
        priority: 'medium',
        action: 'Configure Vercel Environment',
        description: 'Set environment variables in Vercel dashboard for deployment',
        link: 'https://vercel.com/docs/concepts/projects/environment-variables'
      });
    } else {
      steps.push({
        priority: 'medium',
        action: 'Set Local Environment',
        description: 'Create .env.local file with required variables for development'
      });
    }

    if (this.warnings.length > 0) {
      steps.push({
        priority: 'low',
        action: 'Address Warnings',
        description: 'Review and optionally fix warning-level issues',
        variables: this.warnings.map(w => w.variable)
      });
    }

    if (phase === 'full' && this.errors.length === 0) {
      steps.push({
        priority: 'low',
        action: 'Test Full Features',
        description: 'Verify that all enabled features work correctly with current configuration'
      });
    }

    return steps;
  }

  /**
   * Print formatted error report to console
   */
  printReport(phase, vercelInfo = null) {
    const report = this.generateReport(phase, vercelInfo);
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ENVIRONMENT VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Summary
    console.log(`\n📋 Summary for ${phase} deployment:`);
    console.log(`   Errors: ${report.summary.totalErrors}`);
    console.log(`   Warnings: ${report.summary.totalWarnings}`);
    console.log(`   Status: ${report.summary.isValid ? '✅ Valid' : '❌ Invalid'}`);

    if (vercelInfo?.isVercel) {
      console.log(`   Vercel Environment: ${vercelInfo.environment}`);
      console.log(`   Auto-provided Variables: ${vercelInfo.autoProvidedVars?.length || 0}`);
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS (Must be fixed):');
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.icon} ${error.variable}`);
        console.log(`   Category: ${error.category}`);
        console.log(`   Issue: ${error.message}`);
        
        if (error.troubleshooting) {
          console.log(`   Description: ${error.troubleshooting.description}`);
          
          if (error.troubleshooting.steps) {
            console.log('   Setup Steps:');
            error.troubleshooting.steps.forEach((step, stepIndex) => {
              console.log(`     ${stepIndex + 1}. ${step}`);
            });
          }

          if (vercelInfo?.isVercel && error.troubleshooting.vercelInstructions) {
            console.log('   Vercel Setup:');
            console.log(`     Dashboard: ${error.troubleshooting.vercelInstructions.dashboard}`);
            console.log(`     CLI: ${error.troubleshooting.vercelInstructions.cli}`);
          } else if (error.troubleshooting.localSetup) {
            console.log(`   Local Setup: ${error.troubleshooting.localSetup}`);
          }
        }
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Recommended to fix):');
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.icon} ${warning.variable}`);
        console.log(`   Category: ${warning.category}`);
        console.log(`   Issue: ${warning.message}`);
        
        if (warning.troubleshooting && warning.troubleshooting.description) {
          console.log(`   Description: ${warning.troubleshooting.description}`);
        }
      });
    }

    // Quick fixes
    if (report.quickFixes.length > 0) {
      console.log('\n🔧 QUICK FIXES:');
      report.quickFixes.forEach((fix, index) => {
        console.log(`\n${index + 1}. ${fix.variable}:`);
        console.log(`   Command: ${fix.command}`);
        console.log(`   Description: ${fix.description}`);
      });
    }

    // Vercel setup guide
    if (vercelInfo?.isVercel) {
      console.log('\n🚀 VERCEL SETUP GUIDE:');
      console.log('\nDashboard Method:');
      VERCEL_SETUP_GUIDE.dashboard.steps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });

      console.log('\nCLI Method:');
      console.log('Prerequisites:');
      VERCEL_SETUP_GUIDE.cli.prerequisites.forEach(prereq => {
        console.log(`  - ${prereq}`);
      });
      
      console.log('Commands:');
      VERCEL_SETUP_GUIDE.cli.commands.forEach(cmd => {
        console.log(`  ${cmd.command} - ${cmd.description}`);
      });
    }

    // Next steps
    if (report.nextSteps.length > 0) {
      console.log('\n📋 NEXT STEPS:');
      report.nextSteps.forEach((step, index) => {
        const priorityIcon = step.priority === 'high' ? '🔴' : step.priority === 'medium' ? '🟡' : '🟢';
        console.log(`\n${index + 1}. ${priorityIcon} ${step.action} (${step.priority} priority)`);
        console.log(`   ${step.description}`);
        
        if (step.variables) {
          console.log(`   Variables: ${step.variables.join(', ')}`);
        }
        
        if (step.link) {
          console.log(`   Documentation: ${step.link}`);
        }
      });
    }

    console.log('\n' + '='.repeat(80));
    
    return report;
  }
}

module.exports = {
  EnhancedErrorReporter,
  ERROR_TYPES,
  TROUBLESHOOTING_GUIDES,
  VERCEL_SETUP_GUIDE
};