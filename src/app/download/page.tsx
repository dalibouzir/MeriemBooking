export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DownloadClient from './DownloadClient';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  // Next 15 sometimes types this as a Promise; accept and await.
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const product = typeof sp.product === 'string' ? sp.product : '';
  return <DownloadClient initialProduct={product} />;
}
