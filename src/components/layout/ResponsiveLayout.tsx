'use client';

import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  rightPanel,
  className = '',
}) => {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <div className={`min-h-screen bg-background text-foreground ${className}`}>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">DEJA-VU</h1>
          <div className="avatar avatar-md bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            U
          </div>
        </div>
      </header>

      {/* X.com style layout - centered with max-width */}
      <div className="max-w-[1300px] mx-auto flex">
        {/* Desktop Sidebar - Left */}
        {sidebar && isDesktop && (
          <aside className="hidden lg:flex flex-col items-end flex-shrink-0 xl:w-[275px]">
            {sidebar}
          </aside>
        )}

        {/* Main Content - Center */}
        <main className="flex-1 min-w-0 max-w-[600px] border-x border-border">
          {children}
        </main>

        {/* Desktop Right Panel */}
        {rightPanel && isDesktop && (
          <aside className="hidden lg:block flex-shrink-0 ml-6">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};
