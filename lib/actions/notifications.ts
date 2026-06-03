/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { ServerActionResponse } from './event_members';

export interface CreateNotificationParams {
  user_id: string;
  actor_id?: string;
  type: string;
  category?: string;
  title?: string;
  description?: string;
  action_url?: string;
  icon?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<ServerActionResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        actor_id: params.actor_id,
        type: params.type as any,
        category: params.category || 'system',
        title: params.title,
        description: params.description,
        action_url: params.action_url,
        icon: params.icon
      });

    if (error) throw error;
    
    return { success: true };
  } catch (err: any) {
    console.error('Error creating notification:', err);
    return { success: false, error: err.message };
  }
}
