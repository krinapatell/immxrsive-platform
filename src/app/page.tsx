'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TalentIndexPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
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
    new Set(profiles.flatMap((p: any) => p.skills || []))
  );

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleAvailability = (avail: string) => {
    setSelectedAvailability(prev =>
      prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]
    );
  };

  const filteredProfiles = profiles.filter((p: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const headlineMatch = p.headline?.toLowerCase().includes(q);
      const programMatch = p.program?.toLowerCase().includes(q);
      const skillMatch = p.skills && p.skills.some((s: string) => s.toLowerCase().includes(q));
      if (!nameMatch && !headlineMatch && !programMatch && !skillMatch) return false;
    }

    if (selectedSkills.length > 0) {
      const hasAllSkills = selectedSkills.every(s => p.skills && p.skills.includes(s));
      if (!hasAllSkills) return false;
    }

    if (selectedAvailability.length > 0) {
      const hasAvailability = p.availability && p.availability.some((a: string) => selectedAvailability.includes(a));
      if (!hasAvailability) return false;
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#C85A32]">ImmXrsive</span>
          <span className="bg-[#C85A32]/10 text-[#C85A32] text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Talent Platform
          </span>
        </div>
        <Link
          href="/student"
          className="bg-[#C85A32] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#b04d2a] transition shadow-sm"
        >
          Student Portal / Login →
        </Link>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="text-center py-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            ImmXrsive Talent Directory
          </h1>
          <p className="text-stone-600 text-sm md:text-base">
            Discover skilled students and alumni across tech, design, spatial computing, and interactive systems.
          </p>
        </div>

        {/* Search & Filter Box */}
        <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <input
              type="text"
              placeholder="Search by name, headline, or program..."
              className="w-full md:w-96 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            <div className="text-sm text-stone-500 font-medium">
              Showing <strong>{filteredProfiles.length}</strong> matches
            </div>
          </div>

          {/* Availability Filters */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2">Availability (OR):</span>
            {['internship', 'full-time', 'contract'].map(avail => (
              <button
                key={avail}
                onClick={() => toggleAvailability(avail)}
                className={"px-3 py-1 rounded-lg text-xs font-semibold capitalize transition " + (selectedAvailability.includes(avail) ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
              >
                {avail}
              </button>
            ))}
          </div>

          {/* Standardized Skill Filters */}
          {allSkills.length > 0 && (
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2">Skills (AND):</span>
              {allSkills.map((skill: any) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={"px-3 py-1 rounded-lg text-xs font-semibold transition " + (selectedSkills.includes(skill) ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                >
                  {skill} {selectedSkills.includes(skill) && '✓'}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Directory Grid */}
        {loading ? (
          <div className="text-center py-20 text-stone-400 font-medium">Loading candidate profiles...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E2D9] rounded-2xl text-stone-500">
            No talent matches selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((student: any) => {
              const studentSlug = student.id || student.name.toLowerCase().replace(/\s+/g, '-');
              return (
                <div
                  key={student.id || student.name}
                  className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-stone-900">{student.name}</h2>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                        {student.status || 'current'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mb-2">
                      {student.program || 'Computer Science'} • {student.department || 'CS & IT'}
                    </p>

                    {/* Availability Badges */}
                    {student.availability && student.availability.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {student.availability.map((avail: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-[#C85A32]/10 text-[#C85A32] font-bold uppercase px-2 py-0.5 rounded-md">
                            {avail}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-[#FAF7F2] p-3 rounded-xl mb-4">
                      <p className="text-sm font-medium text-stone-800 line-clamp-2">
                        {student.headline || 'Talent Profile'}
                      </p>
                    </div>

                    {student.skills && student.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {student.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/student/${studentSlug}`}
                    className="w-full text-center bg-[#C85A32] hover:bg-[#b04d2a] text-white text-xs font-bold py-2.5 rounded-xl transition block shadow-sm"
                  >
                    View Full Profile & Projects →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
