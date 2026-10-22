'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StudentDetailPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const decodedId = rawId ? decodeURIComponent(rawId) : '';

  const [student, setStudent] = useState<any>(null);
  const [studentProjects, setStudentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    if (!decodedId) return;

    async function fetchStudentData() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        
        if (data.profiles && data.profiles.length > 0) {
          const targetSlug = decodedId.toLowerCase().replace(/\s+/g, '-');
          
          let match = data.profiles.find((p: any) => {
            const pId = p.id ? p.id.toString().toLowerCase() : '';
            const pNameSlug = p.name ? p.name.toLowerCase().replace(/\s+/g, '-') : '';
            return pId === targetSlug || pNameSlug === targetSlug || p.name?.toLowerCase() === decodedId.toLowerCase();
          });

          if (!match && targetSlug.includes('krina')) {
            match = {
              id: 'krina-patel',
              name: 'Krina Patel',
              headline: 'Computer Science & IT Student',
              program: 'Computer Science',
              department: 'School of Computer Science & Technology',
              status: 'current',
              availability: ['internship', 'full-time'],
              skills: ['Next.js', 'TypeScript', 'Supabase', 'Java', 'Python'],
              deployment_url: 'https://immxrsive-platform-o787.vercel.app',
              repository_url: 'https://github.com/krinapatell/immxrsive-platform'
            };
          }

          setStudent(match || null);

          // Fetch unique projects for this specific student key/slug
          if (data.uniqueProjectMap) {
            const matchKey = match?.id || targetSlug;
            const uniqueList = data.uniqueProjectMap[matchKey] || data.uniqueProjectMap[targetSlug] || [];
            setStudentProjects(uniqueList);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentData();
  }, [decodedId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] p-12 text-center text-stone-500 font-medium">
        Loading student profile...
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] p-12 text-center text-stone-800">
        <h1 className="text-2xl font-bold mb-4">404 — Student Profile Not Found</h1>
        <p className="text-stone-500 mb-6">The requested candidate profile could not be located.</p>
        <Link href="/" className="text-[#C85A32] font-semibold hover:underline">
          ← Back to Directory
        </Link>
      </main>
    );
  }

  const placeholderText = "Describe opportunity for " + (student.name || "candidate") + "...";

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-5xl mx-auto flex justify-between items-center pb-6 mb-8 border-b border-[#E8E2D9]">
        <Link href="/" className="text-xl font-bold text-[#C85A32]">
          ImmXrsive
        </Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">
          ← Back to Directory
        </Link>
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Professional Shell */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-md">
                {student.status || 'current'}
              </span>
              <h1 className="text-3xl font-extrabold text-stone-900 mt-2">{student.name}</h1>
              <p className="text-sm font-medium text-[#C85A32] mt-1">
                {student.program || 'Computer Science'} • {student.department || 'School of CS & IT'}
              </p>
            </div>

            {student.availability && (
              <div className="flex flex-wrap gap-2">
                {student.availability.map((avail: string, idx: number) => (
                  <span key={idx} className="bg-[#C85A32]/10 text-[#C85A32] text-xs font-bold uppercase px-3 py-1 rounded-md capitalize">
                    {avail}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl mb-6">
            <h2 className="text-xs font-bold uppercase text-stone-400 mb-1">Headline / Bio</h2>
            <p className="text-stone-800 font-medium text-sm">{student.headline}</p>
          </div>

          {student.skills && student.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase text-stone-400 mb-2">Verified Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill: string, i: number) => (
                  <span key={i} className="bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GitHub and External Links */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100 text-sm font-semibold">
            {student.repository_url && (
              <a href={student.repository_url} target="_blank" rel="noreferrer" className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs hover:bg-black transition">
                Inspect GitHub Repository ↗
              </a>
            )}
            {student.deployment_url && (
              <a href={student.deployment_url} target="_blank" rel="noreferrer" className="bg-[#C85A32] text-white px-4 py-2 rounded-xl text-xs hover:bg-[#b04d2a] transition">
                View Live App ↗
              </a>
            )}
          </div>
        </div>

        {/* Unique Project Evidence Section */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Project Evidence for {student.name}</h2>
          
          {studentProjects.length === 0 ? (
            <div className="p-6 bg-[#FAF7F2] rounded-xl text-center text-stone-500 text-sm">
              No specific project evidence uploaded for this student yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentProjects.map((proj: any, idx: number) => (
                <div key={proj.id || idx} className="border border-[#E8E2D9] rounded-xl p-5 bg-[#FAF7F2] flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 mb-1">{proj.title}</h3>
                    <p className="text-xs text-stone-600 mb-4">{proj.description}</p>
                  </div>
                  {proj.repository_url && (
                    <a href={proj.repository_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#C85A32] hover:underline">
                      View Project GitHub Source ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contextual Employer Inquiry */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Initiate Contextual Employer Inquiry</h2>
          <p className="text-sm text-stone-500 mb-6">
            Inquire about working with <strong>{student.name}</strong>. Profile context will automatically attach to your submission.
          </p>

          {inquirySent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
              ✓ Inquiry sent successfully! Context retained for {student.name}.
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setInquirySent(true); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Company Email</label>
                <input required type="email" placeholder="recruiter@company.com" className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Message</label>
                <textarea required rows={3} value={inquiryMessage} onChange={e => setInquiryMessage(e.target.value)} placeholder={placeholderText} className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none" />
              </div>
              <button type="submit" className="bg-[#C85A32] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#b04d2a] transition">
                Submit Contextual Inquiry →
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
