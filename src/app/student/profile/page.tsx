'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 mb-1">{profile.name}</h1>
            <p className="text-lg font-semibold text-[#C85A32] mb-2">{profile.headline}</p>
            <p className="text-xs text-stone-500">{profile.program || 'Computer Science'} • {profile.department || 'School of Computer Science & Technology'}</p>
          </div>
          <span className={'text-xs font-bold uppercase px-3 py-1 rounded-full ' + (profile.status === 'alumni' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')}>
            {profile.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-100">
          {profile.availability?.map((a: string) => (
            <span key={a} className="bg-[#C85A32]/10 text-[#C85A32] font-bold px-3 py-1 rounded-lg text-xs capitalize">
              Available for {a}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-4">Technical Skills</h2>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((sk: string) => (
            <span key={sk} className="bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-lg font-semibold">
              {sk}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-4">Featured Projects & Repositories</h2>
        <div className="space-y-4">
          {(profile.projects || [{ title: 'Capstone Software System', description: profile.headline, repo: profile.repository_url }]).map((proj: any, idx: number) => (
            <div key={idx} className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
              <h3 className="font-bold text-stone-900 mb-1">{proj.title}</h3>
              <p className="text-xs text-stone-600 mb-3">{proj.description}</p>
              {proj.repo || profile.repository_url ? (
                <a href={proj.repo || profile.repository_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#C85A32] hover:underline">
                  View GitHub Repository ↗
                </a>
              ) : null}
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
