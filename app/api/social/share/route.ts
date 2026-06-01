import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Note: We might want to allow anonymous tracking of shares if the event is public,
    // but the DB schema `shares` table requires `user_id` to not be null implicitly if it references profiles.
    // Actually, `user_id` is defined as `user_id UUID REFERENCES profiles(id) ON DELETE CASCADE`.
    // It can technically be NULL if not specified as NOT NULL in the table, but the type might be string | null.
    // Let's enforce auth for tracking to ensure quality data, or fallback to null user_id if anonymous.

    try {
        const body = await request.json();
        const { mediaId, shareType } = body;

        if (!mediaId || !shareType) {
            return NextResponse.json({ error: 'mediaId and shareType are required' }, { status: 400 });
        }

        const validTypes = ['copy_link', 'whatsapp', 'twitter', 'facebook', 'download'];
        if (!validTypes.includes(shareType)) {
            return NextResponse.json({ error: 'Invalid shareType' }, { status: 400 });
        }

        const userId = session?.user?.id || null;

        const { error } = await supabase
            .from('shares')
            .insert({ 
                media_id: mediaId, 
                user_id: userId,
                share_type: shareType as "whatsapp" | "twitter" | "facebook" | "copy_link" | "download"
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data } = await supabase
            .from('media')
            .select('uploaded_by, title')
            .eq('id', mediaId)
            .single();

        const mediaData = data as unknown as { uploaded_by: string; title: string | null };

        if (mediaData && mediaData.uploaded_by && userId) {
            const sharerName = session?.user?.user_metadata?.full_name || 'Someone';
            await NotificationService.notifyShare(
                mediaData.uploaded_by,
                userId,
                sharerName,
                shareType,
                mediaData.title || '',
                mediaId
            );
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}
