import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { getPublicPartner } from '@/lib/partners';

type Ctx = { params: Promise<{ id: string }> };

/** Public: one published partner, same filtering as the partner page. Drafts return 404. */
export async function GET(_r: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const partner = await getPublicPartner(id);
    if (!partner) return NextResponse.json({ error: 'Partner not found.' }, { status: 404 });
    return NextResponse.json({ partner });
  } catch (err) {
    return errorResponse(err);
  }
}
