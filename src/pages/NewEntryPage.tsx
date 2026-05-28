import { useState } from 'react'
import { NewEntry } from '@/components/talent/NewEntry'
import { SendApplicationModal } from '@/components/application/ApplicationModals'
import { useAuth } from '@/hooks/useAuth'
import { useAppData } from '@/context/AppDataContext'
import { useNavigate } from 'react-router-dom'

export function NewEntryPage() {
  const { user } = useAuth()
  const { handleNewTalent, handleSendApp } = useAppData()
  const navigate = useNavigate()
  const [pendingTalent, setPendingTalent] = useState<import('@/types').Talent | null>(null)

  if (!user) return null
  return (
    <>
      <NewEntry
        currentUser={user}
        onSave={(t: import('@/types').Talent) => {
          handleNewTalent(t)
          navigate('/pipeline')
        }}
        onCancel={() => navigate('/dashboard')}
        onSendApp={(t: import('@/types').Talent) => {
          setPendingTalent(t)
        }}
      />
      {pendingTalent && (
        <SendApplicationModal
          talent={pendingTalent}
          onClose={() => { setPendingTalent(null); navigate('/pipeline'); }}
          onSend={(app: any) => { if (handleSendApp) handleSendApp(app); setPendingTalent(null); navigate('/pipeline'); }}
        />
      )}
    </>
  )
}
