import { NewEntry } from '@/components/talent/NewEntry'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { useNavigate } from 'react-router-dom'

export function NewEntryPage() {
  const { user } = useAuth()
  const { handleNewTalent } = useAppData()
  const navigate = useNavigate()
  if (!user) return null
  return (
    <NewEntry
      currentUser={user}
      onSave={(t: import('@/types').Talent) => {
        handleNewTalent(t)
        navigate('/pipeline')
      }}
      onCancel={() => navigate('/dashboard')}
      onSendApp={() => navigate('/dashboard')}
    />
  )
}
