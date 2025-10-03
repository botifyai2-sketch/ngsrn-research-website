import { Metadata } from 'next';
import { EnvironmentMonitoringDashboard } from '@/components/monitoring/EnvironmentMonitoringDashboard';

export const metadata: Metadata = {
  title: 'Environment Monitoring - NGSRN CMS',
  description: 'Monitor environment configuration health, drift detection, and alerts',
};

export default function EnvironmentMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <EnvironmentMonitoringDashboard />
      </div>
    </div>
  );
}