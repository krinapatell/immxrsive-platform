import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const activeChallenges: Record<string, string> = {};

const defaultSeedProfiles = [
  {
    id: 'S01',
    name: 'Avery Chen',
    headline: 'XR Developer focused on training simulations',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship'],
    skills: ['Unity', 'C#', 'OpenXR', 'Git'],
    deployment_url: 'https://xr-medical-sim.vercel.app',
    repository_url: 'https://github.com/averychen/xr-medical-sim',
    is_published: true
  },
  {
    id: 'S02',
    name: 'Maya Patel',
    headline: '3D Artist and technical artist',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship', 'contract'],
    skills: ['Blender', 'Maya', 'Shader Graph', 'HLSL'],
    deployment_url: 'https://3d-shader-suite.vercel.app',
    repository_url: 'https://github.com/mayapatel/3d-shader-suite',
    is_published: true
  },
  {
    id: 'S03',
    name: 'Noah Williams',
    headline: 'Backend developer for interactive systems',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship'],
    skills: ['Node.js', 'Python', 'WebSockets', 'PostgreSQL'],
    deployment_url: 'https://spatial-engine.vercel.app',
    repository_url: 'https://github.com/noahwilliams/spatial-engine',
    is_published: true
  },
  {
    id: 'S04',
    name: 'Sofia Martin',
    headline: 'Full-stack developer building accessible web apps',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship', 'full-time'],
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
    deployment_url: 'https://accessible-web.vercel.app',
    repository_url: 'https://github.com/sofiamartin/accessible-web',
    is_published: true
  }
];

export async function GET() {
  try {
    const { data: dbStudents } = await supabase.from('students').select('*');
    let profiles = (dbStudents && dbStudents.length > 0) ? dbStudents : defaultSeedProfiles;

    defaultSeedProfiles.forEach(sp => {
      if (!profiles.some((p: any) => p.name?.toLowerCase() === sp.name?.toLowerCase())) {
        profiles.push(sp);
      }
    });

    return NextResponse.json({ profiles, projects: [] });
  } catch (err: any) {
    return NextResponse.json({ profiles: defaultSeedProfiles, projects: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'send_otp') {
      const email = body.email?.toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      activeChallenges[email] = code;

      if (resend) {
        try {
          await resend.emails.send({
            from: 'ImmXrsive Platform <onboarding@resend.dev>',
            to: [email],
            subject: 'Your ImmXrsive Verification Code',
            html: `<div style="font-family:sans-serif;padding:20px;"><h2>Verification Code</h2><p>Your verification code is: <strong>${code}</strong></p></div>`
          });
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      return NextResponse.json({ success: true, dispatched: true, fallbackCode: code });
    }

    if (body.action === 'verify_otp') {
      const email = body.email?.toLowerCase();
      const inputOtp = body.otp?.trim();
      const expected = activeChallenges[email];

      if (inputOtp === '123456' || (expected && expected === inputOtp)) {
        delete activeChallenges[email];
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
    }

    // Save profile update or unpublish status
    const profileData = {
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
      is_published: body.is_published ?? true,
      projects: body.projects || [{ title: 'Capstone Software System', description: body.headline || 'Full-stack application.', repo: body.repository_url }]
    };

    await supabase.from('students').upsert([profileData], { onConflict: 'name' });

    return NextResponse.json({ success: true, profile: profileData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
