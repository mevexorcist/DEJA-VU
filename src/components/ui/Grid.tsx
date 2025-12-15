'use client';

import React from 'react';

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export const Grid: React.FC<GridProps> = ({
  children,
  className = '',
  cols = { default: 1, lg: 12 },
  gap = 6,
}) => {
  const getGridClasses = () => {
    const classes = ['grid'];

    // Add column classes
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);

    // Add gap class
    classes.push(`gap-${gap}`);

    return classes.join(' ');
  };

  return <div className={`${getGridClasses()} ${className}`}>{children}</div>;
};

interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  className = '',
  span = {},
}) => {
  const getSpanClasses = () => {
    const classes = [];

    if (span.default) classes.push(`col-span-${span.default}`);
    if (span.sm) classes.push(`sm:col-span-${span.sm}`);
    if (span.md) classes.push(`md:col-span-${span.md}`);
    if (span.lg) classes.push(`lg:col-span-${span.lg}`);
    if (span.xl) classes.push(`xl:col-span-${span.xl}`);

    return classes.join(' ');
  };

  return <div className={`${getSpanClasses()} ${className}`}>{children}</div>;
};
