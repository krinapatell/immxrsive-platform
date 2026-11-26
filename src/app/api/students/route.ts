import { NextResponse, type NextRequest } from 'next/server';
import { parseDirectoryQuery, searchStudents } from '@/lib/students';

/**
 * Public directory API. Same filters as the directory page:
 *   /api/students?q=unity&skills=Unity,C%23&availability=internship&status=current&page=2
 * Returns one page (24 profiles at most) plus the total count (F.28).
 * Returns only published profiles, with private fields removed (R2.19).
 */
export async function GET(request: NextRequest) {
  const params: Record<string, string[]> = {};
  for (const [key, value] of request.nextUrl.searchParams) (params[key] ??= []).push(value);
  try {
    const page = Number(params.page?.[0]) || 1;
    const result = await searchStudents(parseDirectoryQuery(params), page);
    return NextResponse.json(
      { count: result.total, page: result.page, page_size: result.pageSize, students: result.students },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('Directory API error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Directory is temporarily unavailable.' }, { status: 503 });
  }
}
