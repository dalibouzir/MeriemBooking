export const dynamic = 'force-dynamic';
export const revalidate = 0;

import FreeCallClient from './FreeCallClient';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  // Next 15 may pass this as a Promise; accept & await it.
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  // accept ?token=... or ?code=...
  const token =
    typeof sp.token === 'string'
      ? sp.token
      : typeof sp.code === 'string'
      ? sp.code
      : '';

  return <FreeCallClient initialToken={token} />;
}
