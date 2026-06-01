import { createClient } from '@supabase/supabase-js';

// We need an admin client to bypass RLS when creating notifications from our API routes
// because the sender (actor) might not have permissions to write to the recipient's notifications.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type NotificationCategory = 'social' | 'media' | 'event' | 'ai' | 'system';

export interface CreateNotificationParams {
  userId: string; // The recipient
  actorId?: string; // The person who triggered the action
  category: NotificationCategory;
  actionType: string;
  title: string;
  description?: string;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Creates a notification for a user.
   * This should primarily be called from server-side API routes.
   */
  static async create(params: CreateNotificationParams) {
    if (!params.userId) return { error: new Error('User ID is required') };

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: params.userId,
        actor_id: params.actorId || null,
        category: params.category,
        action_type: params.actionType,
        title: params.title,
        description: params.description || null,
        action_url: params.actionUrl || null,
        icon: params.icon || null,
        metadata: params.metadata || {}
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return { error };
    }

    return { success: true };
  }

  /**
   * Optional helper to dispatch specific notification types cleanly
   */
  static async notifyLike(ownerId: string, likerId: string, likerName: string, mediaTitle: string, mediaId: string) {
    if (ownerId === likerId) return; // Don't notify if user likes their own media
    
    return this.create({
      userId: ownerId,
      actorId: likerId,
      category: 'social',
      actionType: 'like',
      title: 'Someone liked your photo',
      description: `${likerName} liked "${mediaTitle || 'your media'}"`,
      actionUrl: `/media?id=${mediaId}`,
      icon: 'heart'
    });
  }

  static async notifyComment(ownerId: string, commenterId: string, commenterName: string, mediaTitle: string, mediaId: string) {
    if (ownerId === commenterId) return;
    
    return this.create({
      userId: ownerId,
      actorId: commenterId,
      category: 'social',
      actionType: 'comment',
      title: 'Someone commented',
      description: `${commenterName} commented on "${mediaTitle || 'your media'}"`,
      actionUrl: `/media?id=${mediaId}`,
      icon: 'message-circle'
    });
  }

  static async notifyShare(ownerId: string, sharerId: string, sharerName: string, shareType: string, mediaTitle: string, mediaId: string) {
    if (ownerId === sharerId) return;

    return this.create({
      userId: ownerId,
      actorId: sharerId,
      category: 'social',
      actionType: 'share',
      title: 'Media Shared',
      description: `${sharerName} shared "${mediaTitle || 'your media'}" via ${shareType}`,
      actionUrl: `/media?id=${mediaId}`,
      icon: 'share-2'
    });
  }

  static async notifyAIAnalysis(ownerId: string, mediaTitle: string, mediaId: string) {
    return this.create({
      userId: ownerId,
      category: 'ai',
      actionType: 'ai_analysis_completed',
      title: 'AI Analysis Completed',
      description: `Analysis complete for "${mediaTitle || 'your media'}"`,
      actionUrl: `/media?id=${mediaId}`,
      icon: 'sparkles'
    });
  }
}
