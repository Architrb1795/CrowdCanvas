// app/api/ai/recommend/track/route.ts

import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { trackUserBehavior, BehaviorEventType } from '@/lib/personalization/profile-updater';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Support batch array or single object
    const events = Array.isArray(body) ? body : [body];
    
    const validEvents = events.map(evt => {
        return {
            source_media_id: evt.source_media_id,
            recommended_media_id: evt.recommended_media_id,
            event_type: evt.event_type,
            position: evt.position || 0,
            score: evt.score || 0,
            category: evt.category || 'Unknown',
            reason: evt.reason || 'Unknown',
            session_id: evt.session_id || null,
            user_id: evt.user_id || null,
            view_duration_ms: evt.view_duration_ms || null
        }
    }).filter(e => e.source_media_id && e.recommended_media_id && e.event_type);

    if (validEvents.length > 0) {
        const { error } = await supabaseAdmin.from('recommendation_analytics').insert(validEvents);
        if (error) {
            console.error('Failed to insert recommendation analytic batch:', error);
        }

        // --- Personalization Tracking ---
        // Fetch logged in user to tie behaviors to their profile
        // Note: fetch() from client may not send cookies, so we also rely on the explicit user_id in the payload
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        for (const evt of validEvents) {
            const resolvedUserId = evt.user_id || user?.id;
            
            if (resolvedUserId) {
                // If they clicked it, that's a strong signal (weight 2.0)
                // If they viewed it, weak signal (weight 0.5)
                let weight = 0;
                let bType: BehaviorEventType | null = null;
                
                if (evt.event_type === 'clicked') {
                    weight = 2.0;
                    bType = 'recommendation_click';
                } else if (evt.event_type === 'viewed') {
                    weight = 0.5;
                    bType = 'image_view';
                }

                if (bType && weight > 0) {
                    await trackUserBehavior(supabaseAdmin, {
                        userId: resolvedUserId,
                        eventType: bType,
                        mediaId: evt.recommended_media_id,
                        weightContribution: weight
                    });
                }
            }
        }
    }

    return NextResponse.json({ success: true, tracked: validEvents.length });

  } catch (error: unknown) {
    console.error('Recommendation Tracking Error:', error);
    return NextResponse.json({ success: false }, { status: 500 }); // Silent fail for client
  }
}
