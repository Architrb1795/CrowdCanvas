/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import MediaGalleryGrid from '@/components/media/MediaGalleryGrid';

interface DiscoverClientProps {
  initialMedia: any[];
}

export default function DiscoverClient({ initialMedia }: DiscoverClientProps) {
  // Use the existing MediaGalleryGrid to display items.
  // canManageEvent is false because this is a public feed.
  // We can pass currentUserId if we had it, but here it's mostly view-only.
  return (
    <div className="animate-in fade-in duration-500">
      <MediaGalleryGrid mediaItems={initialMedia} canManageEvent={false} />
    </div>
  );
}
