import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { listPublicPartners } from '@/lib/partners';

/** Public: published industry partners. Private collaborations are never included; Limited ones only as their summary (R4.18). */
export async function GET() {
  try {
    return NextResponse.json({ partners: await listPublicPartners() });
  } catch (err) {
    return errorResponse(err);
  }
}
