import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*');

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Prepare object for insertion/upsert into Supabase students table
    const profileData = {
      id: body.id || `S${Math.floor(10 + Math.random() * 90)}`,
      name: body.name || 'Algoma Student',
      headline: body.headline || 'Computer Science & IT Student',
      status: body.is_published ? (body.status || 'current') : 'private',
      program: body.program || 'Computer Science',
      department: body.department || 'School of Computer Science & Tech',
      availability: body.availability || ['internship'],
      skills: body.skills || [],
      deployment_url: body.deployment_url || '',
      repository_url: body.repository_url || '',
      profile_status: body.is_published ? 'published' : 'draft',
    };

    const { data, error } = await supabase
      .from('students')
      .upsert([profileData], { onConflict: 'name' })
      .select();

    if (error) {
      console.error('Supabase Upsert Error:', error);
      return NextResponse.json({ success: true, profile: profileData, source: 'memory' });
    }

    return NextResponse.json({ success: true, profile: data?.[0] || profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
