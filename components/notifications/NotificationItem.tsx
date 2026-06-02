import React from 'react';
import { Heart, MessageCircle, Sparkles, BellRing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id?: string;
  type?: string;
  action_type?: string;
  category?: string;
  media_id?: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  icon?: string;
  title?: string;
  description?: string;
  actor?: {
    full_name: string;
    avatar_url: string;
  };
}

interface NotificationItemProps {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  
  const getIcon = () => {
    if (notification.icon === 'heart') return <Heart className="w-4 h-4 text-pink-500" />;
    if (notification.icon === 'message-circle') return <MessageCircle className="w-4 h-4 text-amber-400" />;
    if (notification.icon === 'sparkles') return <Sparkles className="w-4 h-4 text-emerald-400" />;

    const typeStr = notification.type || notification.action_type;
    switch (typeStr) {
      case 'photo_saved': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'tag_request': return <MessageCircle className="w-4 h-4 text-amber-400" />;
      case 'tag_approved': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'like': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-amber-400" />;
      default: return <BellRing className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBackgroundClass = () => {
    if (notification.is_read) return 'bg-transparent hover:bg-white/5';
    return 'bg-indigo-500/10 hover:bg-indigo-500/20';
  };

  const getTitle = () => {
    if (notification.title) return notification.title;
    
    const actorName = notification.actor?.full_name || 'Someone';
    const typeStr = notification.type || notification.action_type;
    switch (typeStr) {
      case 'tag_request': return `${actorName} tagged you in a photo`;
      case 'tag_approved': return `${actorName} approved your tag`;
      case 'photo_saved': return `${actorName} saved a photo of you`;
      default: return 'New notification';
    }
  };

  const getDescription = () => {
    if (notification.description) return notification.description;

    const typeStr = notification.type || notification.action_type;
    switch (typeStr) {
      case 'tag_request': return 'Click to review and approve the tag.';
      case 'tag_approved': return 'Your tag is now visible on the photo.';
      case 'photo_saved': return 'A photo you are tagged in was saved.';
      default: return '';
    }
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
          {getTitle()}
        </p>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {getDescription()}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">
          {timeAgo}
        </p>
      </div>
    </div>
  );
};
