import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  const { data, error } = await supabase
    .from('students')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, program, department, headline, skills, deployment_url, repository_url } = body;

    const { data, error } = await supabase
      .from('students')
      .insert([{ name, email, program, department, headline, skills, deployment_url, repository_url }])
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
