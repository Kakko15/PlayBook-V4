import React from 'react';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/playbook_logo.png"
          alt="PlayBook Logo"
          className="h-16 w-16 animate-pulse"
        />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '450ms' }}></div>
        </div>
        <span className="text-xl font-bold text-foreground">PlayBook</span>
        <span className="text-sm text-muted-foreground">Finalizing...</span>
      </div>
    </div>
  );
}