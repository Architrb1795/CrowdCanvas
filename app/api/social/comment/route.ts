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

    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            updated_at,
            user_id,
            profiles:user_id (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('media_id', mediaId)
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform nested profiles structure to flat structure for easier frontend consumption
    // Supabase JS returns nested objects for joins
    const formattedComments = data?.map((comment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_id: comment.user_id,
        user_name: comment.profiles?.full_name || 'Anonymous',
        user_avatar: comment.profiles?.avatar_url || null
    }));

    return NextResponse.json({ comments: formattedComments });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { mediaId, content } = body;

        if (!mediaId || !content || content.trim() === '') {
            return NextResponse.json({ error: 'mediaId and content are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('comments')
            .insert({ 
                media_id: mediaId, 
                user_id: session.user.id,
                content: content.trim()
            })
            .select(`
                id,
                content,
                created_at,
                updated_at,
                user_id,
                profiles:user_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Fetch media owner and title for notification
        const { data: mediaDataRaw } = await supabase
            .from('media')
            .select('uploaded_by, title')
            .eq('id', mediaId)
            .single();

        const mediaData = mediaDataRaw as unknown as { uploaded_by: string; title: string | null };

        if (mediaData && mediaData.uploaded_by) {
            const commenterName = session.user.user_metadata?.full_name || 'Someone';
            await NotificationService.notifyComment(
                mediaData.uploaded_by,
                session.user.id,
                commenterName,
                mediaData.title || '',
                mediaId
            );
        }

        // Format similarly to GET
        const typedData = data;
        
        const formattedComment = {
            id: typedData?.id,
            content: typedData?.content,
            created_at: typedData?.created_at,
            updated_at: typedData?.updated_at,
            user_id: typedData?.user_id,
            user_name: typedData?.profiles?.full_name || 'Anonymous',
            user_avatar: typedData?.profiles?.avatar_url || null
        };

        return NextResponse.json({ success: true, comment: formattedComment });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { commentId, content } = body;

        if (!commentId || !content || content.trim() === '') {
            return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('comments')
            .update({ content: content.trim() })
            .eq('id', commentId)
            .eq('user_id', session.user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
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
        const { commentId } = body;

        if (!commentId) {
            return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', session.user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}
