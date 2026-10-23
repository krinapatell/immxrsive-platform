import { NextResponse } from 'next/server';
import { endSession } from '@/lib/session';

export async function POST(request: Request) {
  await endSession();
  return NextResponse.redirect(new URL('/student', request.url), { status: 303 });
}
