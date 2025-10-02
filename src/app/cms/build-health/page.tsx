import { Metadata } from 'next';
import BuildHealthDashboard from '@/components/monitoring/BuildHealthDashboard';

export const metadata: Metadata = {
  title: 'Build Health Dashboard - NGSRN CMS',
  description: 'Monitor build success rates, configuration drift, and deployment health',
};

export default function BuildHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <BuildHealthDashboard />
      </div>
    </div>
  );
}