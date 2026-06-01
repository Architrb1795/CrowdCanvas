import React, { useEffect, useRef, useState } from 'react';
import { RecommendedMedia } from '@/lib/recommendation/types';

interface RecommendationCardProps {
    media: RecommendedMedia;
    sourceMediaId: string;
    sessionId: string;
    currentUserId?: string;
    onClick: () => void;
    position: number;
}

export function RecommendationCard({ media, sourceMediaId, sessionId, currentUserId, onClick, position }: RecommendationCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [viewStartTime, setViewStartTime] = useState<number | null>(null);
    const hasBeenViewed = useRef(false);
    const hasBeenClicked = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && !hasBeenViewed.current) {
                // It just came into view!
                hasBeenViewed.current = true;
                setViewStartTime(Date.now());
                
                // Track Viewed
                fetch('/api/ai/recommend/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source_media_id: sourceMediaId,
                        recommended_media_id: media.id,
                        event_type: 'viewed',
                        session_id: sessionId,
                        user_id: currentUserId,
                        position,
                        score: media.matchPercentage,
                        category: media.category,
                        reason: media.reason
                    })
                }).catch(() => {});
            }
        }, { threshold: 0.5 }); // Trigger when 50% visible

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            observer.disconnect();
            
            // On unmount, if it was viewed but never clicked, log Ignored
            if (hasBeenViewed.current && !hasBeenClicked.current && viewStartTime) {
                const duration = Date.now() - viewStartTime;
                fetch('/api/ai/recommend/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true, // Ensure it sends even if unmounting/closing
                    body: JSON.stringify({
                        source_media_id: sourceMediaId,
                        recommended_media_id: media.id,
                        event_type: 'ignored',
                        session_id: sessionId,
                        user_id: currentUserId,
                        position,
                        view_duration_ms: duration,
                        score: media.matchPercentage,
                        category: media.category,
                        reason: media.reason
                    })
                }).catch(() => {});
            }
        };
    }, [media, sourceMediaId, sessionId, currentUserId, position, viewStartTime]);

    const handleClick = () => {
        hasBeenClicked.current = true;
        const duration = viewStartTime ? Date.now() - viewStartTime : 0;
        
        // Track Clicked
        fetch('/api/ai/recommend/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_media_id: sourceMediaId,
                recommended_media_id: media.id,
                event_type: 'clicked',
                session_id: sessionId,
                user_id: currentUserId,
                position,
                view_duration_ms: duration,
                score: media.matchPercentage,
                category: media.category,
                reason: media.reason
            })
        }).catch(() => {});

        onClick();
    };

    return (
        <div 
            ref={cardRef}
            onClick={handleClick}
            className="group flex gap-3 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl cursor-pointer transition-all border border-slate-700/50 hover:border-indigo-500/50"
        >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img src={media.thumbnail_url || media.file_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="Similar" />
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded text-white border border-white/10">
                {media.matchPercentage}%
                </div>
            </div>
            <div className="flex flex-col justify-center flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1 inline-block truncate">{media.category}</span>
                <p className="text-xs text-slate-300 line-clamp-2 leading-snug">{media.reason}</p>
            </div>
        </div>
    );
}
