import 'server-only';
import { db } from './db';
import { getPublicProject, getPublicStudent } from './students';
import { getPublicCollaboration, getPublicPartner } from './partners';

export interface InquirySource {
  source_type: 'student' | 'project' | 'company' | 'collaboration';
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
  if (type === 'company') {
    const c = await getPublicPartner(id);
    return c ? { source_type: 'company', source_id: c.id, source_name: c.name, source_url: `/partners/${c.id}` } : null;
  }
  if (type === 'collaboration') {
    // Only Public collaborations can be asked about by name (R4.18, R4.24).
    const c = await getPublicCollaboration(id);
    return c
      ? { source_type: 'collaboration', source_id: c.id, source_name: `${c.title} (with ${c.partner.name})`, source_url: `/partners/${c.partner.id}` }
      : null;
  }
  return null;
}

export async function saveInquiry(source: InquirySource, form: Record<string, string>) {
  const { error } = await db().from('inquiries').insert({ ...source, ...form });
  if (error) throw error;
}
