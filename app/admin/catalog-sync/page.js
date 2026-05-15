import { getLatestSyncRun } from '@/lib/catalog-db';
import SyncClient from './SyncClient';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogSyncPage() {
  const latestRun = await getLatestSyncRun();
  return <SyncClient latestRun={latestRun} />;
}
