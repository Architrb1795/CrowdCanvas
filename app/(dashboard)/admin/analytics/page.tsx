'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Target, MousePointerClick, Eye, BrainCircuit } from 'lucide-react';

interface CategoryStat {
    category: string;
    views: number;
    clicks: number;
    ctr: number;
}

interface AnalyticsData {
    success: boolean;
    funnel: {
        generated: number;
        viewed: number;
        clicked: number;
        ignored: number;
    };
    overallCtr: number;
    categories: CategoryStat[];
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics')
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
        return <div className="p-8 text-center text-slate-400"><div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-4"></div><p>Loading Analytics...</p></div>;
    }

    if (!data) return <div className="p-8 text-center text-red-400">Failed to load analytics</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 pt-24 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-indigo-500" />
                    Recommendation Engine Analytics
                </h1>
                <p className="text-slate-400 mt-2">Self-learning foundation and performance metrics.</p>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard icon={<Target />} title="Overall CTR" value={`${data.overallCtr}%`} subtext="Clicks per View" color="text-emerald-400" />
                <MetricCard icon={<Eye />} title="Total Views" value={data.funnel.viewed.toLocaleString()} subtext="Cards entering viewport" color="text-blue-400" />
                <MetricCard icon={<MousePointerClick />} title="Total Clicks" value={data.funnel.clicked.toLocaleString()} subtext="Successful conversions" color="text-purple-400" />
                <MetricCard icon={<BarChart3 />} title="Generated" value={data.funnel.generated.toLocaleString()} subtext="Total candidates produced" color="text-indigo-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400"/> Recommendation Funnel</h2>
                    <div className="space-y-4">
                        <FunnelBar label="Generated" value={data.funnel.generated} max={data.funnel.generated} color="bg-indigo-500" />
                        <FunnelBar label="Viewed" value={data.funnel.viewed} max={data.funnel.generated} color="bg-blue-500" />
                        <FunnelBar label="Clicked" value={data.funnel.clicked} max={data.funnel.generated} color="bg-purple-500" />
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400"/> Top Categories by CTR</h2>
                    <div className="space-y-4">
                        {data.categories.length === 0 && <p className="text-slate-500 text-sm">No category data yet.</p>}
                        {data.categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <div>
                                    <h3 className="font-medium text-slate-200">{cat.category as string}</h3>
                                    <p className="text-xs text-slate-500">{cat.views as number} views • {cat.clicks as number} clicks</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-emerald-400">{cat.ctr}%</span>
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

function FunnelBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className="text-slate-400">{value.toLocaleString()}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}
