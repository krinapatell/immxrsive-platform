'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentPortal() {
  const [step, setStep] = useState<'login' | 'otp' | 'editor'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState('');

  // Profile Form State
  const [profile, setProfile] = useState({
    name: 'Krina Patel',
    headline: 'Full-stack & Spatial Computing Developer',
    github_url: 'https://github.com/krinapatell',
    linkedin_url: 'https://linkedin.com/in/krinapatel',
    deployment_url: 'https://immxrsive-platform-o787.vercel.app',
    repository_url: 'https://github.com/krinapatell/immxrsive-platform',
    skills: ['React', 'Next.js', 'TypeScript', 'Java', 'Python', 'Supabase'],
    is_published: true,
  });

  const [resumeName, setResumeName] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  // R2.04 & R2.05 Domain Enforcement
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const domain = email.split('@')[1];
    if (domain !== 'algomau.ca') {
      setEmailError('Access Restricted: You must use an official @algomau.ca student address.');
      return;
    }
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length >= 4) {
      setStep('editor');
    }
  };

  // Resume PDF Parse & Candidate Extraction Review
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeName(file.name);
      setExtractedSkills(['C#', 'Unity', 'FastAPI', 'WebXR']);
    }
  };

  const addExtractedSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
    }
    setExtractedSkills(extractedSkills.filter(s => s !== skill));
  };

  const handleSave = (publish: boolean) => {
    setProfile({ ...profile, is_published: publish });
    setSaveMessage(publish ? 'Profile published to directory!' : 'Draft saved privately.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

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

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold mb-2">Student Self-Service Portal</h1>
        <p className="text-slate-500 text-sm mb-8">Maintain your profile, verify affiliation, attach resumes, and manage directory publishing.</p>

        {/* STEP 1: GitHub Sign-in & Email Verification */}
        {step === 'login' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold">1. Authentication & Affiliation</h2>
            
            <button
              onClick={() => {}}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition"
            >
              Sign in with GitHub
            </button>

            <div className="relative border-t border-slate-200 my-4">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-slate-400 font-semibold uppercase">
                Or Verify Algoma ID
              </span>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Algoma Student Email</label>
                <input
                  type="email"
                  required
                  placeholder="username@algomau.ca"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {emailError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {emailError}
                </div>
              )}

              <button type="submit" className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition">
                Send Verification Challenge →
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: OTP Entry */}
        {step === 'otp' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold">2. Enter OTP Verification Code</h2>
            <p className="text-xs text-slate-500">Enter the single-use 6-digit code sent to <strong>{email}</strong> (Expires in 30 mins).</p>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="123456"
                className="w-full p-3 rounded-xl border border-slate-200 text-sm text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-[#6366F1] focus:outline-none"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <button type="submit" className="w-full bg-[#6366F1] text-white font-semibold py-3 rounded-xl hover:bg-[#4F46E5] transition">
                Verify OTP & Continue →
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Profile Editor, Resume Attachment, Links */}
        {step === 'editor' && (
          <div className="space-y-6">
            {saveMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                ✓ {saveMessage}
              </div>
            )}

            {/* Resume Upload & Parsing */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-1">Attach Resume (PDF)</h2>
              <p className="text-xs text-slate-500 mb-4">Upload fixture or custom resume to extract skills for candidate review.</p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#6366F1]/10 file:text-[#6366F1]"
              />

              {extractedSkills.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-600 uppercase mb-2">Review Extracted Candidate Skills:</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map(sk => (
                      <button
                        key={sk}
                        onClick={() => addExtractedSkill(sk)}
                        className="text-xs bg-white border border-slate-300 px-3 py-1 rounded-lg hover:border-[#6366F1] hover:text-[#6366F1] transition"
                      >
                        + Accept "{sk}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Information & Professional Links */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Professional Profile Fields</h2>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Headline</label>
                <input type="text" value={profile.headline} onChange={e => setProfile({...profile, headline: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">GitHub Profile Link</label>
                  <input type="url" value={profile.github_url} onChange={e => setProfile({...profile, github_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">LinkedIn Profile Link</label>
                  <input type="url" value={profile.linkedin_url} onChange={e => setProfile({...profile, linkedin_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Deployment URL</label>
                  <input type="url" value={profile.deployment_url} onChange={e => setProfile({...profile, deployment_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Repository URL</label>
                  <input type="url" value={profile.repository_url} onChange={e => setProfile({...profile, repository_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-[#6366F1] focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <button onClick={() => handleSave(false)} className="bg-slate-200 text-slate-800 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-300 transition">
                Save Private Draft
              </button>
              <button onClick={() => handleSave(true)} className="bg-[#6366F1] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#4F46E5] transition">
                Publish Profile to Directory →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
