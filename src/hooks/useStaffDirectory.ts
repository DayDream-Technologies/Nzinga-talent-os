import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { supabaseConfigured } from '@/lib/supabase'
import { fetchAllUsers } from '@/services/invite.service'
import type { User } from '@/types'

let cachedCode = ''
let cachedStaff: User[] = []
let inflight: Promise<User[]> | null = null

export function staffTicketAgents(staff: User[]): { id: string; name: string; title: string }[] {
  return staff.map((user) => ({
    id: user.id,
    name: user.name,
    title: user.title || user.role,
  }))
}

/** Company staff from `users`. Empty outside auth or before the directory loads. */
export function useStaffDirectory(): User[] {
  const auth = useContext(AuthContext)
  const code = (auth?.user?.company_code || auth?.companyCode || '').trim().toUpperCase()
  const [staff, setStaff] = useState<User[]>(() => (code && code === cachedCode ? cachedStaff : []))

  useEffect(() => {
    if (!supabaseConfigured || !code) {
      setStaff([])
      return
    }
    if (cachedCode === code && cachedStaff.length > 0) {
      setStaff(cachedStaff)
      return
    }
    let cancel = false
    if (!inflight || cachedCode !== code) {
      cachedCode = code
      inflight = fetchAllUsers(code).finally(() => {
        inflight = null
      })
    }
    const request = inflight
    void request.then((rows) => {
      if (cancel || cachedCode !== code) return
      cachedStaff = rows
      setStaff(rows)
    })
    return () => {
      cancel = true
    }
  }, [code])

  return staff
}
