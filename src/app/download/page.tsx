export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'
import DownloadClient from './DownloadClient'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Page({
  searchParams,
}: {
  // Next 15 sometimes types this as a Promise; accept and await.
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedParams = (await searchParams) ?? {}
  const product = typeof resolvedParams.product === 'string' ? resolvedParams.product : ''
  if (!product) {
    redirect('/train-program')
  }
  return <DownloadClient initialProduct={product} />
}
