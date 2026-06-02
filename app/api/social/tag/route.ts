import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = supabase.from('photo_user_tags').select('*, tagged_user:profiles!photo_user_tags_tagged_user_id_fkey(*)');

    if (mediaId) query = query.eq('media_id', mediaId);
    if (userId) query = query.eq('tagged_user_id', userId);
    if (status) query = query.eq('status', status as any /* eslint-disable-line @typescript-eslint/no-explicit-any */);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ tags: data });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mediaId, taggedUserId, xCoordinate, yCoordinate } = await request.json();
    if (!mediaId || !taggedUserId || xCoordinate === undefined || yCoordinate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check privacy settings of the tagged user
    const { data: privacySettings } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', taggedUserId)
      .single();

    if (privacySettings?.disable_tagging) {
      return NextResponse.json({ error: 'This user has disabled tagging.' }, { status: 403 });
    }

    // Determine initial status based on settings and who is tagging
    let initialStatus = 'pending';
    if (session.user.id === taggedUserId) {
      initialStatus = 'approved'; // Self tag is auto-approved
    } else if (privacySettings?.require_tag_approval === false) {
      initialStatus = 'approved';
    }

    const { data: tagData, error: tagError } = await supabase
      .from('photo_user_tags')
      .insert({
        media_id: mediaId,
        tagged_user_id: taggedUserId,
        tagged_by_user_id: session.user.id,
        x_coordinate: xCoordinate,
        y_coordinate: yCoordinate,
        status: initialStatus as any /* eslint-disable-line @typescript-eslint/no-explicit-any */
      })
      .select()
      .single();

    if (tagError) throw tagError;

    // Send notification if it wasn't a self-tag
    if (session.user.id !== taggedUserId) {
      await supabase.from('notifications').insert({
        user_id: taggedUserId,
        actor_id: session.user.id,
        type: initialStatus === 'pending' ? 'tag_request' : 'tag_approved',
        media_id: mediaId
      });
    }

    return NextResponse.json({ success: true, tag: tagData });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Error in tag POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tagId, status } = await request.json(); // status: 'approved', 'rejected', 'removed'
    if (!tagId || !status) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const { data: existingTag } = await supabase.from('photo_user_tags').select('*').eq('id', tagId).single();
    if (!existingTag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });

    // Only the tagged user (or perhaps event admin/tagger) can change the status
    if (existingTag.tagged_user_id !== session.user.id && existingTag.tagged_by_user_id !== session.user.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('photo_user_tags')
      .update({ status })
      .eq('id', tagId);

    if (error) throw error;

    // Notify the tagger if a tag was approved
    if (status === 'approved' && existingTag.tagged_user_id === session.user.id && existingTag.tagged_by_user_id !== session.user.id) {
      await supabase.from('notifications').insert({
        user_id: existingTag.tagged_by_user_id,
        actor_id: session.user.id,
        type: 'tag_approved',
        media_id: existingTag.media_id
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');
    if (!tagId) return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });

    const { error } = await supabase
      .from('photo_user_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
