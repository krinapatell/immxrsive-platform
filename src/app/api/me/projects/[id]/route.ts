import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import {
  editorView,
  invite,
  maintainerAction,
  requestJoin,
  respond,
  setPublished,
  transferMaintenance,
  updateMyContribution,
  updateShared,
} from '@/lib/projects';

type Ctx = { params: Promise<{ id: string }> };

/** GET: the editor view of a project I'm connected to. */
export async function GET(_request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  try {
    const view = await editorView(auth.user, id);
    return NextResponse.json(view, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PUT: save SHARED fields (maintainer only, version-checked; R3.06, R3.17, R3.24).
 * A 409 with `latest` means someone else saved first; nothing was overwritten.
 */
export async function PUT(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const result = await updateShared(auth.user, id, body);
    if ('duplicates' in result) return NextResponse.json({ duplicates: result.duplicates }, { status: 409 });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST { action, ... }: everything else. Each action checks on the server
 * who is allowed to do it; the browser's buttons are only a convenience.
 */
export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth.user === null) return auth.error;
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const user = auth.user;
  try {
    switch (body.action) {
      case 'publish':
      case 'unpublish':
        return NextResponse.json(await setPublished(user, id, body.action === 'publish'));
      case 'invite':
        return NextResponse.json(await invite(user, id, body.github_login, body.role));
      case 'accept':
      case 'decline':
        return NextResponse.json(await respond(user, id, body.action === 'accept', body.role));
      case 'join':
        return NextResponse.json(await requestJoin(user, id, body.role));
      case 'approve':
      case 'reject':
      case 'cancel':
      case 'remove':
      case 'restore':
        return NextResponse.json(await maintainerAction(user, id, String(body.student_id ?? ''), body.action));
      case 'transfer':
        return NextResponse.json(await transferMaintenance(user, id, String(body.student_id ?? '')));
      case 'my_contribution':
        return NextResponse.json(await updateMyContribution(user, id, body));
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
