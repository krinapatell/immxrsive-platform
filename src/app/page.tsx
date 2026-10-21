'use client';

import { useState, useEffect } from 'react';

export default function TalentIndexPage() {
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        if (data.profiles) setProfiles(data.profiles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const allSkills = Array.from(
    new Set(
      profiles.flatMap((p: any) => p.skills || [])
    )
  );

  const filteredProfiles = profiles.filter((p: any) => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.program?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSkill = selectedSkill === 'All' || (p.skills && p.skills.includes(selectedSkill));

    return matchesSearch && matchesSkill;
  });

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-12 border-b border-[#E8E2D9]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#C85A32] font-semibold">Chapter 01 / Signal</span>
          <h1 className="text-2xl font-bold tracking-tight">Immxrsive Talent Index</h1>
        </div>
        <a
          href="/student"
          className="bg-[#C85A32] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#b04d2a] transition"
        >
          Student Login / Create Profile →
        </a>
      </header>

      <section className="max-w-3xl mx-auto text-center py-8 mb-12">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Discover the people building what's next.
        </h2>
        <p className="text-stone-600 text-base md:text-lg">
          Student and alumni talent across immersive technology, software, design, spatial computing, and interactive systems.
        </p>
      </section>

      <section className="max-w-6xl mx-auto mb-8 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <input
            type="text"
            placeholder="Search by name, headline, or program..."
            className="w-full md:w-96 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="text-sm text-stone-500 font-medium">
            Showing <strong>{filteredProfiles.length}</strong> {filteredProfiles.length === 1 ? 'match' : 'matches'}
          </div>
        </div>

        {allSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100 items-center">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-2">Evidence Filters:</span>
            <button
              onClick={() => setSelectedSkill('All')}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium transition " + (selectedSkill === 'All' ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
            >
              All Skills
            </button>
            {allSkills.map((skill: any) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition " + (selectedSkill === skill ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
              >
                {skill}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-stone-400">Loading talent index...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E2D9] rounded-2xl text-stone-500">
            No published talent matches your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile: any) => (
              <div key={profile.id} className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                      {profile.status || 'Verified'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">{profile.program || 'Student'} • {profile.department || 'CS & IT'}</p>
                  
                  <div className="bg-[#FAF7F2] p-3 rounded-xl mb-3">
                    <p className="font-medium text-stone-800 text-sm">{profile.headline || 'Talent Profile'}</p>
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-3 border-t border-stone-100 text-xs text-[#C85A32] font-medium">
                  {profile.deployment_url && (
                    <a href={profile.deployment_url} target="_blank" rel="noreferrer" className="hover:underline">
                      Live App ↗
                    </a>
                  )}
                  {profile.repository_url && (
                    <a href={profile.repository_url} target="_blank" rel="noreferrer" className="text-stone-600 hover:underline">
                      Repository ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="max-w-6xl mx-auto mt-20 pt-6 border-t border-[#E8E2D9] flex justify-between items-center text-xs text-stone-500">
        <span>NOT ImmXrsive Talent Index</span>
        <span>Independent student-built course project</span>
      </footer>
    </main>
  );
}
