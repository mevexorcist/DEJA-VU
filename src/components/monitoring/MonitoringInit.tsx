'use client';

import { useEffect } from 'react';

export default function MonitoringInit() {
  useEffect(() => {
    // Monitoring disabled for development - enable in production with proper Supabase tables
    // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    //   initializeMonitoring();
    // }
  }, []);

  return null; // This component doesn't render anything
}
