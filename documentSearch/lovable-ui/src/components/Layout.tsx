
import React from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className={cn(
        "flex-1 ml-16 sm:ml-16 md:ml-16 lg:ml-64 p-4 sm:p-6 md:p-8",
        className
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
