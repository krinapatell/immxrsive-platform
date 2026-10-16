'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Student, Project } from '@/types';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  useEffect(() => {
    async function fetchStudentAndProjects() {
      if (!id) return;
      setLoading(true);

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (studentError || !studentData) {
        console.error('Error fetching student:', studentError);
        setLoading(false);
        return;
      }

      setStudent(studentData as Student);

      if (studentData.project_ids && studentData.project_ids.length > 0) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .in('id', studentData.project_ids);

        if (!projectError && projectData) {
          setProjects(projectData as Project[]);
        }
      }

      setLoading(false);
    }

    fetchStudentAndProjects();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading student profile...
      </main>
    );
  }

  if (!student) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-700">Student profile not found.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          ← Back to Directory
        </button>
      </main>
    );
  }

  const linksData = student.links as unknown as Record<string, any> | string | null;
  let rawGithubUrl: string | null = null;

  if (linksData && typeof linksData === 'object') {
    rawGithubUrl = linksData.github || null;
  } else if (typeof linksData === 'string') {
    try {
      const parsed = JSON.parse(linksData);
      rawGithubUrl = parsed?.github || null;
    } catch {
      rawGithubUrl = null;
    }
  }

  let githubUrl: string | null = null;
  if (rawGithubUrl) {
    const cleaned = String(rawGithubUrl).trim().replace(/\s+/g, '-');
    githubUrl =
      cleaned.startsWith('http://') || cleaned.startsWith('https://')
        ? cleaned
        : `https://${cleaned}`;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => router.push('/')}
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-6 inline-block"
      >
        ← Back to Directory
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-indigo-600 font-semibold text-lg mt-1">
              {student.program}
            </p>
            <p className="text-gray-700 text-base mt-2">{student.headline}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {student.status && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                  {student.status}
                </span>
              )}
              {Array.isArray(student.availability) ? (
                student.availability.map((avail, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize"
                  >
                    {avail}
                  </span>
                ))
              ) : student.availability ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                  {student.availability}
                </span>
              ) : null}
            </div>
          </div>

          <button
            onClick={() => setShowInquiryModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
          >
            Interested in working with this student
          </button>
        </div>

        {githubUrl && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">GitHub Profile:</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1 font-medium"
            >
              {githubUrl}
            </a>
          </div>
        )}

        {student.skills && student.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Skills & Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Featured Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {project.title || project.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {project.description}
                  </p>
                </div>
                {project.github_url || project.link ? (
                  <a
                    href={project.github_url || project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-sm font-medium text-indigo-600 hover:underline inline-block"
                  >
                    View Project Code →
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 text-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Employer Inquiry</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Inquiry sent to ${student.name}!`);
                setShowInquiryModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Inquiring about
                </label>
                <input
                  type="text"
                  readOnly
                  value={student.name}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="recruiter@acme.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Role / Opportunity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Software Engineer Intern"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Message & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="We reviewed your profile and project and would like to discuss..."
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded font-medium text-white"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}