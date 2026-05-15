'use server';
import { runCatalogSync } from '@/lib/catalog-db';

export async function triggerSync() {
  return runCatalogSync('manual');
}
