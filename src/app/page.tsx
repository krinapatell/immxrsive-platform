'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TalentIndexPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        if (data.profiles) setProfiles(data.profiles);
      } catch (err) {
        console.error(err);
      } font-medium {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter((p: any) => {
    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Current Student' && p.status !== 'current') return false;
      if (statusFilter === 'Alumni' && p.status !== 'alumni') return false;
    }

    // Availability filter
    if (availabilityFilter !== 'All') {
      const avail = availabilityFilter.toLowerCase();
      if (!p.availability || !p.availability.includes(avail)) return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(q);
      const headlineMatch = p.headline?.toLowerCase().includes(q);
      const programMatch = p.program?.toLowerCase().includes(q);
      const skillMatch = p.skills && p.skills.some((s: string) => s.toLowerCase().includes(q));
      if (!nameMatch && !headlineMatch && !programMatch && !skillMatch) return false;
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#1E293B]">
      {/* Header Bar */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#6366F1]">ImmXrsive</span>
          <span className="bg-[#EEF2FF] text-[#6366F1] text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Talent Platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Directory
          </Link>
          <Link
            href="/student"
            className="bg-[#6366F1] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#4F46E5] transition"
          >
            Student Portal →
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
          ImmXrsive Talent Directory
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Discover skilled students and alumni across tech, design, and immersive media.
        </p>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <input
            type="text"
            placeholder="Search by name, skills, projects, certificates..."
            className="w-full md:w-96 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value="All">All Statuses</option>
              <option value="Current Student">Current Student</option>
              <option value="Alumni">Alumni</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value="All">All Availability</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        {/* Directory Cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">Loading directory...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-500">
            No students found matching filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((student: any) => (
              <div
                key={student.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium capitalize">
                      {student.status || 'Current'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#6366F1] mb-2">
                    {student.program || 'Computer Science'}
                  </p>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {student.headline || 'Talent Profile'}
                  </p>

                  {student.availability && student.availability.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {student.availability.map((avail: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {avail}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={/student/}
                  className="w-full text-center bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-2.5 rounded-lg transition block"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
