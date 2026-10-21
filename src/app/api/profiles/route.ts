import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, program, department, bio, skills, project_title, project_description, deployment_url, repository_url } = body;

    if (!full_name || !email || !project_title || !deployment_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .insert([{ full_name, email, program, department, bio, skills, project_title, project_description, deployment_url, repository_url }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
