import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/users';
import { listSkills } from '@/lib/students';
import { pdfToText } from '@/lib/resume/pdf';
import { isEmpty, parseResumeText } from '@/lib/resume/parse';

// Vercel refuses request bodies over ~4.5 MB, so the limit is 4 MB.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Resume import (R2.13 – R2.17, R2.31, R2.32).
 * Returns SUGGESTIONS only. Nothing is saved to the profile here: the
 * student reviews each suggestion in the editor and chooses what to apply.
 * The PDF itself is never stored.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Sign in with GitHub first.' }, { status: 401 });
  if (!user.affiliation_verified_at) return NextResponse.json({ error: 'Verify your Algoma email first.' }, { status: 403 });

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get('resume');
    file = value instanceof File ? value : null;
  } catch {
    file = null;
  }
  if (!file) return NextResponse.json({ error: 'Choose a PDF file to upload.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'That file is larger than 4 MB. Please upload a smaller PDF (for example, export it again without images).' }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = bytes.length > 4 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (!isPdf) return NextResponse.json({ error: 'That file is not a PDF. Please upload your resume as a PDF.' }, { status: 400 });

  let text = '';
  try {
    text = await pdfToText(bytes);
  } catch (err) {
    console.error('Resume read failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "We couldn't read this PDF. Your profile hasn't changed — you can keep editing it by hand." },
      { status: 422 },
    );
  }

  const suggestions = parseResumeText(text, await listSkills());
  if (isEmpty(suggestions)) {
    return NextResponse.json({
      suggestions,
      message: "We couldn't find any fields to suggest in this resume. Nothing was changed — you can fill in your profile by hand.",
    });
  }
  return NextResponse.json({ suggestions });
}
