import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Sparkles, BrainCircuit, Target, Activity } from 'lucide-react';
import { redirect } from 'next/navigation';
import { generateUserProfileInsight } from '@/lib/personalization/ai-insights';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function ProfileInsightsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile, error } = await supabaseAdmin
        .from('user_preference_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // If profile exists and summary is older than a day, or doesn't exist, regenerate it
    let summary = profile?.ai_profile_summary;
    if (profile && (!summary || (new Date().getTime() - new Date(profile.ai_summary_updated_at).getTime() > 24 * 60 * 60 * 1000))) {
        summary = await generateUserProfileInsight(supabaseAdmin, user.id);
    }

    const engagementScore = profile ? profile.engagement_score : 0;
    
    // Process tags
    const tags = profile?.favorite_tags ? Object.keys(profile.favorite_tags)
        .map(tag => ({ name: tag, weight: profile.favorite_tags[tag] }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5) : [];

    return (
        <div className="max-w-4xl mx-auto p-6 pt-24 space-y-8">
            <header className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-4 border border-amber-500/20">
                    <BrainCircuit className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">Your AI Insights</h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    CrowdCanvas learns what you love. As you interact with photos and events, our personalization engine builds a unique profile to recommend better content.
                </p>
            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-48 h-48 text-amber-500" />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        AI Profile Summary
                    </h2>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mt-4">
                        <p className="text-lg text-emerald-100 leading-relaxed font-medium">
                            {summary || "You haven't interacted with enough content yet! Keep exploring to build your profile."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <h2 className="text-xl font-bold text-slate-300 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-400" />
                        Your Top Interests
                    </h2>
                    {tags.length > 0 ? (
                        <div className="space-y-4">
                            {tags.map((tag, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl">
                                    <span className="font-medium text-slate-200 capitalize">{tag.name}</span>
                                    <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((tag.weight / tags[0].weight) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500">No interest data accumulated yet.</p>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                    <Activity className="w-12 h-12 text-indigo-400 mb-4" />
                    <h2 className="text-xl font-bold text-slate-300 mb-2">Profile Maturity</h2>
                    <div className="text-5xl font-black text-white my-4">{Math.round(engagementScore)}</div>
                    <p className="text-slate-400 text-sm">
                        Engagement Score. Higher scores mean the engine has a stronger understanding of your preferences.
                    </p>
                </div>
            </div>
        </div>
    );
}
