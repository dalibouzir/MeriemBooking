import FreeCallClient from './FreeCallClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = Record<string, string | string[] | undefined>

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = (await searchParams) ?? {}
  const token =
    typeof sp.token === 'string'
      ? sp.token
      : typeof sp.code === 'string'
      ? sp.code
      : ''

  return <FreeCallClient initialToken={token} />
}
