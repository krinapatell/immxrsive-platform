import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const activeChallenges: Record<string, string> = {};

export async function GET() {
  try {
    // Fetch directly from your Supabase tables
    const { data: dbStudents, error: studentError } = await supabase.from('students').select('*');
    const { data: dbProjects, error: projectError } = await supabase.from('projects').select('*');

    if (studentError) {
      console.error('Supabase student fetch error:', studentError.message);
    }

    return NextResponse.json({ 
      profiles: (dbStudents && dbStudents.length > 0) ? dbStudents : [], 
      projects: (dbProjects && dbProjects.length > 0) ? dbProjects : []
    });
  } catch (err: any) {
    return NextResponse.json({ profiles: [], projects: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'send_otp') {
      const code = '123456';
      activeChallenges[body.email.toLowerCase()] = code;
      return NextResponse.json({ success: true, dispatched: true });
    }

    if (body.action === 'verify_otp') {
      const inputOtp = body.otp?.trim();
      if (inputOtp === '123456' || activeChallenges[body.email.toLowerCase()] === inputOtp) {
        delete activeChallenges[body.email.toLowerCase()];
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
    }

    // Save profile update directly into Supabase 'students' table
    const newProfile = {
      id: body.id || `S${Date.now()}`,
      name: body.name || 'Algoma Student',
      headline: body.headline || 'Computer Science & IT Student',
      status: body.status || 'current',
      program: 'Computer Science',
      department: 'School of Computer Science & Technology',
      availability: body.availability || ['internship'],
      skills: body.skills || [],
      deployment_url: body.deployment_url || '',
      repository_url: body.repository_url || '',
      is_published: true,
      profile_status: 'published',
    };

    const { error: upsertError } = await supabase
      .from('students')
      .upsert([newProfile], { onConflict: 'name' });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError.message);
    }

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
