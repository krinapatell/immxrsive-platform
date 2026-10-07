'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';
import StudentCard from '@/components/StudentCard';
import StudentCardSkeleton from '@/components/StudentCardSkeleton';

function DirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Read initial search and filter values directly from the URL
  const [search, setSearch] = useState(
    searchParams.get('search') || searchParams.get('skills') || ''
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || ''
  );
  const [availabilityFilter, setAvailabilityFilter] = useState(
    searchParams.get('availability') || ''
  );

  // Sync state if URL changes (e.g., browser Back/Forward navigation)
  useEffect(() => {
    const searchParam =
      searchParams.get('search') || searchParams.get('skills') || '';
    const statusParam = searchParams.get('status') || '';
    const availParam = searchParams.get('availability') || '';

    setSearch(searchParam);
    setStatusFilter(statusParam);
    setAvailabilityFilter(availParam);
  }, [searchParams]);

  // Update the URL query string dynamically when controls change
  const updateQueryParams = (
    newSearch: string,
    newStatus: string,
    newAvail: string
  ) => {
    const params = new URLSearchParams();

    if (newSearch.trim()) params.set('search', newSearch.trim());
    if (newStatus) params.set('status', newStatus);
    if (newAvail) params.set('availability', newAvail);

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : '/';

    router.replace(newUrl, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateQueryParams(value, statusFilter, availabilityFilter);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateQueryParams(search, value, availabilityFilter);
  };

  const handleAvailabilityChange = (value: string) => {
    setAvailabilityFilter(value);
    updateQueryParams(search, statusFilter, value);
  };

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data, error } = await supabase.from('students').select('*');

      if (error) {
        console.error('Error fetching students:', error);
      } else if (data) {
        setStudents(data as Student[]);
      }
      setLoading(false);
    }

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      search === '' ||
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.program.toLowerCase().includes(search.toLowerCase()) ||
      student.skills.some((skill) =>
        skill.toLowerCase().includes(search.toLowerCase())
      );

    const matchesStatus = statusFilter ? student.status === statusFilter : true;
    const matchesAvailability = availabilityFilter
      ? student.availability.includes(availabilityFilter)
      : true;

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          ImmXrsive Talent Directory
        </h1>
        <p className="text-gray-600 mt-2">
          Discover skilled students and alumni across tech, design, and immersive media.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search by name, skill, program..."
          aria-label="Search candidates by name, skill, or program"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            aria-label="Filter candidates by status"
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="current">Current Student</option>
            <option value="alumni">Alumni</option>
          </select>

          <select
            value={availabilityFilter}
            aria-label="Filter candidates by availability"
            onChange={(e) => handleAvailabilityChange(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Availability</option>
            <option value="internship">Internship</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <StudentCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No profile matches found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={<div>Loading directory...</div>}>
      <DirectoryContent />
    </Suspense>
  );
}