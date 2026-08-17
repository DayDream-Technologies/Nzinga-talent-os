import { Navigate } from 'react-router-dom'

/** Director nav target — opens Team Users with the invite modal. */
export function AdminInvitePage() {
  return <Navigate to="/admin/users?invite=1" replace />
}
