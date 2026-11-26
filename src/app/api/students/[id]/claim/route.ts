import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { submitClaim } from '@/lib/admin';

/**
 * POST { message }: "this imported profile is mine" (F.08 - F.10).
 * Approved at once only when the signed-in student's verified Algoma email is
 * the one the old site had; otherwise it waits for staff review.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = (await readJson(request)) ?? {};
  try {
    const result = await submitClaim(auth.user, id, body.message);
    return NextResponse.json(result, { status: result.status === 'approved' ? 200 : 202 });
  } catch (err) {
    return errorResponse(err, 'claims');
  }
}
