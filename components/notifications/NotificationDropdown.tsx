import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotification, NotificationItem } from './NotificationItem';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CheckCheck, Trash2, Settings, BellOff } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import { useRouter } from 'next/navigation';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

type FilterTab = 'all' | 'unread' | 'social' | 'media' | 'ai' | 'system';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onClearAll
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'social', label: 'Social' },
    { id: 'media', label: 'Media' },
    { id: 'ai', label: 'AI' },
    { id: 'system', label: 'System' },
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return !n.is_read;
      return n.category === activeTab;
    });
  }, [notifications, activeTab]);

  const groupedNotifications = useMemo(() => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    filteredNotifications.forEach(n => {
      const date = new Date(n.created_at);
      if (isToday(date)) today.push(n);
      else if (isYesterday(date)) yesterday.push(n);
      else earlier.push(n);
    });

    return { today, yesterday, earlier };
  }, [filteredNotifications]);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
    }
  };

  const handleClearAll = () => {
    onClearAll();
    setIsClearConfirmOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop for closing on outside click */}
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-full mt-2 w-[380px] sm:w-[420px] max-h-[70vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-[101] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={onMarkAllRead}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors group relative"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 border-b border-white/5 shrink-0 gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-indigo-500/20 text-indigo-300' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <BellOff className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No notifications found</p>
                  <p className="text-xs mt-1">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-2">
                  {groupedNotifications.today.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Today</h4>
                      {groupedNotifications.today.map(n => (
                        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                      ))}
                    </div>
                  )}

                  {groupedNotifications.yesterday.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-4">Yesterday</h4>
                      {groupedNotifications.yesterday.map(n => (
                        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                      ))}
                    </div>
                  )}

                  {groupedNotifications.earlier.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-4">Earlier</h4>
                      {groupedNotifications.earlier.map(n => (
                        <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <ConfirmDialog 
            isOpen={isClearConfirmOpen}
            onClose={() => setIsClearConfirmOpen(false)}
            onConfirm={handleClearAll}
            title="Clear All Notifications"
            description="Are you sure you want to permanently clear all notifications? This action cannot be undone."
            confirmText="Clear All"
            isDestructive={true}
          />
        </>
      )}
    </AnimatePresence>
  );
};
