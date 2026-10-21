'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProfileModal({ isOpen, onClose, onSuccess }: Props) {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

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

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto text-[#2C2825]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Student Profile</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">✕</button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Full Name *</label>
            <input
              type="text"
              required
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
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
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="krina@algomau.ca"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">Program</label>
              <input
                type="text"
                className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
                value={formData.program}
                onChange={e => setFormData({ ...formData, program: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Department</label>
              <input
                type="text"
                className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
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
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
              value={formData.project_title}
              onChange={e => setFormData({ ...formData, project_title: e.target.value })}
              placeholder="e.g. Immxrsive Platform"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Deployment URL *</label>
            <input
              type="url"
              required
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
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
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
              value={formData.repository_url}
              onChange={e => setFormData({ ...formData, repository_url: e.target.value })}
              placeholder="https://github.com/org/repo"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white"
              value={formData.skills}
              onChange={e => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, Next.js, Supabase, TypeScript"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Project Description</label>
            <textarea
              rows={3}
              className="w-full p-2.5 rounded-lg border border-[#E8E2D9] bg-white resize-none"
              value={formData.project_description}
              onChange={e => setFormData({ ...formData, project_description: e.target.value })}
              placeholder="Brief overview of what you built..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-200/50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#C85A32] text-white rounded-lg font-medium hover:bg-[#b04d2a] disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
