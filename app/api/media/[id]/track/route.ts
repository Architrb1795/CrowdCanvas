import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Increment counters based on the action
    let incrementColumn = '';
    if (action === 'view') incrementColumn = 'views_count';
    else if (action === 'share') incrementColumn = 'shares_count';
    else if (action === 'download') incrementColumn = 'downloads_count';
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    // Use RPC to safely increment if possible, or just read and update.
    // For simplicity, we'll do a read and update here, though in production
    // a PostgreSQL function `increment_counter` would be better for concurrency.
    const { data: media, error: readError } = await supabase
      .from('media')
      .select(incrementColumn)
      .eq('id', id)
      .single();

    if (readError) throw readError;

    const rawValue = media[incrementColumn as keyof typeof media];
    const currentValue = typeof rawValue === 'number' ? rawValue : 0;
    
    const updateData = { [incrementColumn]: currentValue + 1 };
    
    const { error: updateError } = await supabase
      .from('media')
      .update(updateData as any)
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newValue: currentValue + 1 });
  } catch (error: any) {
    console.error('Error tracking media action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
