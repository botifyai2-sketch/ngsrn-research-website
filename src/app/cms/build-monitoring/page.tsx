import { Metadata } from 'next';
import BuildHealthDashboard from '@/components/monitoring/BuildHealthDashboard';

export const metadata: Metadata = {
  title: 'Build Monitoring - NGSRN CMS',
  description: 'Monitor build health, configuration drift, and deployment status',
};

export default function BuildMonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Build Monitoring
        </h1>
        <p className="text-gray-600">
          Monitor build success rates, detect configuration drift, and track deployment health.
        </p>
      </div>

      <BuildHealthDashboard />
    </div>
  );
}