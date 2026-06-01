import React from 'react';
import { Heart, MessageCircle, Share2, UploadCloud, Sparkles, BellRing, Info, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id?: string;
  category: 'social' | 'media' | 'event' | 'ai' | 'system';
  action_type: string;
  title: string;
  description?: string;
  action_url?: string;
  icon?: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  
  const getIcon = () => {
    switch (notification.icon) {
      case 'heart': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'message-circle': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'share-2': return <Share2 className="w-4 h-4 text-emerald-400" />;
      case 'upload-cloud': return <UploadCloud className="w-4 h-4 text-indigo-400" />;
      case 'sparkles': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-orange-400" />;
      case 'info': return <Info className="w-4 h-4 text-sky-400" />;
      default: return <BellRing className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBackgroundClass = () => {
    if (notification.is_read) return 'bg-transparent hover:bg-white/5';
    return 'bg-indigo-500/10 hover:bg-indigo-500/20';
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
    .replace('about ', '')
    .replace('less than a minute', 'Just now');

  return (
    <div 
      onClick={() => onClick(notification)}
      className={`p-3 rounded-xl cursor-pointer transition-colors flex gap-3 group relative ${getBackgroundClass()}`}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${notification.is_read ? 'bg-slate-800 border-white/5' : 'bg-slate-800 border-indigo-500/30'} shadow-sm`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className={`text-sm leading-tight mb-0.5 ${notification.is_read ? 'text-slate-300 font-medium' : 'text-white font-bold'}`}>
          {notification.title}
        </p>
        {notification.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {notification.description}
          </p>
        )}
        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
