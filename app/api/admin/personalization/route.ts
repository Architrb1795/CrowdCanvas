import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // 1. Fetch Personalization Metrics
        const { data: metrics, error: metricsError } = await supabaseAdmin
            .from('personalized_recommendation_metrics')
            .select('*');

        if (metricsError) throw metricsError;

        let personalizedViews = 0;
        let personalizedClicks = 0;
        let genericViews = 0;
        let genericClicks = 0;

        metrics.forEach(m => {
            if (m.is_personalized) {
                personalizedViews += m.views;
                personalizedClicks += m.clicks;
            } else {
                genericViews += m.views;
                genericClicks += m.clicks;
            }
        });

        const personalizedCtr = personalizedViews > 0 ? (personalizedClicks / personalizedViews) * 100 : 0;
        const genericCtr = genericViews > 0 ? (genericClicks / genericViews) * 100 : 0;
        
        let liftPercentage = 0;
        if (genericCtr > 0) {
            liftPercentage = ((personalizedCtr - genericCtr) / genericCtr) * 100;
        } else if (personalizedCtr > 0) {
            liftPercentage = 100; // Infinite lift if generic is 0 but personalized is > 0
        }

        // 2. Fetch User Profile Aggregate Data (Top Interests)
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('user_preference_profiles')
            .select('favorite_tags, engagement_score');
            
        if (profileError) throw profileError;

        const globalTags: Record<string, number> = {};
        let totalProfiles = 0;
        let avgEngagement = 0;

        profiles.forEach(p => {
            totalProfiles++;
            avgEngagement += p.engagement_score;
            
            if (p.favorite_tags) {
                const tags = p.favorite_tags as Record<string, number>;
                Object.keys(tags).forEach(tag => {
                    globalTags[tag] = (globalTags[tag] || 0) + tags[tag];
                });
            }
        });

        if (totalProfiles > 0) avgEngagement /= totalProfiles;

        // Sort top 10 tags
        const topInterests = Object.keys(globalTags)
            .map(tag => ({ name: tag, weight: globalTags[tag] }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 10);

        return NextResponse.json({
            success: true,
            ctr: {
                personalized: parseFloat(personalizedCtr.toFixed(2)),
                generic: parseFloat(genericCtr.toFixed(2)),
                lift: parseFloat(liftPercentage.toFixed(2))
            },
            funnel: {
                personalizedViews,
                personalizedClicks,
                genericViews,
                genericClicks
            },
            profiles: {
                totalActive: totalProfiles,
                averageEngagement: parseFloat(avgEngagement.toFixed(2)),
                topInterests
            }
        });

    } catch (error: unknown) {
        console.error('Personalization Analytics Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch personalization analytics' }, { status: 500 });
    }
}
