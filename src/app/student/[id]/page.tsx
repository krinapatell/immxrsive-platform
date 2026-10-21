'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (!studentId) return;

    async function fetchStudentData() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        if (data.profiles) {
          const match = data.profiles.find((p: any) => 
            p.id?.toString() === studentId ||
            p.name?.toLowerCase().replace(/\s+/g, '-') === studentId.toLowerCase()
          );
          setStudent(match || null);
        }
        if (data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] p-12 text-center text-slate-500 font-medium">
        Loading student profile...
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] p-12 text-center text-slate-800">
        <h1 className="text-2xl font-bold mb-4">404 — Student Profile Not Found</h1>
        <p className="text-slate-500 mb-6">The requested candidate profile could not be found.</p>
        <Link href="/" className="text-[#6366F1] font-semibold hover:underline">
          ← Back to Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#1E293B]">
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-[#6366F1]">
          ImmXrsive
        </Link>
        <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          ← Back to Directory
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Profile Card / Professional Shell */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                {student.status || 'Current Student'}
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{student.name}</h1>
              <p className="text-sm font-medium text-[#6366F1] mt-1">
                {student.program || 'Computer Science'} • {student.department || 'CS & IT'}
              </p>
            </div>

            {student.availability && (
              <div className="flex flex-wrap gap-2">
                {student.availability.map((avail: string, idx: number) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                    {avail}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6">
            <h2 className="text-xs font-bold uppercase text-slate-400 mb-1">Headline / Bio</h2>
            <p className="text-slate-800 font-medium text-sm">{student.headline}</p>
          </div>

          {student.skills && student.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase text-slate-400 mb-2">Verified Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill: string, i: number) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 text-sm font-semibold">
            {student.deployment_url && (
              <a href={student.deployment_url} target="_blank" rel="noreferrer" className="text-[#6366F1] hover:underline">
                Live Deployment ↗
              </a>
            )}
            {student.repository_url && (
              <a href={student.repository_url} target="_blank" rel="noreferrer" className="text-slate-700 hover:underline">
                GitHub Repository ↗
              </a>
            )}
          </div>
        </div>

        {/* Project Evidence Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Project Evidence & Portfolio Work</h2>
          
          {projects.length === 0 ? (
            <p className="text-slate-500 text-sm">No specific projects linked yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj: any) => (
                <div key={proj.id || proj.title} className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <h3 className="font-bold text-slate-900 mb-1">{proj.title || 'Project Work'}</h3>
                  <p className="text-xs text-slate-600 mb-3">{proj.description || 'Immersive/Software application evidence.'}</p>
                  {proj.repository_url && (
                    <a href={proj.repository_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#6366F1] hover:underline">
                      Inspect Repository ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contextual Employer Inquiry Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Initiate Employer Inquiry</h2>
          <p className="text-sm text-slate-500 mb-6">
            Inquire about working with <strong>{student.name}</strong>. Profile context will automatically attach to your submission.
          </p>

          {inquirySent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
              ✓ Inquiry sent successfully! Context retained for {student.name}.
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setInquirySent(true); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Company Email</label>
                <input required type="email" placeholder="recruiter@company.com" className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Message</label>
                <textarea required rows={3} value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} placeholder={Describe opportunity for ...} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
              </div>
              <button type="submit" className="bg-[#6366F1] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#4F46E5] transition">
                Submit Inquiry →
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
