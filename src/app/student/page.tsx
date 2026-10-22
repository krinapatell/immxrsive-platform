'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentPortal() {
  const [step, setStep] = useState<'login' | 'otp' | 'editor'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clean Blank Form State
  const [profile, setProfile] = useState({
    name: '',
    headline: '',
    status: 'current',
    availability: [] as string[],
    github_url: '',
    linkedin_url: '',
    deployment_url: '',
    repository_url: '',
    skills: [] as string[],
    is_published: false,
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const domain = email.split('@')[1];
    if (domain !== 'algomau.ca') {
      setEmailError('Access Restricted: You must enter an official @algomau.ca student email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email })
      });
      const data = await res.json();

      if (data.challengeCode) {
        setDisplayCode(data.challengeCode);
        setStep('otp');
      } else {
        setEmailError('Failed to generate verification challenge.');
      }
    } catch (err) {
      setEmailError('Network error connecting to verification service.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', email, otp })
      });

      if (res.ok) {
        setStep('editor');
      } else {
        alert('Invalid verification code entered.');
      }
    } catch (err) {
      alert('Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailabilityOption = (option: string) => {
    setProfile(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeName(file.name);
      setExtractedSkills(['C#', 'Unity', 'React', 'FastAPI']);
    }
  };

  const addExtractedSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
    }
    setExtractedSkills(extractedSkills.filter(s => s !== skill));
  };

  const addCustomSkill = () => {
    if (newSkillInput && !profile.skills.includes(newSkillInput)) {
      setProfile({ ...profile, skills: [...profile.skills, newSkillInput] });
      setNewSkillInput('');
    }
  };

  const removeSkill = (s: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(item => item !== s) });
  };

  const handleSave = async (publish: boolean) => {
    const updated = { ...profile, is_published: publish };
    setProfile(updated);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setSaveMessage(publish ? '✓ Profile published to talent directory!' : '✓ Draft saved privately.');
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <Link href="/" className="text-xl font-bold text-[#C85A32]">
          ImmXrsive
        </Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">
          ← Back to Directory
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2">Student Self-Service Portal</h1>
        <p className="text-stone-600 text-sm mb-8">Maintain your profile, verify affiliation via Algoma email, attach resumes, and manage directory publishing.</p>

        {/* STEP 1: Email Input */}
        {step === 'login' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold">1. Authentication & Affiliation</h2>
            
            <button
              onClick={() => setStep('editor')}
              className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition"
            >
              Sign in with GitHub →
            </button>

            <div className="relative border-t border-[#E8E2D9] my-4">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-stone-400 font-semibold uppercase">
                Or Algoma Email Verification
              </span>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Algoma Student Email</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="username@algomau.ca"
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {emailError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                  {emailError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C85A32] text-white font-semibold py-3 rounded-xl hover:bg-[#b04d2a] transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send Verification Code →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter Code */}
        {step === 'otp' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold">2. Enter Verification Code</h2>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider">Simulated Secure Email Dispatch for {email}:</p>
              <p>Your verification code is: <span className="font-mono font-bold text-base text-[#C85A32]">{displayCode}</span></p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">6-Digit Code</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter 6-digit code..."
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C85A32] text-white font-semibold py-3 rounded-xl hover:bg-[#b04d2a] transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code & Access Editor →'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Blank Profile Editor */}
        {step === 'editor' && (
          <div className="space-y-6">
            {saveMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                {saveMessage}
              </div>
            )}

            {/* Resume Upload */}
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-1">Attach Resume (PDF)</h2>
              <p className="text-xs text-stone-500 mb-4">Upload fixture or custom resume to extract skills for candidate review.</p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#C85A32]/10 file:text-[#C85A32]"
              />

              {resumeName && (
                <p className="text-xs text-emerald-700 font-medium mt-2">✓ Attached: {resumeName}</p>
              )}

              {extractedSkills.length > 0 && (
                <div className="mt-4 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                  <h3 className="text-xs font-bold text-stone-600 uppercase mb-2">Review Extracted Candidate Skills:</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map(sk => (
                      <button
                        key={sk}
                        onClick={() => addExtractedSkill(sk)}
                        className="text-xs bg-white border border-stone-300 px-3 py-1 rounded-lg hover:border-[#C85A32] hover:text-[#C85A32] transition"
                      >
                        + Accept "{sk}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-stone-900 border-b border-stone-100 pb-3">Maintain Professional Profile</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Enter full name"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Status</label>
                  <select
                    value={profile.status}
                    onChange={e => setProfile({...profile, status: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] bg-white text-sm font-medium focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  >
                    <option value="current">Current Student</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Availability Options</label>
                <div className="flex flex-wrap gap-2">
                  {['internship', 'full-time', 'contract'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleAvailabilityOption(opt)}
                      className={"px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition " + (profile.availability.includes(opt) ? 'bg-[#C85A32] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                    >
                      {opt} {profile.availability.includes(opt) && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Headline</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Enter headline (e.g. CS & IT Student)"
                  value={profile.headline}
                  onChange={e => setProfile({...profile, headline: e.target.value})}
                  className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.skills.map(sk => (
                    <span key={sk} className="bg-stone-100 text-stone-700 text-xs px-3 py-1 rounded-lg flex items-center gap-2">
                      {sk}
                      <button onClick={() => removeSkill(sk)} className="text-stone-400 hover:text-stone-800 font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Add skill..."
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    className="p-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#C85A32] flex-1"
                  />
                  <button onClick={addCustomSkill} type="button" className="bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-black transition">
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">GitHub Profile Link</label>
                  <input
                    type="url"
                    autoComplete="off"
                    placeholder="https://github.com/username"
                    value={profile.github_url}
                    onChange={e => setProfile({...profile, github_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">LinkedIn Profile Link</label>
                  <input
                    type="url"
                    autoComplete="off"
                    placeholder="https://linkedin.com/in/username"
                    value={profile.linkedin_url}
                    onChange={e => setProfile({...profile, linkedin_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Deployment URL</label>
                  <input
                    type="url"
                    autoComplete="off"
                    placeholder="https://your-portfolio.vercel.app"
                    value={profile.deployment_url}
                    onChange={e => setProfile({...profile, deployment_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Repository URL</label>
                  <input
                    type="url"
                    autoComplete="off"
                    placeholder="https://github.com/username/repo"
                    value={profile.repository_url}
                    onChange={e => setProfile({...profile, repository_url: e.target.value})}
                    className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <button onClick={() => handleSave(false)} className="bg-stone-200 text-stone-800 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-stone-300 transition">
                Save Private Draft
              </button>
              <button onClick={() => handleSave(true)} className="bg-[#C85A32] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#b04d2a] transition">
                Publish Profile to Directory →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
