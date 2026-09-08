import { TrainingPanel } from '@/components/admin/TrainingPanel'
import { useAuth } from '@/hooks/useAuth'
import { T } from '@/lib/tokens'

export function UniversityPage() {
  const { user } = useAuth()
  if (!user) return null
  const path =
    user.role === 'scout'
      ? 'Scouting Path'
      : user.role === 'account_manager'
        ? 'Account Management Path'
        : user.role === 'success_manager'
          ? 'Success Path'
          : 'Executive Path'
  return (
    <div>
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: T.t1 }}>TMX University</div>
        <div style={{ fontSize: 13, color: T.t3, marginBottom: 8 }}>
          Master agency operations, compliance, and platform workflows · {path}
        </div>
      </div>
      <TrainingPanel />
    </div>
  )
}
