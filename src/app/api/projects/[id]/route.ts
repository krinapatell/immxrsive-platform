import { NextResponse } from 'next/server';
import { getPublicProject } from '@/lib/students';

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = await getPublicProject(id);
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  return NextResponse.json({ project }, { headers: { 'Cache-Control': 'no-store' } });
}
