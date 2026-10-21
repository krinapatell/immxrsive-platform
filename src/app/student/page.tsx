'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    program: 'Computer Science',
    department: 'School of CS & IT',
    bio: '',
    skills: '',
    project_title: '',
    project_description: '',
    deployment_url: '',
    repository_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');

      setSuccessMsg('Profile published successfully!');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-[#E8E2D9] pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#C85A32] font-semibold">Student Portal</span>
            <h1 className="text-2xl font-bold mt-1">Create Your Talent Profile</h1>
          </div>
          <a href="/" className="text-sm text-stone-500 hover:underline">← Back to Index</a>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200">
            {successMsg} Redirecting to Talent Index...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Full Name *</label>
              <input
                type="text"
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50 focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Krina Patel"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50 focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="krina@algomau.ca"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Program</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
                value={formData.program}
                onChange={e => setFormData({ ...formData, program: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Department</label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Project Title *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
              value={formData.project_title}
              onChange={e => setFormData({ ...formData, project_title: e.target.value })}
              placeholder="e.g. Immxrsive Platform"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Deployment URL *</label>
              <input
                type="url"
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
                value={formData.deployment_url}
                onChange={e => setFormData({ ...formData, deployment_url: e.target.value })}
                placeholder="https://my-app.vercel.app"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Repository URL *</label>
              <input
                type="url"
                required
                className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
                value={formData.repository_url}
                onChange={e => setFormData({ ...formData, repository_url: e.target.value })}
                placeholder="https://github.com/org/repo"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50"
              value={formData.skills}
              onChange={e => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, Next.js, Supabase, TypeScript, Python"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Project Description & Evidence</label>
            <textarea
              rows={4}
              className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF7F2]/50 resize-none"
              value={formData.project_description}
              onChange={e => setFormData({ ...formData, project_description: e.target.value })}
              placeholder="Describe the architecture, evidence of testing, and key features built..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C85A32] text-white rounded-xl font-medium shadow-sm hover:bg-[#b04d2a] transition disabled:opacity-50"
          >
            {loading ? 'Publishing Profile...' : 'Publish Talent Profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
