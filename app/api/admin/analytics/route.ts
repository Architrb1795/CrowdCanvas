// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Fetch raw event counts
        const { data: rawEvents, error } = await supabaseAdmin
            .from('recommendation_analytics')
            .select('event_type, category');

        if (error) throw error;

        // Fetch Social Counts
        const { count: totalLikes } = await supabaseAdmin.from('likes').select('*', { count: 'exact', head: true });
        const { count: totalComments } = await supabaseAdmin.from('comments').select('*', { count: 'exact', head: true });
        const { count: totalShares } = await supabaseAdmin.from('shares').select('*', { count: 'exact', head: true });
        const { count: totalFavourites } = await supabaseAdmin.from('media_favourites').select('*', { count: 'exact', head: true });
        
        // Tags
        const { count: totalTags } = await supabaseAdmin.from('photo_user_tags').select('*', { count: 'exact', head: true });
        const { count: totalAcceptedTags } = await supabaseAdmin.from('photo_user_tags').select('*', { count: 'exact', head: true }).eq('status', 'approved');
        const { count: totalRejectedTags } = await supabaseAdmin.from('photo_user_tags').select('*', { count: 'exact', head: true }).eq('status', 'rejected');

        // Aggregate
        let totalGenerated = 0;
        let totalViewed = 0;
        let totalClicked = 0;
        let totalIgnored = 0;

        const categoryStats: Record<string, { views: number, clicks: number }> = {};
        
        rawEvents.forEach(evt => {
            if (evt.event_type === 'generated') totalGenerated++;
            else if (evt.event_type === 'viewed') totalViewed++;
            else if (evt.event_type === 'clicked') totalClicked++;
            else if (evt.event_type === 'ignored') totalIgnored++;

            // Category tracking for views and clicks
            if (evt.event_type === 'viewed' || evt.event_type === 'clicked') {
                const cat = evt.category || 'Unknown';
                if (!categoryStats[cat]) categoryStats[cat] = { views: 0, clicks: 0 };
                if (evt.event_type === 'viewed') categoryStats[cat].views++;
                if (evt.event_type === 'clicked') categoryStats[cat].clicks++;
            }
        });

        // Calculate CTR per category
        const categories = Object.keys(categoryStats).map(cat => {
            const stats = categoryStats[cat];
            const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
            return {
                category: cat,
                views: stats.views,
                clicks: stats.clicks,
                ctr: parseFloat(ctr.toFixed(2))
            };
        }).sort((a, b) => b.ctr - a.ctr); // Sort highest CTR first

        const overallCtr = totalViewed > 0 ? (totalClicked / totalViewed) * 100 : 0;

        return NextResponse.json({
            success: true,
            funnel: {
                generated: totalGenerated,
                viewed: totalViewed,
                clicked: totalClicked,
                ignored: totalIgnored
            },
            social: {
                likes: totalLikes || 0,
                comments: totalComments || 0,
                shares: totalShares || 0,
                favourites: totalFavourites || 0
            },
            tags: {
                total: totalTags || 0,
                accepted: totalAcceptedTags || 0,
                rejected: totalRejectedTags || 0
            },
            overallCtr: parseFloat(overallCtr.toFixed(2)),
            categories
        });
        
    } catch (error: unknown) {
        console.error('Analytics Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
