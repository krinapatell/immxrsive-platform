'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Student, Project } from '@/types';

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [student, setStudent] = useState<Student | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentAndProjects() {
      setLoading(true);
      setError(null);

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        setError('Student profile not found.');
        setLoading(false);
        return;
      }

      setStudent(studentData as Student);

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .contains('student_ids', [studentId]);

      if (projectError) {
        console.error('Error fetching projects:', projectError);
      } else if (projectData) {
        setProjects(projectData as Project[]);
      }

      setLoading(false);
    }

    if (studentId) {
      fetchStudentAndProjects();
    }
  }, [studentId]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Loading student profile...</p>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Student Not Found'}</h2>
        <Link
          href="/"
          className="inline-block py-2 px-4 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition"
        >
          &larr; Back to Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          &larr; Back to Talent Directory
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900">{student.name}</h1>
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium capitalize">
                {student.status}
              </span>
            </div>
            <p className="text-indigo-600 font-semibold text-lg mt-1">{student.program}</p>
            <p className="text-gray-600 mt-2 text-base max-w-2xl">{student.headline}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {student.email && (
              <a
                href={`mailto:${student.email}`}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition"
              >
                Email
              </a>
            )}
            {student.github_url && (
              <a
                href={student.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition"
              >
                GitHub
              </a>
            )}
            {student.linkedin_url && (
              <a
                href={student.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition"
              >
                LinkedIn
              </a>
            )}
            {student.portfolio_url && (
              <a
                href={student.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium rounded transition"
              >
                Portfolio
              </a>
            )}
          </div>
        </div>

        {student.availability && student.availability.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Seeking Opportunities
            </h3>
            <div className="flex flex-wrap gap-2">
              {student.availability.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {student.skills && student.skills.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Projects</h2>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
            No public projects linked to this profile yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg border p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {project.project_url && (
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-center w-full py-2 px-4 bg-gray-900 text-white font-medium text-xs rounded hover:bg-gray-800 transition mt-2"
                  >
                    View Project Link &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
