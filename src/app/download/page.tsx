export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DownloadClient from './DownloadClient';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({ searchParams }: PageProps) {
  const product =
    typeof searchParams?.product === 'string' ? searchParams.product : '';
  return <DownloadClient initialProduct={product} />;
}
