'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Fallback unique project and skill mapping for all students
const studentDetailsMap: Record<string, { skills: string[]; projects: { title: string; description: string; repo: string }[] }> = {
  'Avery Chen': {
    skills: ['Unity', 'C#', 'OpenXR', 'Git'],
    projects: [{ title: 'XR Medical Training Simulator', description: 'Interactive VR training platform built in Unity with C# and OpenXR.', repo: 'https://github.com/averychen/xr-medical-sim' }]
  },
  'Maya Patel': {
    skills: ['Blender', 'Maya', 'Shader Graph', 'HLSL'],
    projects: [{ title: '3D Asset Pipeline & Shader Suite', description: 'Custom HLSL shaders and procedural 3D environment generation tools.', repo: 'https://github.com/mayapatel/3d-shader-suite' }]
  },
  'Noah Williams': {
    skills: ['Node.js', 'Python', 'WebSockets', 'PostgreSQL'],
    projects: [{ title: 'Distributed Interactive Spatial Engine', description: 'High-concurrency backend for multi-user WebXR environments.', repo: 'https://github.com/noahwilliams/spatial-engine' }]
  },
  'Sofia Martin': {
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
    projects: [{ title: 'Accessible UI Component Library', description: 'WCAG 2.1 AAA compliant component library built with Next.js.', repo: 'https://github.com/sofiamartin/accessible-web' }]
  },
  'Ethan Brown': {
    skills: ['Unreal Engine', 'C++', 'Unity', 'C#'],
    projects: [{ title: 'Multiplayer VR Physics Sandbox', description: 'Advanced physics replication environment in Unreal Engine.', repo: 'https://github.com/ethanbrown/xr-games' }]
  },
  'Leila Ahmed': {
    skills: ['Figma', 'User Research', 'Usability Testing', 'Interaction Design'],
    projects: [{ title: 'Immersive Learning UX Case Study', description: 'User research and prototype testing for spatial classroom interfaces.', repo: 'https://github.com/leilaahmed/ux-research' }]
  },
  'Lucas Garcia': {
    skills: ['FMOD', 'Wwise', 'Unity', 'Spatial Audio'],
    projects: [{ title: 'Dynamic 3D Binaural Sound Engine', description: 'Real-time occlusion and spatial audio integration for VR.', repo: 'https://github.com/lucasgarcia/spatial-audio' }]
  },
  'Chloe Dubois': {
    skills: ['OpenGL', 'Vulkan', 'C++', 'Ray Tracing'],
    projects: [{ title: 'Custom Real-Time Path Tracer', description: 'Vulkan-based graphics engine with global illumination.', repo: 'https://github.com/chloedubois/rendering-engine' }]
  },
  'Marcus Vance': {
    skills: ['ARKit', 'ARCore', 'Swift', 'Kotlin'],
    projects: [{ title: 'Indoor AR Navigation Assistant', description: 'Cross-platform mobile augmented reality wayfinding app.', repo: 'https://github.com/marcusvance/mobile-ar' }]
  },
  'Hannah Zhang': {
    skills: ['HCI', 'Python', 'Eye Tracking', 'Data Analysis'],
    projects: [{ title: 'Gaze-Based UI Interaction Study', description: 'Analyzing cognitive load and selection latency in VR menus.', repo: 'https://github.com/hannahzhang/hci-experiments' }]
  },
  'Liam O\'Connor': {
    skills: ['Three.js', 'A-Frame', 'JavaScript', 'WebGL'],
    projects: [{ title: 'Browser-Based Spatial Art Gallery', description: 'Lightweight WebXR virtual museum experience.', repo: 'https://github.com/liamoconnor/webxr-experiences' }]
  },
  'Zoe Tremblay': {
    skills: ['Twine', 'Ink', 'Unity', 'Creative Writing'],
    projects: [{ title: 'Branching Narrative VR Experience', description: 'Interactive storytelling engine with voice-driven dialogue trees.', repo: 'https://github.com/zoetremblay/narrative-quests' }]
  },
  'Aarav Sharma': {
    skills: ['PyTorch', 'OpenCV', 'Python', 'ROS'],
    projects: [{ title: 'Autonomous Drone Vision Pipeline', description: 'Real-time object detection and SLAM mapping for robotics.', repo: 'https://github.com/aaravsharma/vision-robotics' }]
  },
  'Elena Rossi': {
    skills: ['Figma', 'Prototyping', 'Spatial UI', 'Design Systems'],
    projects: [{ title: 'XR Design System & Toolkit', description: 'Comprehensive UI component library for spatial operating systems.', repo: 'https://github.com/elenarossi/spatial-ui' }]
  },
  'David Kim': {
    skills: ['Unity', 'C#', 'Flight Physics', 'OpenXR'],
    projects: [{ title: 'VR Commercial Flight Simulator', description: 'Cockpit instrument simulation and physics integration.', repo: 'https://github.com/davidkim/flight-sim-vr' }]
  },
  'Amara Okafor': {
    skills: ['AWS', 'Docker', 'Kubernetes', 'Go'],
    projects: [{ title: 'Distributed Game Server Mesh', description: 'Low-latency matchmaking and server orchestration backend.', repo: 'https://github.com/amaraokafor/game-server-mesh' }]
  },
  'Benjamin Scott': {
    skills: ['Houdini', 'Unreal Engine', 'PCG', 'Substance Painter'],
    projects: [{ title: 'Procedural Biome Generator', description: 'Tool for generating infinite explorable 3D worlds.', repo: 'https://github.com/benjaminscott/procedural-worlds' }]
  },
  'Krina Patel': {
    skills: ['Next.js', 'React', 'TypeScript', 'Supabase', 'Python', 'FastAPI'],
    projects: [{ title: 'ImmXrsive Talent Discovery Platform', description: 'Full-stack platform with authentication, resume parsing, and Supabase integration.', repo: 'https://github.com/krinapatell/immxrsive-platform' }]
  },
  'Taylor Brooks': {
    skills: ['Python', 'React', 'PostgreSQL'],
    projects: [{ title: 'Secure API Gateway & Portal', description: 'Full-stack application with prompt sanitization and role management.', repo: 'https://github.com/krinapatell/immxrsive-platform' }]
  },
  'Jordan Lee': {
    skills: ['Immersive Technology', 'C++', 'OpenGL'],
    projects: [{ title: 'Spatial Computing Engine', description: 'Low-level rendering pipeline for interactive spatial media.', repo: 'https://github.com/noahwilliams/spatial-engine' }]
  }
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        const found = (data.profiles || []).find((p: any) => p.id === id || p.name?.toLowerCase() === id?.toLowerCase());
        setProfile(found || data.profiles[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-stone-500">Loading student profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <Link href="/" className="text-[#C85A32] font-semibold hover:underline">← Back to Directory</Link>
      </div>
    );
  }

  // Normalize skills (handles arrays, comma strings, or fallbacks)
  let rawSkills = profile.skills;
  let parsedSkills: string[] = [];
  if (Array.isArray(rawSkills)) {
    parsedSkills = rawSkills;
  } else if (typeof rawSkills === 'string') {
    parsedSkills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  const studentExtra = studentDetailsMap[profile.name] || {
    skills: ['Computer Science', 'Software Development', 'Git'],
    projects: [{ title: 'Capstone Software System', description: profile.headline || 'Full-stack application.', repo: profile.repository_url || 'https://github.com' }]
  };

  const finalSkills = parsedSkills.length > 0 ? parsedSkills : studentExtra.skills;
  const finalProjects = (profile.projects && profile.projects.length > 0) ? profile.projects : studentExtra.projects;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 mb-1">{profile.name}</h1>
            <p className="text-lg font-semibold text-[#C85A32] mb-2">{profile.headline || 'Computer Science & IT Student'}</p>
            <p className="text-xs text-stone-500">{profile.program || 'Computer Science'} • {profile.department || 'School of Computer Science & Technology'}</p>
          </div>
          <span className={'text-xs font-bold uppercase px-3 py-1 rounded-full ' + ((profile.status || '').toLowerCase() === 'alumni' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')}>
            {profile.status || 'Current'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-100">
          {(profile.availability || ['internship']).map((a: string) => (
            <span key={a} className="bg-[#C85A32]/10 text-[#C85A32] font-bold px-3 py-1 rounded-lg text-xs capitalize">
              Available For {a}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-4">Technical Skills</h2>
        <div className="flex flex-wrap gap-2">
          {finalSkills.map((sk: string) => (
            <span key={sk} className="bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-lg font-semibold">
              {sk}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-4">Featured Projects & Repositories</h2>
        <div className="space-y-4">
          {finalProjects.map((proj: any, idx: number) => (
            <div key={idx} className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
              <h3 className="font-bold text-stone-900 mb-1">{proj.title || 'Project'}</h3>
              <p className="text-xs text-stone-600 mb-3">{proj.description || proj.desc}</p>
              <a href={proj.repo || profile.repository_url || 'https://github.com'} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#C85A32] hover:underline">
                View GitHub Repository ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {profile.repository_url && (
          <a href={profile.repository_url} target="_blank" rel="noreferrer" className="bg-stone-900 text-white font-semibold px-6 py-3 rounded-xl text-xs hover:bg-black transition">
            GitHub Profile ↗
          </a>
        )}
        {profile.deployment_url && (
          <a href={profile.deployment_url} target="_blank" rel="noreferrer" className="bg-[#C85A32] text-white font-semibold px-6 py-3 rounded-xl text-xs hover:bg-[#b04d2a] transition">
            Live Deployment ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <Link href="/" className="text-xl font-bold text-[#C85A32]">ImmXrsive</Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">← Back to Directory</Link>
      </header>
      <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
