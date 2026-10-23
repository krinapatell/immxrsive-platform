import { NextResponse, type NextRequest } from 'next/server';
import { parseDirectoryQuery, searchStudents } from '@/lib/students';

/**
 * Public directory API. Same filters as the directory page:
 *   /api/students?q=unity&skills=Unity,C%23&availability=internship&status=current
 * Returns only published profiles, with private fields removed (R2.19).
 */
export async function GET(request: NextRequest) {
  const params: Record<string, string[]> = {};
  for (const [key, value] of request.nextUrl.searchParams) (params[key] ??= []).push(value);
  try {
    const students = await searchStudents(parseDirectoryQuery(params));
    return NextResponse.json({ count: students.length, students }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Directory API error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Directory is temporarily unavailable.' }, { status: 503 });
  }
}
