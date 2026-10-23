import { NextResponse } from 'next/server';
import { getPublicStudent } from '@/lib/students';

/** Public profile API: only published profiles, private fields removed (R2.19). */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const student = await getPublicStudent(id);
  if (!student) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  return NextResponse.json({ student }, { headers: { 'Cache-Control': 'no-store' } });
}
