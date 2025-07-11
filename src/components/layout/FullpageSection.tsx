import React from "react";

export interface FullpageSectionProps {
  isActive?: boolean;
  isLeaving?: boolean;
  isEntering?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FullpageSection({ isActive, isLeaving, isEntering, children, className }: FullpageSectionProps) {
  return (
    <section className={className}>
      {children}
    </section>
  );
}

FullpageSection.displayName = 'FullpageSection'; 