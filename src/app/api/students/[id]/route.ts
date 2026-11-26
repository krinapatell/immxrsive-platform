import { NextResponse } from 'next/server';
import { getPublicStudent } from '@/lib/students';
import { studentRedirect } from '@/lib/admin';

/** Public profile API: only published profiles, private fields removed (R2.19). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const student = await getPublicStudent(id);
  if (!student) {
    const moved = await studentRedirect(id);
    if (moved) return NextResponse.json({ error: 'This profile was merged.', moved_to: moved, url: `/students/${moved}` }, { status: 301, headers: { Location: `/api/students/${moved}` } });
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }
  return NextResponse.json({ student }, { headers: { 'Cache-Control': 'no-store' } });
}
