'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Student } from '@/types';

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      setLoading(true);

      // Enforce publication check on direct URL access (R1.20)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error || !data) {
        setStudent(null);
      } else {
        setStudent(data as Student);
      }
      setLoading(false);
    }

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile Not Found</h1>
        <p className="text-gray-600 mt-2">
          This profile does not exist or is not publicly published.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          &larr; Back to Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
      >
        &larr; Back to Directory
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{student.name}</h1>
        <p className="text-indigo-600 font-medium mt-1">{student.program}</p>
        <p className="text-gray-600 mt-4">{student.bio}</p>

        {student.skills && student.skills.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {student.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}