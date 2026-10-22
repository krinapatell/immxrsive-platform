import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-Memory store for active session OTP codes
const activeOtps: Record<string, string> = {};

// Distinct project fixtures assigned uniquely per student
const studentUniqueProjects: Record<string, any[]> = {
  'S01': [
    {
      id: 'P01',
      student_id: 'S01',
      title: 'XR Medical Training Simulator',
      description: 'Interactive VR platform built in Unity with C# for surgical procedures.',
      repository_url: 'https://github.com/averychen/xr-medical-sim'
    }
  ],
  'avery-chen': [
    {
      id: 'P01',
      student_id: 'S01',
      title: 'XR Medical Training Simulator',
      description: 'Interactive VR platform built in Unity with C# for surgical procedures.',
      repository_url: 'https://github.com/averychen/xr-medical-sim'
    }
  ],
  'S02': [
    {
      id: 'P02',
      student_id: 'S02',
      title: '3D Asset Pipeline & Shader Suite',
      description: 'Custom HLSL shaders and procedural 3D environment generation toolkit.',
      repository_url: 'https://github.com/mayapatel/3d-shader-suite'
    }
  ],
  'maya-patel': [
    {
      id: 'P02',
      student_id: 'S02',
      title: '3D Asset Pipeline & Shader Suite',
      description: 'Custom HLSL shaders and procedural 3D environment generation toolkit.',
      repository_url: 'https://github.com/mayapatel/3d-shader-suite'
    }
  ],
  'S03': [
    {
      id: 'P03',
      student_id: 'S03',
      title: 'Distributed Interactive Spatial Engine',
      description: 'High-concurrency backend for multi-user WebXR environments using Supabase.',
      repository_url: 'https://github.com/noahwilliams/spatial-engine'
    }
  ],
  'noah-williams': [
    {
      id: 'P03',
      student_id: 'S03',
      title: 'Distributed Interactive Spatial Engine',
      description: 'High-concurrency backend for multi-user WebXR environments using Supabase.',
      repository_url: 'https://github.com/noahwilliams/spatial-engine'
    }
  ],
  'krina-patel': [
    {
      id: 'P04',
      student_id: 'S04',
      title: 'ImmXrsive Talent Discovery Platform',
      description: 'Next.js 15 App Router platform with Supabase backend and PDF resume parser.',
      repository_url: 'https://github.com/krinapatell/immxrsive-platform'
    }
  ]
};

let dynamicProfiles: any[] = [];

export async function GET() {
  try {
    const { data: dbStudents } = await supabase.from('students').select('*');
    const { data: dbProjects } = await supabase.from('projects').select('*');

    const combinedProfiles = [...(dbStudents || []), ...dynamicProfiles];

    return NextResponse.json({ 
      profiles: combinedProfiles, 
      projects: (dbProjects && dbProjects.length > 0) ? dbProjects : [],
      uniqueProjectMap: studentUniqueProjects
    });
  } catch (err: any) {
    return NextResponse.json({ 
      profiles: dynamicProfiles, 
      projects: [], 
      uniqueProjectMap: studentUniqueProjects 
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is an OTP request
    if (body.action === 'send_otp') {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtps[body.email.toLowerCase()] = generatedCode;

      // Attempt to send email via Supabase Auth
      await supabase.auth.signInWithOtp({ email: body.email });

      return NextResponse.json({ 
        success: true, 
        message: 'OTP generated',
        otpCode: generatedCode 
      });
    }

    // Check if this is an OTP verification request
    if (body.action === 'verify_otp') {
      const savedOtp = activeOtps[body.email.toLowerCase()];
      if (savedOtp && savedOtp === body.otp?.trim()) {
        delete activeOtps[body.email.toLowerCase()];
        return NextResponse.json({ success: true, verified: true });
      }
      return NextResponse.json({ success: false, message: 'Invalid OTP code' }, { status: 400 });
    }

    // Standard profile upsert
    const newProfile = {
      id: body.id || `S${Date.now()}`,
      name: body.name || 'Algoma Student',
      headline: body.headline || 'Computer Science & IT Student',
      status: body.is_published ? (body.status || 'current') : 'private',
      program: 'Computer Science',
      department: 'School of Computer Science & Technology',
      availability: body.availability || ['internship'],
      skills: body.skills || [],
      deployment_url: body.deployment_url || '',
      repository_url: body.repository_url || '',
      profile_status: body.is_published ? 'published' : 'draft',
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
