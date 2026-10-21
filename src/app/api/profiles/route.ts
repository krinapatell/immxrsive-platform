import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*');

    if (studentError) throw studentError;

    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*');

    return NextResponse.json({ 
      profiles: students || [], 
      projects: projects || [] 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
