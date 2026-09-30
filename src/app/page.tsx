'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';
import StudentCard from '@/components/StudentCard';

export default function DirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile_status', 'published');

      if (error) {
        console.error('Error fetching students:', error);
      } else if (data) {
        setStudents(data as Student[]);
        setFilteredStudents(data as Student[]);
      }
      setLoading(false);
    }

    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.headline.toLowerCase().includes(q) ||
          s.program.toLowerCase().includes(q) ||
          (s.skills && s.skills.some((skill) => skill.toLowerCase().includes(q)))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (availabilityFilter !== 'all') {
      result = result.filter(
        (s) => s.availability && s.availability.includes(availabilityFilter)
      );
    }

    setFilteredStudents(result);
  }, [search, statusFilter, availabilityFilter, students]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
          ImmXrsive Talent Directory
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Discover skilled students and alumni across tech, design, and immersive media.
        </p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by name, skill, program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="current">Current Students</option>
            <option value="alumni">Alumni</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Availability</option>
            <option value="Co-op">Co-op</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-base">Loading directory talent...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-600 text-base font-medium">No candidates match your current filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setAvailabilityFilter('all');
            }}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 underline font-medium"
          >
            Clear all filters
          </button>
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
