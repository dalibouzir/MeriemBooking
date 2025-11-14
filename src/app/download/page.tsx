export const dynamic = 'force-dynamic'
export const revalidate = 0

import { redirect } from 'next/navigation'
import DownloadClient from './DownloadClient'

type SearchParams = Record<string, string | string[] | undefined>
type PageProps = {
  // Next 15 currently passes a Promise; keep the type aligned to avoid build errors.
  searchParams?: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) ?? {}
  const product = typeof resolvedParams.product === 'string' ? resolvedParams.product : ''
  if (!product) {
    redirect('/train-program')
  }
  return <DownloadClient initialProduct={product} />
}
