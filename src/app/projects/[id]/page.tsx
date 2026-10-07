'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  skills?: string[];
  link?: string;
  github?: string;
  student_id?: string;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
      } else if (data) {
        setProject(data as Project);
      }
      setLoading(false);
    }

    fetchProject();
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

  if (!project) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
        <p className="text-gray-600 mt-2">No project matches ID: {id}</p>
        <Link
          href="/"
          className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          &larr; Back to Directory
        </Link>
      </main>
    );
  }

  const tags = project.tags || project.skills || [];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
      >
        &larr; Back to Directory
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {project.title}
        </h1>

        <p className="mt-4 text-gray-700 leading-relaxed text-lg">
          {project.description}
        </p>

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4 border-t border-gray-100 pt-6">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Live Demo &rarr;
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors"
            >
              GitHub Code
            </a>
          )}
        </div>
      </div>
    </main>
  );
}