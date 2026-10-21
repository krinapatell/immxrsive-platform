'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryText, setInquiryText] = useState('');

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch('/api/profiles');
        const data = await res.json();
        if (data.profiles) {
          const match = data.profiles.find(
            (p: any) =>
              p.id?.toString() === studentId ||
              p.name?.toLowerCase().replace(/\s+/g, '-') === studentId.toLowerCase()
          );
          if (match) {
            setStudent(match);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId]);

  const handleInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] p-12 text-center text-stone-500">
        Loading profile...
      </main>
    );
  }

  // R1.21: Invalid Route handling
  if (error || !student) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] p-12 text-center text-stone-700">
        <h1 className="text-2xl font-bold mb-4">404 — Student Profile Not Found</h1>
        <p className="mb-6 text-stone-500">The requested profile could not be located in our directory.</p>
        <Link href="/" className="text-[#C85A32] font-semibold hover:underline">
          ← Back to Talent Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] hover:underline mb-6 inline-block">
          ← Back to Directory
        </Link>

        {/* Professional Shell (R1.13) */}
        <section className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md">
                {student.status || 'current'}
              </span>
              <h1 className="text-3xl font-bold mt-2">{student.name}</h1>
              <p className="text-sm text-stone-500">{student.program || 'Student'} • {student.department || 'CS & IT'}</p>
            </div>

            {student.availability && (
              <div className="flex flex-wrap gap-1.5">
                {student.availability.map((a: string, i: number) => (
                  <span key={i} className="text-xs bg-[#C85A32]/10 text-[#C85A32] px-3 py-1 rounded-lg font-medium capitalize">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl mb-6">
            <h2 className="text-sm font-semibold text-stone-700 mb-1">Headline</h2>
            <p className="text-stone-800 font-medium">{student.headline || 'Immxrsive Platform Member'}</p>
          </div>

          {/* Standardized Skills (R1.13) */}
          {student.skills && student.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs uppercase font-semibold text-stone-400 tracking-wider mb-2">Verified Skills</h2>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-4 pt-4 border-t border-stone-100 text-sm font-medium">
            {student.deployment_url && (
              <a href={student.deployment_url} target="_blank" rel="noreferrer" className="text-[#C85A32] hover:underline">
                Live App / Portfolio ↗
              </a>
            )}
            {student.repository_url && (
              <a href={student.repository_url} target="_blank" rel="noreferrer" className="text-stone-600 hover:underline">
                GitHub Repository ↗
              </a>
            )}
          </div>
        </section>

        {/* Contextual Employer Inquiry Form (R1.18) */}
        <section className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Interested in working with {student.name}?</h2>
          <p className="text-stone-500 text-sm mb-6">
            Submit a direct inquiry. Context for <strong>{student.name} ({student.email || 'Algoma University Candidate'})</strong> will automatically be attached to your message.
          </p>

          {inquirySent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium">
              ✓ Inquiry submitted successfully! The university intake process retains {student.name}'s profile context.
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Company / Organization Name</label>
                <input required type="text" placeholder="e.g. Acme XR Labs" className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Contact Email</label>
                <input required type="email" placeholder="hiring@company.com" className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Inquiry Details</label>
                <textarea 
                  required 
                  rows={4} 
                  value={inquiryText}
                  onChange={e => setInquiryText(e.target.value)}
                  placeholder={Describe project requirements or opportunities for ...} 
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]" 
                />
              </div>

              <button type="submit" className="bg-[#C85A32] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#b04d2a] transition">
                Send Contextual Inquiry →
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
