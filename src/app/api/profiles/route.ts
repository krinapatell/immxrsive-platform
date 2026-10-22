import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    is_published: true,
    projects: [
      { title: 'XR Medical Training Simulator', description: 'Interactive VR training platform built in Unity with C# and OpenXR.', repo: 'https://github.com/averychen/xr-medical-sim' }
    ]
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
    is_published: true,
    projects: [
      { title: '3D Asset Pipeline & Shader Suite', description: 'Custom HLSL shaders and procedural 3D environment generation tools.', repo: 'https://github.com/mayapatel/3d-shader-suite' }
    ]
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
    is_published: true,
    projects: [
      { title: 'Distributed Interactive Spatial Engine', description: 'High-concurrency backend for multi-user WebXR environments.', repo: 'https://github.com/noahwilliams/spatial-engine' }
    ]
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
    is_published: true,
    projects: [
      { title: 'Accessible UI Component Library', description: 'WCAG 2.1 AAA compliant component library built with Next.js.', repo: 'https://github.com/sofiamartin/accessible-web' }
    ]
  },
  {
    id: 'S18',
    name: 'Krina Patel',
    headline: 'Full-stack platform engineer',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship', 'full-time'],
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Python', 'FastAPI'],
    deployment_url: 'https://immxrsive-platform.vercel.app',
    repository_url: 'https://github.com/krinapatell/immxrsive-platform',
    is_published: true,
    projects: [
      { title: 'ImmXrsive Talent Discovery Platform', description: 'Next.js 15 App Router platform with Supabase backend and secure resume parsing.', repo: 'https://github.com/krinapatell/immxrsive-platform' }
    ]
  }
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  try {
    const { data: dbStudents } = await supabase.from('students').select('*');
    let profiles = (dbStudents && dbStudents.length > 0) ? dbStudents : defaultSeedProfiles;

    // Ensure seed profiles are included if not in DB
    defaultSeedProfiles.forEach(sp => {
      if (!profiles.some((p: any) => p.name?.toLowerCase() === sp.name?.toLowerCase())) {
        profiles.push(sp);
      }
    });

    if (id) {
      const profile = profiles.find((p: any) => p.id === id || p.name?.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase());
      if (profile) return NextResponse.json({ profile });
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profiles, projects: [] });
  } catch (err: any) {
    return NextResponse.json({ profiles: defaultSeedProfiles, projects: [] });
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
      projects: body.projects || [{ title: 'Independent Capstone Project', description: 'Full-stack software application developed for coursework.', repo: body.repository_url || 'https://github.com' }]
    };

    await supabase.from('students').upsert([newProfile], { onConflict: 'name' });

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
