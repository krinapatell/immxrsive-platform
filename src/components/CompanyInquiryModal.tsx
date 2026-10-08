'use client';

import { useState } from 'react';

interface CompanyInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId?: string;
  projectTitle?: string;
  projectId?: string;
}

export default function CompanyInquiryModal({
  isOpen,
  onClose,
  studentName,
  studentId,
  projectTitle,
  projectId,
}: CompanyInquiryModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    roleTitle: '',
    message: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Employer Inquiry
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg font-semibold"
          >
            &times;
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              ✓
            </div>
            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Inquiry Sent Successfully!
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your message and context have been securely routed to {studentName}.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <p><strong className="text-zinc-900 dark:text-zinc-100">Inquiring about:</strong> {studentName}</p>
              {projectTitle && (
                <p className="mt-1"><strong className="text-zinc-900 dark:text-zinc-100">Project Context:</strong> {projectTitle}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="recruiter@acme.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Role / Opportunity Title
              </label>
              <input
                type="text"
                required
                value={formData.roleTitle}
                onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                placeholder="Software Engineer Intern"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Message & Details
              </label>
              <textarea
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="We reviewed your profile and project and would like to discuss..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                Submit Inquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
