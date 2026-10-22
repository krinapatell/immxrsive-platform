'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function StudentProfileView() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profiles?id=${id}`);
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        } else {
          // Fallback search in all profiles
          const allRes = await fetch('/api/profiles');
          const allData = await allRes.json();
          const found = (allData.profiles || []).find((p: any) => p.id === id || p.name?.toLowerCase().replace(/\s+/g, '-') === id.toLowerCase());
          setProfile(found || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return <main className="min-h-screen bg-[#FAF7F2] p-12 text-center text-stone-500">Loading student profile...</main>;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] p-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Student Profile Not Found</h1>
        <Link href="/" className="text-[#C85A32] font-semibold hover:underline">← Back to Directory</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <Link href="/" className="text-xl font-bold text-[#C85A32]">ImmXrsive</Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">← Back to Directory</Link>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Card */}
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

        {/* Skills */}
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

        {/* Projects */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-4">Featured Projects & Repositories</h2>
          <div className="space-y-4">
            {(profile.projects || [{ title: 'Capstone Software System', description: profile.headline, repo: profile.repository_url }]).map((proj: any, idx: number) => (
              <div key={idx} className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                <h3 className="font-bold text-stone-900 mb-1">{proj.title || proj.title}</h3>
                <p className="text-xs text-stone-600 mb-3">{proj.description || proj.description}</p>
                {proj.repo || profile.repository_url ? (
                  <a href={proj.repo || profile.repository_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#C85A32] hover:underline">
                    View GitHub Repository ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
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
    </main>
  );
}
