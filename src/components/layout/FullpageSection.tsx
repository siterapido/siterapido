import React from "react";

export interface FullpageSectionProps {
  children?: React.ReactNode;
  className?: string;
}

export function FullpageSection({ children, className }: FullpageSectionProps) {
  return (
    <section className={className}>
      {children}
    </section>
  );
}

FullpageSection.displayName = 'FullpageSection'; 