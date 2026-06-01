import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
        return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user has liked this media
    const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('media_id', mediaId)
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count of likes for this media
    const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('media_id', mediaId);

    if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    return NextResponse.json({ hasLiked: !!data, likesCount: count || 0 });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { mediaId } = body;

        if (!mediaId) {
            return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
        }

        // We use an upsert with onConflict on unique(user_id, media_id) or just try inserting
        // RLS will ensure user_id matches auth.uid()
        const { error } = await supabase
            .from('likes')
            .insert({ media_id: mediaId, user_id: session.user.id });

        if (error) {
            // 23505 is PostgreSQL unique violation code
            if (error.code === '23505') {
                 return NextResponse.json({ success: true, message: 'Already liked' });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch media owner and title for notification
        const { data } = await supabase
            .from('media')
            .select('uploaded_by, title')
            .eq('id', mediaId)
            .single();

        const mediaData = data as unknown as { uploaded_by: string; title: string | null };

        if (mediaData && mediaData.uploaded_by) {
            const likerName = session.user.user_metadata?.full_name || 'Someone';
            await NotificationService.notifyLike(
                mediaData.uploaded_by,
                session.user.id,
                likerName,
                mediaData.title || '',
                mediaId
            );
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { mediaId } = body;

        if (!mediaId) {
            return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('media_id', mediaId)
            .eq('user_id', session.user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}
