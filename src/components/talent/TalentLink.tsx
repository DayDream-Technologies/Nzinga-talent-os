import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { findTalentAccount, talentAccountPath } from '@/lib/talent-account'
import { useTalentDirectory } from '@/hooks/useTalentDirectory'
import { T } from '@/lib/tokens'

export function TalentLink({
  accountId,
  name,
  children,
}: {
  accountId?: string | null
  name?: string | null
  children?: ReactNode
}) {
  const directory = useTalentDirectory()
  const entry = findTalentAccount(directory, { accountId, name })
  const label = children ?? name ?? accountId ?? '—'
  if (!entry) return <>{label}</>
  return (
    <Link
      to={talentAccountPath(entry.accountId)}
      title={`${entry.name} · ${entry.accountId}`}
      style={{
        color: T.blue,
        fontWeight: 600,
        textDecoration: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </Link>
  )
}
