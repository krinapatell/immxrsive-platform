import 'server-only';
import { db } from './db';
import { getPublicProject, getPublicStudent } from './students';

export interface InquirySource {
  source_type: 'student' | 'project';
  source_id: string;
  source_name: string;
  source_url: string;
}

/**
 * Looks up the student or project an inquiry is about. The context comes from
 * our database, not from the browser, so it can't be changed by editing the URL
 * into something that doesn't exist (R1.18, R1.19).
 */
export async function resolveInquirySource(type: string, id: string): Promise<InquirySource | null> {
  if (type === 'student') {
    const s = await getPublicStudent(id);
    return s ? { source_type: 'student', source_id: s.id, source_name: s.name, source_url: `/students/${s.id}` } : null;
  }
  if (type === 'project') {
    const p = await getPublicProject(id);
    return p ? { source_type: 'project', source_id: p.id, source_name: p.title, source_url: `/projects/${p.id}` } : null;
  }
  return null;
}

export async function saveInquiry(source: InquirySource, form: Record<string, string>) {
  const { error } = await db().from('inquiries').insert({ ...source, ...form });
  if (error) throw error;
}
