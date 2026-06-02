import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (mediaId) {
      // Check if specific media is favourited
      const { data, error } = await supabase
        .from('media_favourites')
        .select('*')
        .eq('media_id', mediaId)
        .eq('user_id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      return NextResponse.json({ hasFavourited: !!data });
    }

    // Get all user favourites
    const { data, error } = await supabase
      .from('media_favourites')
      .select('*, media(*, events(*))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ favourites: data });

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Error in favourites GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mediaId } = await request.json();
    if (!mediaId) return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });

    // Insert favourite
    const { error } = await supabase
      .from('media_favourites')
      .insert({ user_id: session.user.id, media_id: mediaId });

    if (error) {
      // If constraint violation (already favourited), ignore or return success
      if (error.code === '23505') return NextResponse.json({ success: true, message: 'Already favourited' });
      throw error;
    }

    // Optionally notify the uploader (if we want, but usually saving is private)
    return NextResponse.json({ success: true });

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Error in favourites POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');
    if (!mediaId) return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });

    const { error } = await supabase
      .from('media_favourites')
      .delete()
      .eq('media_id', mediaId)
      .eq('user_id', session.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Error in favourites DELETE:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
