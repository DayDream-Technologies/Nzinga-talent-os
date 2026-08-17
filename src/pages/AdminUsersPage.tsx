import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AllUsersPanel } from '@/components/admin/AllUsersPanel'
import { InviteUserModal } from '@/components/admin/InviteUserModal'
import { useAuth } from '@/hooks/useAuth'

export function AdminUsersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      setInviteOpen(true)
    }
  }, [searchParams])

  if (!user || user.role !== 'director') {
    return <Navigate to="/workspace" replace />
  }

  function closeInvite() {
    setInviteOpen(false)
    if (searchParams.has('invite')) {
      const next = new URLSearchParams(searchParams)
      next.delete('invite')
      setSearchParams(next, { replace: true })
    }
  }

  return (
    <>
      <AllUsersPanel
        onManageRoles={() => navigate('/admin/roles')}
        onInvite={() => setInviteOpen(true)}
      />
      {inviteOpen && <InviteUserModal onClose={closeInvite} onSuccess={closeInvite} />}
    </>
  )
}
