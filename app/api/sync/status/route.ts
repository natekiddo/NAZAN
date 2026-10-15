import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    let query = supabase
      .from('files')
      .select('id, original_name, storage_path, file_size, mime_type, checksum, project_id, folder_id, updated_at, is_trashed')
      .eq('user_id', user.id);

    if (since) {
      query = query.gt('updated_at', since);
    }

    const { data: files, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch active projects mapping
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, updated_at')
      .eq('user_id', user.id);

    return NextResponse.json({
      serverTime: new Date().toISOString(),
      files: files || [],
      projects: projects || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
