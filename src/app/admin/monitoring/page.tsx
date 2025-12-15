// Admin monitoring page
import { Metadata } from 'next';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';

export const metadata: Metadata = {
  title: 'System Monitoring - DEJA-VU Admin',
  description: 'System health monitoring and observability dashboard',
};

export default function MonitoringPage() {
  return <MonitoringDashboard />;
}
