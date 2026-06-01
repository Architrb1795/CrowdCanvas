import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { event_id, file_url, media_type, tags, is_private } = body as {
      event_id?: string | null;
      file_url: string;
      media_type?: 'photo' | 'video' | null;
      tags?: string[] | null;
      is_private?: boolean;
    };

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('media') as any).insert({
      event_id,
      file_url,
      media_type,
      uploaded_by: user.id,
      tags,
      is_private
    }).select().single() as unknown as { data: Record<string, unknown> | null; error: { message: string } | null };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data && data.id) {
      await NotificationService.create({
        userId: user.id,
        category: 'media',
        actionType: 'media_uploaded',
        title: 'Media Uploaded',
        description: 'Your media was uploaded successfully and is being processed.',
        actionUrl: `/media?id=${data.id}`,
        icon: 'upload-cloud'
      });
    }

    return NextResponse.json({ data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
