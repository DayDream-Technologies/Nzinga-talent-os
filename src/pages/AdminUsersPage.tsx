import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AllUsersPanel } from '@/components/admin/AllUsersPanel'
import { InviteUserModal } from '@/components/admin/InviteUserModal'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <>
      <AllUsersPanel
        onManageRoles={() => navigate('/admin/roles')}
        onInvite={() => setInviteOpen(true)}
      />
      {inviteOpen && (
        <InviteUserModal onClose={() => setInviteOpen(false)} onSuccess={() => setInviteOpen(false)} />
      )}
    </>
  )
}
