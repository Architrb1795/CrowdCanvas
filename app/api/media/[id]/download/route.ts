import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateCloudinaryWatermark(originalUrl: string, settings: any, role: string, userName: string, eventName: string) {
  if (!originalUrl.includes('cloudinary.com')) return originalUrl;
  if (!settings.watermark_enabled) return originalUrl;

  const opacity = settings.watermark_opacity || 50;
  
  // Determine Size based on role
  let size = settings.watermark_size || 40;
  if (['owner', 'admin', 'photographer'].includes(role)) {
    size = Math.max(20, size - 15); // Small
  } else if (['member', 'uploader'].includes(role)) {
    size = size; // Medium
  } else {
    size = size + 20; // Large for viewers/guests
  }

  // Parse custom text or use default
  let rawText = settings.watermark_text || eventName || 'CrowdCanvas';
  rawText = rawText.replace('{username}', userName).replace('{role}', role);
  // Cloudinary text needs spaces encoded as %20
  const text = encodeURIComponent(rawText).replace(/%20/g, '%20'); 

  // Base text transformation
  let transform = `l_text:Arial_${size}_bold:${text},co_white,o_${opacity}`;

  // Positioning & Style
  if (settings.watermark_style === 'diagonal') {
    transform += `,a_-45`; // Diagonal center
  } else if (settings.watermark_style === 'badge') {
    transform += `,g_south_west,x_20,y_20`; // Bottom left badge
  } else {
    transform += `,g_south_east,x_20,y_20`; // Bottom right default
  }

  // Add fl_attachment to force download
  transform += `/fl_attachment`;

  return originalUrl.replace('/upload/', `/upload/${transform}/`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get media and associated event
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*, events(id, name, watermark_enabled, watermark_text, watermark_style, watermark_opacity, watermark_size, watermark_logo_url)')
      .eq('id', id)
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = media.events as any;

    // Get current user and role
    const { data: { user } } = await supabase.auth.getUser();
    let role = 'guest';
    let userName = 'Guest';

    if (user) {
      userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      // Check event membership
      const { data: member } = await supabase
        .from('event_members')
        .select('role')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();
      
      if (member) role = member.role;
    }

    // Check permissions
    if (media.is_private && role === 'guest') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply Watermark if enabled
    let finalUrl = media.file_url;
    let isWatermarked = false;

    if (event?.watermark_enabled) {
      finalUrl = generateCloudinaryWatermark(media.file_url, event, role, userName, event.name);
      isWatermarked = true;
    }

    // Log the download activity if user is logged in
    if (user) {
      await supabase.from('shares').insert({
        media_id: media.id,
        user_id: user.id,
        share_type: 'download',
        is_watermarked: isWatermarked
      });
    }

    // Increment downloads_count on media table using admin client to bypass RLS
    const currentDownloads = media.downloads_count || 0;
    await supabaseAdmin
      .from('media')
      .update({ downloads_count: currentDownloads + 1 })
      .eq('id', id);

    return NextResponse.json({ url: finalUrl, filename: `crowdcanvas_${media.id}.jpg` });
  } catch (error: unknown) {
    console.error('Download Error:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}
