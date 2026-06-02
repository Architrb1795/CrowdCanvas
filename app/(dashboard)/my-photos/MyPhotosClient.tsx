'use client';

import { useState } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, Share2, ScanFace, Calendar, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Photo {
  id: string;
  matchId: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  similarity: number;
  status: string;
  createdAt: string;
}

interface EventGroup {
  id: string;
  name: string;
  date: string;
  photos: Photo[];
}

export function MyPhotosClient({ groupedEvents }: { groupedEvents: EventGroup[] }) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const getConfidenceTier = (score: number) => {
    // Convert cosine distance (0-1) to confidence %
    const conf = score * 100;
    if (conf >= 95) return { label: 'High Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (conf >= 85) return { label: 'Good Match', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    return { label: 'Possible Match', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  };

  const filteredEvents = groupedEvents.map(event => {
    const filteredPhotos = event.photos.filter(photo => {
      const conf = photo.similarity * 100;
      if (filter === 'high') return conf >= 95;
      if (filter === 'medium') return conf >= 85;
      return conf >= 70; // Hide <70% automatically
    });
    return { ...event, photos: filteredPhotos };
  }).filter(e => e.photos.length > 0);

  const totalPhotos = filteredEvents.reduce((acc, e) => acc + e.photos.length, 0);

  if (groupedEvents.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SectionHeader 
          title="My Photos" 
          subtitle="Your personalized gallery powered by AI." 
        />
        
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <ScanFace className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Photos Found Yet</h3>
          <p className="text-slate-400 max-w-md mb-8">
            Your face profile is active, but we haven&apos;t found any matches in your events yet. As new photos are uploaded, they will automatically appear here!
          </p>
          <Button variant="gradient" onClick={() => window.location.href = '/events'}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionHeader 
          title="My Photos" 
          subtitle={`We found ${totalPhotos} photos of you across ${filteredEvents.length} events.`} 
          className="mb-0"
        />
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All Matches
          </button>
          <button 
            onClick={() => setFilter('high')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'high' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            High Confidence
          </button>
        </div>
      </div>

      {filteredEvents.map((event) => (
        <div key={event.id} className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              {event.name}
            </h3>
            <Link href={`/media?eventId=${event.id}`}>
              <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                View Full Event
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {event.photos.map((photo) => {
              const tier = getConfidenceTier(photo.similarity);
              return (
                <Card key={photo.id} className="group relative overflow-hidden border-white/5 bg-slate-950/50 hover:border-indigo-500/30 transition-all duration-300">
                  <div className="aspect-[4/5] relative bg-slate-900">
                    <Image
                      src={photo.thumbnailUrl || photo.url}
                      alt="Match"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    
                    {/* Confidence Badge */}
                    <div className="absolute top-2 left-2">
                      <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 backdrop-blur-md ${tier.color}`}>
                        <Sparkles className="w-3 h-3" />
                        {Math.round(photo.similarity * 100)}% Match
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Button size="icon" variant="outline" className="bg-slate-900/80 border-white/10 hover:bg-white hover:text-slate-900" onClick={() => handleDownload(photo.url)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="bg-slate-900/80 border-white/10 hover:bg-indigo-600 hover:text-white hover:border-indigo-600">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No photos match the selected confidence filter.</p>
          <Button variant="ghost" onClick={() => setFilter('all')} className="mt-4">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
