'use client';

import { useState, useEffect } from 'react';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type Breakpoint = keyof BreakpointConfig;

export const useResponsive = (breakpoints: Partial<BreakpointConfig> = {}) => {
  const config = { ...defaultBreakpoints, ...breakpoints };

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < config.md;
  const isTablet =
    windowSize.width >= config.md && windowSize.width < config.lg;
  const isDesktop = windowSize.width >= config.lg;

  const isBreakpoint = (breakpoint: Breakpoint): boolean => {
    return windowSize.width >= config[breakpoint];
  };

  const isBreakpointOnly = (breakpoint: Breakpoint): boolean => {
    const breakpointKeys = Object.keys(config) as Breakpoint[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];

    if (!nextBreakpoint) {
      return windowSize.width >= config[breakpoint];
    }

    return (
      windowSize.width >= config[breakpoint] &&
      windowSize.width < config[nextBreakpoint]
    );
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint,
    isBreakpointOnly,
    breakpoints: config,
  };
};
