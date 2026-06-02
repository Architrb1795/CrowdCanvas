'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Share2, Sparkles, Bell, Image as ImageIcon } from 'lucide-react';
import { AppNotification } from './NotificationItem';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
  notification: AppNotification;
  onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsVisible(false);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  }, [notification.id, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [handleClose]);


  const handleClick = () => {
    if (notification.action_url) {
      router.push(notification.action_url);
    }
    handleClose();
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="w-5 h-5 text-red-400" />;
      case 'message-circle': return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'share-2': return <Share2 className="w-5 h-5 text-green-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-indigo-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[#0F172A]/90 shadow-2xl backdrop-blur-xl cursor-pointer"
          onClick={handleClick}
        >
          <div className="flex items-start p-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.icon)}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-slate-200">
                {notification.title}
              </p>
              {notification.description && (
                <p className="mt-1 text-xs text-slate-400 leading-snug line-clamp-2">
                  {notification.description}
                </p>
              )}
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md text-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0F172A]"
                onClick={handleClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
