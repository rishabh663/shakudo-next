import { NextResponse } from 'next/server';
import { runCatalogSync } from '@/lib/catalog-db';

export async function GET(req) {
  // CRON_SECRET is set automatically by Vercel when crons are configured.
  // Set it manually in .env.local to protect local testing too.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized', requiresAuth: true },
        { status: 401 }
      );
    }
  }

  try {
    const summary = await runCatalogSync('cron');
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error('Cron catalog sync error:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
