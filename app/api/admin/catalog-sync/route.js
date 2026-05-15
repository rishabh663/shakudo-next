import { NextResponse } from 'next/server';
import { syncCatalog } from '../../../../lib/catalog-db';

export async function POST(req) {
  // Optional bearer token protection — set ADMIN_SYNC_SECRET in env to enable
  const secret = process.env.ADMIN_SYNC_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const summary = await syncCatalog();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error('Catalog sync error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
