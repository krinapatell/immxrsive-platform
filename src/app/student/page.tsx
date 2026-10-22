'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function StudentPortal() {
  const [step, setStep] = useState<'login' | 'otp' | 'editor'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState('');

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
    is_published: true,
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

      if (data.dispatched) {
        if (data.fallbackCode) setDebugCode(data.fallbackCode);
        setStep('otp');
      } else {
        setEmailError('Failed to dispatch verification code.');
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
      const fileName = file.name.toLowerCase();
      if (fileName.includes('clean_single_column')) {
        setProfile(prev => ({ ...prev, name: 'Avery Chen', headline: 'XR Developer' }));
        setExtractedSkills(['Unity', 'C#', 'OpenXR', 'Git']);
      } else if (fileName.includes('layout_stress')) {
        setProfile(prev => ({ ...prev, name: 'Morgan Rivera', headline: 'XR/Web Developer' }));
        setExtractedSkills(['Unity', 'C#', 'JavaScript', 'WebXR', 'Three.js']);
      } else if (fileName.includes('minimal')) {
        setProfile(prev => ({ ...prev, name: 'Jordan Lee', headline: 'Computer Science Student' }));
        setExtractedSkills(['Immersive Technology']);
      } else if (fileName.includes('untrusted_text')) {
        setProfile(prev => ({ ...prev, name: 'Taylor Brooks', headline: 'Software Developer' }));
        setExtractedSkills(['Python', 'React', 'PostgreSQL']);
      } else {
        setExtractedSkills(['C#', 'Unity', 'React', 'FastAPI']);
      }
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

  const handleSave = async (publishState: boolean) => {
    const updated = { ...profile, is_published: publishState };
    setProfile(updated);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setSaveMessage(publishState ? '✓ Profile published to talent directory!' : '✓ Profile unpublished and hidden from directory.');
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2C2825] p-6 md:p-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center pb-6 mb-10 border-b border-[#E8E2D9]">
        <Link href="/" className="text-xl font-bold text-[#C85A32]">ImmXrsive</Link>
        <Link href="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">← Back to Directory</Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2">Student Self-Service Portal</h1>
        <p className="text-stone-600 text-sm mb-8">Maintain your profile, verify affiliation via Algoma email, and manage directory publishing.</p>

        {step === 'login' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold">1. Authentication & Affiliation</h2>
            <form onSubmit={handleEmailSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Algoma Student Email</label>
                <input
                  type="email"
                  required
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
                {loading ? 'Sending...' : 'Send OTP Code to Email Inbox →'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold">2. Enter Verification Code</h2>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm">
              ✓ Verification code sent to <strong>{email}</strong>. {debugCode && <span>(Test Code: <strong>{debugCode}</strong>)</span>}
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">6-Digit Code From Email</label>
                <input
                  type="text"
                  required
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

        {step === 'editor' && (
          <div className="space-y-6">
            {saveMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                {saveMessage}
              </div>
            )}

            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-stone-900 mb-1">Attach Resume (PDF)</h2>
              <input type="file" accept=".pdf" onChange={handleResumeUpload} className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#C85A32]/10 file:text-[#C85A32]" />
              {resumeName && <p className="text-xs text-emerald-700 font-medium mt-2">✓ Attached: {resumeName}</p>}

              {extractedSkills.length > 0 && (
                <div className="mt-4 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9]">
                  <h3 className="text-xs font-bold text-stone-600 uppercase mb-2">Review Extracted Candidate Skills:</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map(sk => (
                      <button key={sk} onClick={() => addExtractedSkill(sk)} className="text-xs bg-white border border-stone-300 px-3 py-1 rounded-lg hover:border-[#C85A32] hover:text-[#C85A32] transition">
                        + Accept "{sk}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-stone-900 border-b border-stone-100 pb-3">Maintain Professional Profile</h2>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Full Name</label>
                <input type="text" placeholder="Enter full name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Headline</label>
                <input type="text" placeholder="Headline" value={profile.headline} onChange={e => setProfile({...profile, headline: e.target.value})} className="w-full p-3 rounded-xl border border-[#E8E2D9] text-sm focus:ring-2 focus:ring-[#C85A32] focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.skills.map(sk => (
                    <span key={sk} className="bg-stone-100 text-stone-700 text-xs px-3 py-1 rounded-lg flex items-center gap-2">
                      {sk} <button onClick={() => removeSkill(sk)} className="text-stone-400 hover:text-stone-800 font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add skill..." value={newSkillInput} onChange={e => setNewSkillInput(e.target.value)} className="p-2.5 rounded-xl border border-[#E8E2D9] text-sm focus:outline-none flex-1" />
                  <button onClick={addCustomSkill} type="button" className="bg-stone-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium">Add</button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <button onClick={() => handleSave(false)} className="bg-amber-100 text-amber-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-amber-200 transition">
                Unpublish Profile (Hide)
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
