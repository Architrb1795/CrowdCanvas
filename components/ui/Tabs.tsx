'use client';

import React, { createContext, useContext, ReactNode } from 'react';

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void }>({
  value: '', onValueChange: () => {}
});

export const Tabs = ({ value, onValueChange, children, className = '' }: { value: string; onValueChange: (v: string) => void; children: ReactNode; className?: string }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export const TabsTrigger = ({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  return (
    <button 
      onClick={() => onValueChange(value)}
      className={`${className} transition-all duration-200 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) => {
  const { value: selectedValue } = useContext(TabsContext);
  if (selectedValue !== value) return null;
  
  return (
    <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
      {children}
    </div>
  );
};
