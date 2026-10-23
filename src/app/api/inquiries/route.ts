import { NextResponse } from 'next/server';
import { resolveInquirySource, saveInquiry } from '@/lib/inquiry';

/** Simulated company intake (fixtures/r1/company_intake_simulation.md). No employer account needed. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const source = await resolveInquirySource(String(body.source_type ?? ''), String(body.source_id ?? ''));
  if (!source) return NextResponse.json({ error: 'That student or project could not be found.' }, { status: 404 });

  const field = (key: string, max: number) => (typeof body[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '');
  const form = {
    company_name: field('company_name', 120),
    contact_name: field('contact_name', 120),
    contact_email: field('contact_email', 200),
    description: field('description', 3000),
  };
  const errors: Record<string, string> = {};
  if (!form.company_name) errors.company_name = 'Enter your company name.';
  if (!form.contact_name) errors.contact_name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errors.contact_email = 'Enter a valid email address.';
  if (form.description.length < 10) errors.description = 'Describe the opportunity in at least a sentence.';
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  await saveInquiry(source, form);
  return NextResponse.json({ ok: true, source });
}
