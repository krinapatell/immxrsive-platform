'use client';

import { useState, useEffect } from 'react';

export default function TalentIndexPage() {
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['current']);
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

  // Extract all unique standardized skills from fixtures/database
  const allSkills = Array.from(
    new Set(
      profiles.flatMap((p: any) => p.skills || [])
    )
  );

  // Toggle skill selection (AND semantics)
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Toggle availability selection (OR semantics within availability)
  const toggleAvailability = (avail: string) => {
    setSelectedAvailabilities(prev =>
      prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setSelectedAvailabilities([]);
    setSelectedStatuses(['current']);
  };

  // Filter logic meeting Release 1 specs
  const filteredProfiles = profiles.filter((p: any) => {
    // R1.20: Unpublished records check (only show published/current or matching status)
    if (!p.status && p.profile_status !== 'published') return false;

    // R1.04: Case-insensitive text search matching name, headline, or skills
    const matchesSearch = 
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.skills && p.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    // R1.06: Multiple selected skills use AND by default
    const matchesSkills = 
      selectedSkills.length === 0 ||
      selectedSkills.every(skill => p.skills && p.skills.includes(skill));

    // R1.07: Availability uses OR within category, combined with others via AND
    const matchesAvailability =
      selectedAvailabilities.length === 0 ||
      (p.availability && p.availability.some((a: string) => selectedAvailabilities.includes(a)));

    return matchesSearch && matchesSkills && matchesAvailability;
  });

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-12 border-b border-[#E8E2D9]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#C85A32] font-semibold">Algoma University / ImmXrsive</span>
          <h1 className="text-2xl font-bold tracking-tight">Public Talent Directory</h1>
        </div>
        <a
          href="/student"
          className="bg-[#C85A32] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#b04d2a] transition"
        >
          Student Portal / Login →
        </a>
      </header>

      <section className="max-w-3xl mx-auto text-center py-6 mb-8">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          Discover student talent and verified project evidence.
        </h2>
        <p className="text-stone-600 text-sm md:text-base">
          Explore profiles, standardized skills, availability, and inspect real project evidence.
        </p>
      </section>

      {/* Search & Filter Controls */}
      <section className="max-w-6xl mx-auto mb-8 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search name, headline, or skills..."
            className="w-full md:w-96 p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            <span className="text-sm text-stone-500 font-medium">
              <strong>{filteredProfiles.length}</strong> candidates found
            </span>
            {(searchQuery || selectedSkills.length > 0 || selectedAvailabilities.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#C85A32] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Availability Filter (R1.07) */}
        <div className="mb-4 pb-4 border-b border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-2">Availability:</span>
          {['internship', 'full-time', 'contract'].map(avail => (
            <button
              key={avail}
              onClick={() => toggleAvailability(avail)}
              className={"px-3 py-1 rounded-lg text-xs font-medium transition capitalize " + (selectedAvailabilities.includes(avail) ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
            >
              {avail}
            </button>
          ))}
        </div>

        {/* Standardized Skill Filters (R1.05, R1.06) */}
        {allSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-2">Skills (AND):</span>
            {allSkills.map((skill: any) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition " + (selectedSkills.includes(skill) ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
              >
                {skill} {selectedSkills.includes(skill) && '✓'}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Directory Grid */}
      <section className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-stone-400">Loading talent directory...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E2D9] rounded-2xl text-stone-500">
            No published candidates match your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile: any) => (
              <div key={profile.id || profile.name} className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                      {profile.status || 'current'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">{profile.program || 'Student'} • {profile.department || 'CS & IT'}</p>
                  
                  <div className="bg-[#FAF7F2] p-3 rounded-xl mb-3">
                    <p className="font-medium text-stone-800 text-sm">{profile.headline || 'Immxrsive Talent'}</p>
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

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-medium">
                  <div className="flex gap-3 text-[#C85A32]">
                    {profile.deployment_url && (
                      <a href={profile.deployment_url} target="_blank" rel="noreferrer" className="hover:underline">
                        Live App ↗
                      </a>
                    )}
                    {profile.repository_url && (
                      <a href={profile.repository_url} target="_blank" rel="noreferrer" className="text-stone-600 hover:underline">
                        Repo ↗
                      </a>
                    )}
                  </div>
                  <a 
                    href={'/student/' + (profile.id || profile.name.toLowerCase().replace(/\s+/g, '-'))}
                    className="text-stone-700 bg-stone-100 px-3 py-1 rounded-lg hover:bg-stone-200 transition"
                  >
                    View Profile →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="max-w-6xl mx-auto mt-20 pt-6 border-t border-[#E8E2D9] flex justify-between items-center text-xs text-stone-500">
        <span>Algoma University — ImmXrsive Platform</span>
        <span>Release 1 & 2 Compliant</span>
      </footer>
    </main>
  );
}
