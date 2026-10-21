'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentPortalPage() {
  const [step, setStep] = useState<'auth' | 'verify' | 'editor'>('auth');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [verified, setVerified] = useState(false);

  // Profile Draft State (R2.10, R2.11)
  const [profile, setProfile] = useState({
    name: 'Krina Patel',
    email: 'kpatel@algomau.ca',
    headline: 'Computer Science & IT Student',
    program: 'Computer Science',
    department: 'School of Computer Science & Technology',
    status: 'current',
    availability: ['internship'],
    skills: ['Next.js', 'TypeScript', 'Supabase', 'Java', 'Python'],
    deployment_url: '',
    repository_url: 'https://github.com/krinapatell/immxrsive-platform',
    is_published: false,
  });

  const [newSkill, setNewSkill] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extractedSuggestions, setExtractedSuggestions] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState('');

  // R2.04 & R2.05: Verify Algoma Affiliation (@algomau.ca domain enforcement)
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const domain = email.split('@')[1];
    if (domain !== 'algomau.ca') {
      setEmailError('Access restricted. You must use an official @algomau.ca email address.');
      return;
    }

    setStep('verify');
  };

  const handleConfirmCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length >= 4) {
      setVerified(true);
      setStep('editor');
    }
  };

  // R2.13 & R2.14: PDF Resume Parsing Simulation with Candidate Extraction
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      // Simulate extraction from fixture PDF
      setExtractedSuggestions({
        headline: 'Full-stack & Spatial Systems Developer',
        extractedSkills: ['C#', 'Unity', 'React', 'FastAPI', 'REST APIs'],
      });
    }
  };

  const applySuggestion = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setExtractedSuggestions((prev: any) => ({
      ...prev,
      extractedSkills: prev.extractedSkills.filter((s: string) => s !== skill),
    }));
  };

  const addSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove),
    }));
  };

  // R2.21 & R2.22: Publish / Unpublish and Sync with Directory
  const handleSaveAndPublish = async (publishState: boolean) => {
    const updatedProfile = { ...profile, is_published: publishState, status: publishState ? 'current' : 'private' };
    setProfile(updatedProfile);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (res.ok) {
        setSaveSuccess(publishState ? 'Profile published to Talent Directory!' : 'Draft saved privately.');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-[#C85A32] hover:underline mb-6 inline-block">
          ← Back to Talent Directory
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Student Profile Portal</h1>
          <p className="text-stone-600 text-sm mt-1">Manage your professional profile, resume extraction, and publication status.</p>
        </header>

        {/* Step 1: GitHub OAuth Simulation & Algoma Verification */}
        {step === 'auth' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">1. Algoma University Affiliation</h2>
            <p className="text-sm text-stone-500 mb-6">Enter your student email address to receive a verification challenge.</p>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Student Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@algomau.ca"
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {emailError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {emailError}
                </div>
              )}

              <button type="submit" className="bg-[#C85A32] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#b04d2a] transition w-full">
                Verify Algoma Email →
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Verification Challenge (R2.04) */}
        {step === 'verify' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">2. Enter Single-Use Code</h2>
            <p className="text-sm text-stone-500 mb-6">A short-lived verification code was sent to <strong>{email}</strong>.</p>

            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                />
              </div>

              <button type="submit" className="bg-[#C85A32] text-white font-medium px-6 py-3 rounded-xl hover:bg-[#b04d2a] transition w-full">
                Confirm & Access Profile Editor →
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Self-Service Profile Editor (R2.10–R2.25) */}
        {step === 'editor' && (
          <div className="space-y-8">
            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-medium">
                ✓ {saveSuccess}
              </div>
            )}

            {/* Resume PDF Import Section (R2.13, R2.15) */}
            <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">PDF Resume Import</h2>
              <p className="text-xs text-stone-500 mb-4">Upload your PDF resume to extract skills and experience suggestions for review before applying.</p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#C85A32]/10 file:text-[#C85A32] hover:file:bg-[#C85A32]/20"
              />

              {extractedSuggestions && (
                <div className="mt-4 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                  <h3 className="text-xs font-bold uppercase text-stone-600 mb-2">Human Review — Extracted Candidates:</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedSuggestions.extractedSkills.map((skill: string) => (
                      <button
                        key={skill}
                        onClick={() => applySuggestion(skill)}
                        className="text-xs bg-white border border-stone-300 px-2.5 py-1 rounded-lg hover:border-[#C85A32] hover:text-[#C85A32] transition"
                      >
                        + Add "{skill}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Profile Fields Section */}
            <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold border-b border-stone-100 pb-3">Maintain Profile Details</h2>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Headline</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                  value={profile.headline}
                  onChange={e => setProfile({ ...profile, headline: e.target.value })}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Standardized Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="bg-stone-100 text-stone-700 text-xs px-3 py-1 rounded-lg font-medium flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="text-stone-400 hover:text-stone-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill..."
                    className="p-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32] flex-1"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                  />
                  <button onClick={addSkill} className="bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-black transition">
                    Add
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Deployment URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                    value={profile.deployment_url}
                    onChange={e => setProfile({ ...profile, deployment_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32]"
                    value={profile.repository_url}
                    onChange={e => setProfile({ ...profile, repository_url: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Actions: Save Draft vs Publish */}
            <section className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={() => handleSaveAndPublish(false)}
                className="bg-stone-200 text-stone-800 px-6 py-3 rounded-xl font-medium text-sm hover:bg-stone-300 transition"
              >
                Save Private Draft
              </button>
              <button
                onClick={() => handleSaveAndPublish(true)}
                className="bg-[#C85A32] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#b04d2a] transition shadow-sm"
              >
                Publish to Talent Directory →
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
