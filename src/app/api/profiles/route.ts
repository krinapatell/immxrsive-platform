import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Release 1 Fixture Data for Projects
const fixtureProjects = [
  {
    id: "P01",
    student_id: "S01",
    author: "Avery Chen",
    contributor_ids: ["S01", "S02"],
    title: "XR Medical Training Simulator",
    description: "Immersive VR training platform built in Unity with C# for surgical procedures.",
    repository_url: "https://github.com/algoma-xr/medical-sim",
    deployment_url: "https://medical-sim.vercel.app"
  },
  {
    id: "P02",
    student_id: "S02",
    author: "Maya Patel",
    contributor_ids: ["S02", "S03"],
    title: "3D Asset Pipeline & Shader Suite",
    description: "Custom HLSL shaders and procedural 3D environment generation suite.",
    repository_url: "https://github.com/algoma-xr/shader-suite",
    deployment_url: "https://shader-suite.vercel.app"
  },
  {
    id: "P03",
    student_id: "S03",
    author: "Noah Williams",
    contributor_ids: ["S03"],
    title: "Distributed Interactive Spatial Engine",
    description: "High-concurrency backend for multi-user WebXR environments built with Node.js and Supabase.",
    repository_url: "https://github.com/algoma-xr/spatial-engine",
    deployment_url: "https://spatial-engine.vercel.app"
  }
];

// In-Memory store for newly published profiles during session
let dynamicProfiles: any[] = [];

export async function GET() {
  try {
    const { data: dbStudents } = await supabase.from('students').select('*');
    const { data: dbProjects } = await supabase.from('projects').select('*');

    const combinedProfiles = [...(dbStudents || []), ...dynamicProfiles];

    return NextResponse.json({ 
      profiles: combinedProfiles, 
      projects: (dbProjects && dbProjects.length > 0) ? dbProjects : fixtureProjects 
    });
  } catch (err: any) {
    return NextResponse.json({ profiles: dynamicProfiles, projects: fixtureProjects });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newProfile = {
      id: body.id || `S${Date.now()}`,
      name: body.name || 'Krina Patel',
      headline: body.headline || 'Computer Science & IT Student',
      status: body.is_published ? (body.status || 'current') : 'private',
      program: 'Computer Science',
      department: 'School of Computer Science & Technology',
      availability: body.availability || ['internship'],
      skills: body.skills || ['Next.js', 'TypeScript', 'Supabase', 'Java'],
      deployment_url: body.deployment_url || 'https://immxrsive-platform-o787.vercel.app',
      repository_url: body.repository_url || 'https://github.com/krinapatell/immxrsive-platform',
      profile_status: body.is_published ? 'published' : 'draft',
    };

    // Store in dynamic profiles cache so directory reflects immediately
    dynamicProfiles = dynamicProfiles.filter(p => p.name?.toLowerCase() !== newProfile.name.toLowerCase());
    dynamicProfiles.push(newProfile);

    // Also attempt Supabase upsert
    try {
      await supabase.from('students').upsert([newProfile], { onConflict: 'name' });
    } catch (e) {
      console.log('Supabase upsert fallback active');
    }

    return NextResponse.json({ success: true, profile: newProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
