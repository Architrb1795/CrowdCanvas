import { SupabaseClient } from '@supabase/supabase-js';

export type BehaviorEventType = 'image_view' | 'search' | 'recommendation_click' | 'upload';

interface BehaviorEvent {
    userId: string;
    eventType: BehaviorEventType;
    mediaId?: string;
    eventId?: string;
    searchQuery?: string;
    weightContribution: number;
}

/**
 * Tracks a user behavior event and updates their personal preference profile asynchronously.
 */
export async function trackUserBehavior(supabaseAdmin: SupabaseClient, event: BehaviorEvent) {
    try {
        // 1. Insert the granular behavior event
        const { error: eventError } = await supabaseAdmin
            .from('user_behavior_events')
            .insert({
                user_id: event.userId,
                event_type: event.eventType,
                media_id: event.mediaId,
                event_id: event.eventId,
                search_query: event.searchQuery,
                weight_contribution: event.weightContribution
            });

        if (eventError) {
            console.error('Failed to insert user behavior event:', eventError);
            return;
        }

        // 2. If it's a media-related event, update the preference profile
        if (event.mediaId) {
            // Run profile update asynchronously so it doesn't block the response
            updatePreferenceProfile(supabaseAdmin, event.userId, event.mediaId, event.weightContribution).catch(err => {
                console.error('Failed to update preference profile asynchronously:', err);
            });
        }

    } catch (error) {
        console.error('Behavior Tracking Error:', error);
    }
}

async function updatePreferenceProfile(supabaseAdmin: SupabaseClient, userId: string, mediaId: string, weight: number) {
    // 1. Fetch the media data to learn what the user is interacting with
    const { data: media, error: mediaError } = await supabaseAdmin
        .from('media')
        .select('embedding, ai_tags, mood, scene_type, event_id')
        .eq('id', mediaId)
        .single();

    if (mediaError || !media) return;

    // 2. Fetch the user's current profile (or create one if it doesn't exist)
    const { data: profile } = await supabaseAdmin
        .from('user_preference_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    const newProfile = profile ? { ...profile } : {
        user_id: userId,
        favorite_tags: {} as Record<string, number>,
        favorite_moods: {} as Record<string, number>,
        favorite_scenes: {} as Record<string, number>,
        favorite_events: {} as Record<string, number>,
        engagement_score: 0.0,
        interest_embedding: null
    };

    // 3. Update Categorical Frequencies (Tags, Moods, Scenes, Events)
    if (media.ai_tags && Array.isArray(media.ai_tags)) {
        media.ai_tags.forEach((tag: string) => {
            newProfile.favorite_tags[tag] = (newProfile.favorite_tags[tag] || 0) + weight;
        });
    }
    if (media.mood) {
        newProfile.favorite_moods[media.mood] = (newProfile.favorite_moods[media.mood] || 0) + weight;
    }
    if (media.scene_type) {
        newProfile.favorite_scenes[media.scene_type] = (newProfile.favorite_scenes[media.scene_type] || 0) + weight;
    }
    if (media.event_id) {
        newProfile.favorite_events[media.event_id] = (newProfile.favorite_events[media.event_id] || 0) + weight;
    }

    // 4. Update Engagement Score
    newProfile.engagement_score += weight;

    // 5. Update Interest Embedding (Decaying Average)
    let updatedEmbedding: number[] | null = null;
    
    // Convert DB vector string back to array if it exists
    const parseVector = (vec: unknown) => {
        if (!vec) return null;
        if (Array.isArray(vec)) return vec;
        if (typeof vec === 'string') {
            try {
                return JSON.parse(vec);
            } catch {
                return null;
            }
        }
        return null;
    };

    const mediaEmbedding = parseVector(media.embedding);
    const profileEmbedding = parseVector(newProfile.interest_embedding);

    if (mediaEmbedding) {
        if (!profileEmbedding) {
            updatedEmbedding = mediaEmbedding;
        } else {
            // Blending formula: Shift the user's vector slightly towards the new media
            // For stability, we take 90% of old profile + 10% of new media, adjusted by weight
            const learningRate = Math.min(0.15, 0.05 * weight); 
            updatedEmbedding = profileEmbedding.map((val: number, i: number) => {
                return (val * (1 - learningRate)) + (mediaEmbedding[i] * learningRate);
            });
        }
    }

    // 6. Save Profile Back to DB
    // We convert embedding to proper pgvector string format `[v1,v2,...]`
    const vectorString = updatedEmbedding ? JSON.stringify(updatedEmbedding) : null;

    const { error: upsertError } = await supabaseAdmin
        .from('user_preference_profiles')
        .upsert({
            user_id: userId,
            favorite_tags: newProfile.favorite_tags,
            favorite_moods: newProfile.favorite_moods,
            favorite_scenes: newProfile.favorite_scenes,
            favorite_events: newProfile.favorite_events,
            engagement_score: newProfile.engagement_score,
            interest_embedding: vectorString,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (upsertError) {
        console.error('Failed to upsert preference profile:', upsertError);
    }

    // 7. Update Analytics Dashboard Metrics (Personalized vs Generic CTR)
    // If the profile HAD enough engagement before this event, the feed they are clicking on is considered "personalized"
    const isPersonalizedFeed = (profile?.engagement_score || 0) >= 2.0;
    
    // We update the daily dashboard table
    if (userId && (weight === 0.5 || weight === 2.0)) { // 0.5 = view, 2.0 = click
        const today = new Date().toISOString().split('T')[0];
        
        // Let's use RPC or atomic update to increment views/clicks
        // First check if a row exists
        const { data: metricsRow } = await supabaseAdmin
            .from('personalized_recommendation_metrics')
            .select('*')
            .eq('user_id', userId)
            .eq('report_date', today)
            .eq('is_personalized', isPersonalizedFeed)
            .single();

        if (metricsRow) {
            await supabaseAdmin
                .from('personalized_recommendation_metrics')
                .update({
                    views: metricsRow.views + (weight === 0.5 ? 1 : 0),
                    clicks: metricsRow.clicks + (weight === 2.0 ? 1 : 0)
                })
                .eq('id', metricsRow.id);
        } else {
            await supabaseAdmin
                .from('personalized_recommendation_metrics')
                .insert({
                    user_id: userId,
                    report_date: today,
                    is_personalized: isPersonalizedFeed,
                    views: weight === 0.5 ? 1 : 0,
                    clicks: weight === 2.0 ? 1 : 0
                });
        }
    }
}
