import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { leaveStaff, redeemStaffCode } from '@/lib/staff';

/** POST { code }: become staff with the staff access code (R4.01). DELETE: stop being staff on this account. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const body = await readJson(request);
  try {
    await redeemStaffCode(auth.user, body?.code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE() {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  try {
    await leaveStaff(auth.user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
