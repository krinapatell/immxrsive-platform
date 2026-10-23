import { NextResponse } from 'next/server';
import { listSkills } from '@/lib/students';

/** The standardized skill set (from fixtures/r1/skills.json, stored in the database). */
export async function GET() {
  return NextResponse.json({ skills: await listSkills() });
}
