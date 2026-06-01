'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Users, Target, Activity, Zap } from 'lucide-react';

interface Interest {
    name: string;
    weight: number;
}

interface AnalyticsData {
    success: boolean;
    ctr: {
        personalized: number;
        generic: number;
        lift: number;
    };
    funnel: {
        personalizedViews: number;
        personalizedClicks: number;
        genericViews: number;
        genericClicks: number;
    };
    profiles: {
        totalActive: number;
        averageEngagement: number;
        topInterests: Interest[];
    };
}

export default function PersonalizationDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/personalization')
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400"><div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-4"></div><p>Loading Personalization Engine...</p></div>;
    }

    if (!data) return <div className="p-8 text-center text-red-400">Failed to load personalization analytics</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 pt-24 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                    Personalization Engine V1
                </h1>
                <p className="text-slate-400 mt-2">Monitoring user-specific recommendation performance and interest clustering.</p>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard icon={<Zap />} title="Personalization Lift" value={`${data.ctr.lift > 0 ? '+' : ''}${data.ctr.lift}%`} subtext="vs Generic CTR" color="text-amber-400" />
                <MetricCard icon={<Target />} title="Personalized CTR" value={`${data.ctr.personalized}%`} subtext={`${data.funnel.personalizedClicks} clicks / ${data.funnel.personalizedViews} views`} color="text-emerald-400" />
                <MetricCard icon={<Activity />} title="Generic CTR" value={`${data.ctr.generic}%`} subtext={`${data.funnel.genericClicks} clicks / ${data.funnel.genericViews} views`} color="text-slate-400" />
                <MetricCard icon={<Users />} title="Active Profiles" value={data.profiles.totalActive.toLocaleString()} subtext={`Avg Engagement: ${data.profiles.averageEngagement}`} color="text-indigo-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lift Visualizer */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-400"/> Conversion Comparison</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-emerald-400 font-bold">Personalized Feed</span>
                                <span className="text-emerald-400 font-bold">{data.ctr.personalized}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(data.ctr.personalized, 100)}%` }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400 font-medium">Generic Feed (Cold Start)</span>
                                <span className="text-slate-400 font-medium">{data.ctr.generic}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.min(data.ctr.generic, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top User Interests */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400"/> Global User Interests</h2>
                    <div className="space-y-4">
                        {data.profiles.topInterests.length === 0 && <p className="text-slate-500 text-sm">No interest data accumulated yet.</p>}
                        {data.profiles.topInterests.map((interest, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <span className="text-indigo-400 font-bold w-4">{idx + 1}.</span>
                                    <h3 className="font-medium text-slate-200 capitalize">{interest.name}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-slate-400">Weight: {interest.weight.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon, title, value, subtext, color }: { icon: React.ReactNode, title: string, value: string, subtext: string, color: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
                <span className="text-slate-400 font-medium text-sm">{title}</span>
                <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                </div>
            </div>
            <div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{subtext}</div>
            </div>
        </div>
    );
}
