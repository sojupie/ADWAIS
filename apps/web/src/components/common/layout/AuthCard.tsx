import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div className={`bg-brand-bg-primary/1 backdrop-blur-2xl p-20 rounded-[2rem] shadow-[0_0_60px_rgba(0,0,0,0.08)] text-center w-full max-w-2xl h-[590px] flex flex-col justify-between border border-white/20 relative z-20 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
