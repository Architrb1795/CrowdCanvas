'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface DialogOptions {
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
}

interface GlobalDialogContextType {
  confirm: (options?: string | DialogOptions) => Promise<boolean>;
  alert: (options?: string | DialogOptions) => Promise<void>;
}

const GlobalDialogContext = createContext<GlobalDialogContextType | null>(null);

export function GlobalDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts?: string | DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(typeof opts === 'string' || !opts ? { message: opts || 'Are you sure?' } : opts);
      setResolver({ resolve });
      setIsOpen(true);
    });
  };

  const alert = (opts?: string | DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setOptions({
        ...(typeof opts === 'string' || !opts ? { message: opts || 'An error occurred.' } : opts),
        isAlert: true
      });
      setResolver({ resolve: () => resolve() });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    resolver?.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.resolve(false);
    setIsOpen(false);
  };

  return (
    <GlobalDialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog isOpen={isOpen} onClose={handleCancel} title={options?.title || (options?.isAlert ? 'Alert' : 'Confirm')}>
        <div className="space-y-6">
          <p className="text-slate-200 text-base">{options?.message}</p>
          <div className="flex justify-end gap-3 pt-2">
            {!options?.isAlert && (
              <Button variant="ghost" onClick={handleCancel}>
                {options?.cancelText || 'Cancel'}
              </Button>
            )}
            <Button variant="primary" onClick={handleConfirm}>
              {options?.confirmText || 'OK'}
            </Button>
          </div>
        </div>
      </Dialog>
    </GlobalDialogContext.Provider>
  );
}

export function useGlobalDialog() {
  const context = useContext(GlobalDialogContext);
  if (!context) throw new Error('useGlobalDialog must be used within GlobalDialogProvider');
  return context;
}
