'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Profile {
  id: string;
  name: string;
  headline: string;
  status: string;
  program: string;
  department: string;
  availability: string[];
  skills: string[];
  deployment_url?: string;
  repository_url?: string;
  is_published?: boolean;
}

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error('Failed to load profiles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleAvailability = (opt: string) => {
    setAvailabilityFilter(prev =>
      prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt]
    );
  };

  const filteredProfiles = profiles.filter(p => {
    // Search match
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.headline?.toLowerCase().includes(query) ||
      p.program?.toLowerCase().includes(query) ||
      p.skills?.some(s => s.toLowerCase().includes(query));

    // Status filter match
    const matchesStatus =
      statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();

    // Availability filter match
    const matchesAvailability =
      availabilityFilter.length === 0 ||
      availabilityFilter.some(a => p.availability?.includes(a));

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#C85A32]">ImmXrsive</span>
          <span className="text-xs bg-[#C85A32]/10 text-[#C85A32] font-semibold px-2.5 py-1 rounded-full">
            Talent Platform
          </span>
        </div>
        <Link
          href="/student"
          className="bg-[#C85A32] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#b04d2a] transition"
        >
          Student Portal / Login →
        </Link>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-[#2C2825] mb-3">
            ImmXrsive Talent Directory
          </h1>
          <p className="text-stone-600 text-sm max-w-xl mx-auto">
            Discover skilled students and alumni across tech, design, spatial computing, and interactive systems.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Search by name, headline, or skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-96 p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
            />

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <label className="text-xs font-bold uppercase text-stone-500">Status:</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-3 rounded-xl border border-[#E8E2D9] text-sm bg-white font-medium focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="current">Current Student</option>
                <option value="alumni">Alumni</option>
              </select>

              <span className="text-xs font-bold text-stone-500">
                {filteredProfiles.length} matches
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <span className="text-xs font-bold uppercase text-stone-500 mr-2">
              Availability (OR):
            </span>
            {['internship', 'full-time', 'contract'].map(opt => (
              <button
                key={opt}
                onClick={() => toggleAvailability(opt)}
                className={
                  'px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ' +
                  (availabilityFilter.includes(opt)
                    ? 'bg-[#C85A32] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Cards */}
        {loading ? (
          <div className="text-center py-12 text-stone-500 text-sm">Loading candidate profiles...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center text-stone-500 text-sm">
            No talent matches selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProfiles.map(p => (
              <div
                key={p.id}
                className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#C85A32]/40 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-stone-900">{p.name}</h2>
                    <span
                      className={
                        'text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ' +
                        (p.status === 'alumni'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200')
                      }
                    >
                      {p.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#C85A32] mb-1">{p.headline}</p>
                  <p className="text-xs text-stone-500 mb-4">{p.program} • {p.department}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.skills?.map(sk => (
                      <span
                        key={sk}
                        className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-md font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="flex gap-2">
                    {p.availability?.map(a => (
                      <span
                        key={a}
                        className="bg-[#C85A32]/10 text-[#C85A32] font-bold px-2 py-0.5 rounded capitalize text-[10px]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3 font-semibold text-stone-600">
                    {p.repository_url && (
                      <a
                        href={p.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#C85A32] transition"
                      >
                        Repo ↗
                      </a>
                    )}
                    {p.deployment_url && (
                      <a
                        href={p.deployment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#C85A32] transition"
                      >
                        Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
