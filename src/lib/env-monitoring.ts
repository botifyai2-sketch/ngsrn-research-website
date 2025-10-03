/**
 * Environment Configuration Monitoring Service
 * Provides drift detection, health checks, and proactive monitoring for environment variables
 */

import { validateEnvironment, detectVercelContext, type EnvironmentConfig, type VercelContext } from './env-validation';

export interface EnvironmentDrift {
  variable: string;
  type: 'added' | 'removed' | 'changed' | 'format_changed';
  previousValue?: string;
  currentValue?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  recommendation: string;
  detectedAt: Date;
}

export interface EnvironmentAlert {
  id: string;
  type: 'missing_variable' | 'invalid_format' | 'security_risk' | 'configuration_drift' | 'vercel_mismatch';
  severity: 'info' | 'warning' | 'error' | 'critical';
  variable: string;
  message: string;
  description: string;
  recommendation: string;
  createdAt: Date;
  resolvedAt?: Date;
  acknowledged: boolean;
}

export interface EnvironmentHealthStatus {
  overall: 'healthy' | 'warning' | 'error' | 'critical';
  score: number; // 0-100
  lastChecked: Date;
  issues: {
    missing: string[];
    invalid: string[];
    warnings: string[];
    security: string[];
  };
  drift: {
    detected: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    changes: EnvironmentDrift[];
  };
  vercel: {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  };
  alerts: EnvironmentAlert[];
}

export interface EnvironmentSnapshot {
  timestamp: Date;
  phase: 'simple' | 'full';
  variables: Record<string, string>;
  vercelContext: VercelContext;
  checksum: string;
}

class EnvironmentMonitoringService {
  private snapshots: EnvironmentSnapshot[] = [];
  private alerts: EnvironmentAlert[] = [];
  private maxSnapshots = 50; // Keep last 50 snapshots
  private lastHealthCheck?: Date;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring service
   */
  private initializeMonitoring() {
    // Load existing snapshots from storage if available
    this.loadStoredSnapshots();
    
    // Start periodic health checks in production
    if (process.env.NODE_ENV === 'production') {
      this.startPeriodicHealthChecks();
    }
  }

  /**
   * Take a snapshot of current environment configuration
   */
  public async takeSnapshot(): Promise<EnvironmentSnapshot> {
    try {
      const config = await validateEnvironment();
      const vercelContext = detectVercelContext();
      
      // Create sanitized variables object (no sensitive values)
      const variables: Record<string, string> = {};
      const sensitiveVars = ['NEXTAUTH_SECRET', 'DATABASE_URL', 'DIRECT_URL', 'GEMINI_API_KEY', 'AWS_SECRET_ACCESS_KEY'];
      
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_') || !sensitiveVars.includes(key)) {
          variables[key] = process.env[key] || '';
        } else {
          // Store only presence and length for sensitive variables
          variables[key] = process.env[key] ? `[REDACTED:${process.env[key]?.length}]` : '';
        }
      });

      const snapshot: EnvironmentSnapshot = {
        timestamp: new Date(),
        phase: config.phase,
        variables,
        vercelContext,
        checksum: this.generateChecksum(variables)
      };

      // Add to snapshots array
      this.snapshots.push(snapshot);
      
      // Keep only the most recent snapshots
      if (this.snapshots.length > this.maxSnapshots) {
        this.snapshots = this.snapshots.slice(-this.maxSnapshots);
      }

      // Store snapshots for persistence
      this.storeSnapshots();

      return snapshot;
    } catch (error) {
      throw new Error(`Failed to take environment snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect configuration drift between snapshots
   */
  public detectDrift(currentSnapshot?: EnvironmentSnapshot): EnvironmentDrift[] {
    if (this.snapshots.length < 2) {
      return []; // Need at least 2 snapshots to detect drift
    }

    const current = currentSnapshot || this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    const drifts: EnvironmentDrift[] = [];

    // Check for added variables
    Object.keys(current.variables).forEach(key => {
      if (!(key in previous.variables)) {
        drifts.push({
          variable: key,
          type: 'added',
          currentValue: this.getSafeValue(current.variables[key]),
          severity: this.calculateDriftSeverity(key, 'added'),
          impact: `New environment variable ${key} was added`,
          recommendation: `Verify that ${key} is properly configured and documented`,
          detectedAt: current.timestamp
        });
      }
    });

    // Check for removed variables
    Object.keys(previous.variables).forEach(key => {
      if (!(key in current.variables)) {
        drifts.push({
          variable: key,
          type: 'removed',
          previousValue: this.getSafeValue(previous.variables[key]),
          severity: this.calculateDriftSeverity(key, 'removed'),
          impact: `Environment variable ${key} was removed`,
          recommendation: `Ensure ${key} removal was intentional and won't break functionality`,
          detectedAt: current.timestamp
        });
      }
    });

    // Check for changed variables
    Object.keys(current.variables).forEach(key => {
      if (key in previous.variables && current.variables[key] !== previous.variables[key]) {
        drifts.push({
          variable: key,
          type: 'changed',
          previousValue: this.getSafeValue(previous.variables[key]),
          currentValue: this.getSafeValue(current.variables[key]),
          severity: this.calculateDriftSeverity(key, 'changed'),
          impact: `Environment variable ${key} value changed`,
          recommendation: `Verify that ${key} change is intentional and properly tested`,
          detectedAt: current.timestamp
        });
      }
    });

    return drifts;
  }

  /**
   * Generate comprehensive health status
   */
  public async generateHealthStatus(): Promise<EnvironmentHealthStatus> {
    try {
      // Take current snapshot
      const currentSnapshot = await this.takeSnapshot();
      
      // Detect drift
      const driftChanges = this.detectDrift(currentSnapshot);
      
      // Validate current environment
      let config: EnvironmentConfig;
      const issues = {
        missing: [] as string[],
        invalid: [] as string[],
        warnings: [] as string[],
        security: [] as string[]
      };

      try {
        config = await validateEnvironment();
      } catch (error) {
        // Parse validation errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const lines = errorMessage.split('\n');
        
        lines.forEach(line => {
          if (line.includes('Missing required')) {
            const match = line.match(/Missing required environment variable: (\w+)/);
            if (match) issues.missing.push(match[1]);
          } else if (line.includes('invalid') || line.includes('format')) {
            const match = line.match(/(\w+).*invalid|format/);
            if (match) issues.invalid.push(match[1]);
          }
        });

        // Create minimal config for further processing
        config = {
          phase: 'simple',
          baseUrl: 'http://localhost:3000',
          siteName: 'Unknown',
          features: { cms: false, auth: false, search: false, ai: false, media: false }
        };
      }

      // Check for security issues
      this.checkSecurityIssues(currentSnapshot, issues);

      // Check Vercel compatibility
      const vercelIssues = this.checkVercelCompatibility(currentSnapshot);

      // Calculate overall health score
      const score = this.calculateHealthScore(issues, driftChanges, vercelIssues);
      
      // Determine overall status
      const overall = this.determineOverallStatus(score, issues, driftChanges);

      // Get active alerts
      const activeAlerts = this.getActiveAlerts();

      const healthStatus: EnvironmentHealthStatus = {
        overall,
        score,
        lastChecked: new Date(),
        issues,
        drift: {
          detected: driftChanges.length > 0,
          severity: this.getMaxDriftSeverity(driftChanges),
          changes: driftChanges
        },
        vercel: {
          compatible: vercelIssues.issues.length === 0,
          issues: vercelIssues.issues,
          recommendations: vercelIssues.recommendations
        },
        alerts: activeAlerts
      };

      this.lastHealthCheck = new Date();
      
      // Generate alerts for new issues
      this.generateAlertsFromHealthStatus(healthStatus);

      return healthStatus;
    } catch (error) {
      throw new Error(`Failed to generate health status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an alert for environment issues
   */
  public createAlert(alert: Omit<EnvironmentAlert, 'id' | 'createdAt' | 'acknowledged'>): EnvironmentAlert {
    const newAlert: EnvironmentAlert = {
      ...alert,
      id: this.generateAlertId(),
      createdAt: new Date(),
      acknowledged: false
    };

    this.alerts.push(newAlert);
    
    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return newAlert;
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get active (unresolved) alerts
   */
  public getActiveAlerts(): EnvironmentAlert[] {
    return this.alerts.filter(alert => !alert.resolvedAt);
  }

  /**
   * Get all alerts with optional filtering
   */
  public getAlerts(filter?: {
    severity?: EnvironmentAlert['severity'];
    type?: EnvironmentAlert['type'];
    resolved?: boolean;
  }): EnvironmentAlert[] {
    let filtered = this.alerts;

    if (filter) {
      if (filter.severity) {
        filtered = filtered.filter(alert => alert.severity === filter.severity);
      }
      if (filter.type) {
        filtered = filtered.filter(alert => alert.type === filter.type);
      }
      if (filter.resolved !== undefined) {
        filtered = filtered.filter(alert => !!alert.resolvedAt === filter.resolved);
      }
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicHealthChecks() {
    // Check every 5 minutes in production
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.generateHealthStatus();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  // Private helper methods

  private generateChecksum(variables: Record<string, string>): string {
    const sortedKeys = Object.keys(variables).sort();
    const content = sortedKeys.map(key => `${key}=${variables[key]}`).join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getSafeValue(value: string): string {
    if (value.startsWith('[REDACTED:')) {
      return value;
    }
    return value.length > 20 ? `${value.substring(0, 20)}...` : value;
  }

  private calculateDriftSeverity(variable: string, type: 'added' | 'removed' | 'changed'): EnvironmentDrift['severity'] {
    const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXT_PUBLIC_BASE_URL'];
    const highVars = ['DIRECT_URL', 'NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_NAME'];
    
    if (criticalVars.includes(variable)) {
      return type === 'removed' ? 'critical' : 'high';
    }
    
    if (highVars.includes(variable)) {
      return type === 'removed' ? 'high' : 'medium';
    }
    
    return type === 'removed' ? 'medium' : 'low';
  }

  private checkSecurityIssues(snapshot: EnvironmentSnapshot, issues: EnvironmentHealthStatus['issues']) {
    // Check for weak secrets
    Object.keys(snapshot.variables).forEach(key => {
      const value = snapshot.variables[key];
      
      if (key === 'NEXTAUTH_SECRET' && value && !value.startsWith('[REDACTED:')) {
        if (value.length < 32) {
          issues.security.push(`${key} is too short (${value.length} characters, should be 32+)`);
        }
      }
      
      // Check for placeholder values in production
      if (snapshot.vercelContext.environment === 'production') {
        if (value.includes('your-') || value.includes('placeholder') || value.includes('example')) {
          issues.security.push(`${key} contains placeholder value in production`);
        }
      }
    });
  }

  private checkVercelCompatibility(snapshot: EnvironmentSnapshot): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!snapshot.vercelContext.isVercel) {
      return { issues, recommendations };
    }

    // Check for localhost URLs in production
    if (snapshot.vercelContext.environment === 'production') {
      const baseUrl = snapshot.variables.NEXT_PUBLIC_BASE_URL;
      if (baseUrl && baseUrl.includes('localhost')) {
        issues.push('Base URL is set to localhost in production');
        recommendations.push('Remove NEXT_PUBLIC_BASE_URL to use Vercel auto-generated URL');
      }
    }

    // Check for URL mismatches
    if (snapshot.vercelContext.expectedBaseUrl) {
      const setBaseUrl = snapshot.variables.NEXT_PUBLIC_BASE_URL;
      if (setBaseUrl && setBaseUrl !== snapshot.vercelContext.expectedBaseUrl && !snapshot.vercelContext.hasCustomDomain) {
        issues.push(`Base URL mismatch: set to ${setBaseUrl}, expected ${snapshot.vercelContext.expectedBaseUrl}`);
        recommendations.push('Update URL to match Vercel deployment or remove to use auto-generated URL');
      }
    }

    return { issues, recommendations };
  }

  private calculateHealthScore(
    issues: EnvironmentHealthStatus['issues'],
    drifts: EnvironmentDrift[],
    vercelIssues: { issues: string[] }
  ): number {
    let score = 100;

    // Deduct for missing variables
    score -= issues.missing.length * 20;

    // Deduct for invalid variables
    score -= issues.invalid.length * 15;

    // Deduct for warnings
    score -= issues.warnings.length * 5;

    // Deduct for security issues
    score -= issues.security.length * 25;

    // Deduct for drift
    drifts.forEach(drift => {
      switch (drift.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    // Deduct for Vercel issues
    score -= vercelIssues.issues.length * 10;

    return Math.max(0, Math.min(100, score));
  }

  private determineOverallStatus(
    score: number,
    issues: EnvironmentHealthStatus['issues'],
    drifts: EnvironmentDrift[]
  ): EnvironmentHealthStatus['overall'] {
    if (issues.missing.length > 0 || issues.security.length > 0) {
      return 'critical';
    }

    if (score < 50 || drifts.some(d => d.severity === 'critical')) {
      return 'error';
    }

    if (score < 80 || issues.invalid.length > 0 || drifts.some(d => d.severity === 'high')) {
      return 'warning';
    }

    return 'healthy';
  }

  private getMaxDriftSeverity(drifts: EnvironmentDrift[]): EnvironmentDrift['severity'] | 'none' {
    if (drifts.length === 0) return 'none';
    
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    return drifts.reduce((max, drift) => {
      return severityOrder.indexOf(drift.severity) > severityOrder.indexOf(max) ? drift.severity : max;
    }, 'low' as EnvironmentDrift['severity']);
  }

  private generateAlertsFromHealthStatus(status: EnvironmentHealthStatus) {
    // Create alerts for missing variables
    status.issues.missing.forEach(variable => {
      if (!this.hasActiveAlert('missing_variable', variable)) {
        this.createAlert({
          type: 'missing_variable',
          severity: 'error',
          variable,
          message: `Missing required environment variable: ${variable}`,
          description: `The required environment variable ${variable} is not set`,
          recommendation: `Set ${variable} in your environment configuration`
        });
      }
    });

    // Create alerts for security issues
    status.issues.security.forEach(issue => {
      const variable = issue.split(' ')[0];
      if (!this.hasActiveAlert('security_risk', variable)) {
        this.createAlert({
          type: 'security_risk',
          severity: 'critical',
          variable,
          message: `Security issue detected: ${issue}`,
          description: issue,
          recommendation: 'Review and fix the security issue immediately'
        });
      }
    });

    // Create alerts for critical drift
    status.drift.changes.forEach(drift => {
      if (drift.severity === 'critical' && !this.hasActiveAlert('configuration_drift', drift.variable)) {
        this.createAlert({
          type: 'configuration_drift',
          severity: 'critical',
          variable: drift.variable,
          message: `Critical configuration drift detected for ${drift.variable}`,
          description: drift.impact,
          recommendation: drift.recommendation
        });
      }
    });
  }

  private hasActiveAlert(type: EnvironmentAlert['type'], variable: string): boolean {
    return this.getActiveAlerts().some(alert => alert.type === type && alert.variable === variable);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredSnapshots() {
    // In a real implementation, this would load from persistent storage
    // For now, we'll start with an empty array
  }

  private storeSnapshots() {
    // In a real implementation, this would store to persistent storage
    // For now, we'll just keep them in memory
  }
}

// Create singleton instance
export const envMonitoring = new EnvironmentMonitoringService();

// Export types
export type { EnvironmentHealthStatus, EnvironmentDrift, EnvironmentAlert, EnvironmentSnapshot };