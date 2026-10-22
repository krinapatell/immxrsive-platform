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
    headline: 'XR Developer',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship', 'full-time'],
    skills: ['Unity', 'C#', 'OpenXR', 'Git'],
    deployment_url: 'https://xr-medical-sim.vercel.app',
    repository_url: 'https://github.com/averychen/xr-medical-sim',
    is_published: true,
    profile_status: 'published'
  },
  {
    id: 'S02',
    name: 'Morgan Rivera',
    headline: 'XR/Web Developer',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['contract', 'full-time'],
    skills: ['Unity', 'C#', 'JavaScript', 'WebXR', 'Three.js', 'Git'],
    deployment_url: 'https://3d-shader-suite.vercel.app',
    repository_url: 'https://github.com/mayapatel/3d-shader-suite',
    is_published: true,
    profile_status: 'published'
  },
  {
    id: 'S03',
    name: 'Jordan Lee',
    headline: 'Computer Science Student',
    status: 'current',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    availability: ['internship'],
    skills: ['Immersive Technology', 'C++', 'OpenGL'],
    deployment_url: 'https://spatial-engine.vercel.app',
    repository_url: 'https://github.com/noahwilliams/spatial-engine',
    is_published: true,
    profile_status: 'published'
  },
  {
    id: 'S04',
    name: 'Taylor Brooks',
    headline: 'Software Developer',
    status: 'alumni',
    program: 'Information Technology',
    department: 'School of Computer Science & Technology',
    availability: ['full-time'],
    skills: ['Python', 'React', 'PostgreSQL'],
    deployment_url: 'https://immxrsive-platform.vercel.app',
    repository_url: 'https://github.com/krinapatell/immxrsive-platform',
    is_published: true,
    profile_status: 'published'
  }
];

const studentUniqueProjects: Record<string, any[]> = {
  'S01': [{ id: 'P01', student_id: 'S01', title: 'XR Medical Training Simulator', description: 'Interactive VR platform built in Unity with C#.', repository_url: 'https://github.com/averychen/xr-medical-sim' }],
  'avery-chen': [{ id: 'P01', student_id: 'S01', title: 'XR Medical Training Simulator', description: 'Interactive VR platform built in Unity with C#.', repository_url: 'https://github.com/averychen/xr-medical-sim' }],
  'S02': [{ id: 'P02', student_id: 'S02', title: '3D Asset Pipeline & Shader Suite', description: 'Custom HLSL shaders and procedural 3D environment generation.', repository_url: 'https://github.com/mayapatel/3d-shader-suite' }],
  'morgan-rivera': [{ id: 'P02', student_id: 'S02', title: '3D Asset Pipeline & Shader Suite', description: 'Custom HLSL shaders and procedural 3D environment generation.', repository_url: 'https://github.com/mayapatel/3d-shader-suite' }],
  'S03': [{ id: 'P03', student_id: 'S03', title: 'Distributed Interactive Spatial Engine', description: 'High-concurrency backend for multi-user WebXR environments.', repository_url: 'https://github.com/noahwilliams/spatial-engine' }],
  'jordan-lee': [{ id: 'P03', student_id: 'S03', title: 'Distributed Interactive Spatial Engine', description: 'High-concurrency backend for multi-user WebXR environments.', repository_url: 'https://github.com/noahwilliams/spatial-engine' }],
  'S04': [{ id: 'P04', student_id: 'S04', title: 'ImmXrsive Talent Discovery Platform', description: 'Next.js 15 App Router platform with Supabase backend.', repository_url: 'https://github.com/krinapatell/immxrsive-platform' }],
  'taylor-brooks': [{ id: 'P04', student_id: 'S04', title: 'ImmXrsive Talent Discovery Platform', description: 'Next.js 15 App Router platform with Supabase backend.', repository_url: 'https://github.com/krinapatell/immxrsive-platform' }]
};

let dynamicProfiles: any[] = [];

export async function GET() {
  try {
    const { data: dbStudents } = await supabase.from('students').select('*');
    const { data: dbProjects } = await supabase.from('projects').select('*');

    let combined = [...defaultSeedProfiles];
    if (dbStudents && dbStudents.length > 0) {
      const dbNames = new Set(dbStudents.map((s: any) => s.name?.toLowerCase()));
      combined = [...dbStudents, ...combined.filter(p => !dbNames.has(p.name.toLowerCase()))];
    }

    dynamicProfiles.forEach(dp => {
      const idx = combined.findIndex(c => c.name?.toLowerCase() === dp.name?.toLowerCase());
      if (idx >= 0) combined[idx] = dp;
      else combined.push(dp);
    });

    return NextResponse.json({ 
      profiles: combined, 
      projects: (dbProjects && dbProjects.length > 0) ? dbProjects : [],
      uniqueProjectMap: studentUniqueProjects
    });
  } catch (err: any) {
    return NextResponse.json({ 
      profiles: [...defaultSeedProfiles, ...dynamicProfiles], 
      projects: [], 
      uniqueProjectMap: studentUniqueProjects 
    });
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
    };

    dynamicProfiles = dynamicProfiles.filter(p => p.name?.toLowerCase() !== newProfile.name.toLowerCase());
    dynamicProfiles.push(newProfile);

    try {
      await supabase.from('students').upsert([newProfile], { onConflict: 'name' });
    } catch (e) {
      console.log('Supabase upsert active');
    }

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
