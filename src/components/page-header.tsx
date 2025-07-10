import { cn } from '@/lib/utils';
import React from 'react';

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 md:p-6 border-b bg-card rounded-t-lg',
        className
      )}
    >
      <h2 className="text-2xl font-bold tracking-tight font-headline">{title}</h2>
      {children}
    </div>
  );
}
