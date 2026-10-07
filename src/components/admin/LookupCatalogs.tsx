import { useMemo, useState } from 'react'
import { useAgencyData } from '@/context/AgencyDataContext'
import { Btn, Field, inputStyle } from '@/components/agency/AgencyUI'
import { LOOKUP_SEEDS } from '@/lib/lookup-catalogs'
import { T } from '@/lib/tokens'

const STORAGE_KEY = 'nto_lookup_catalogs'
const SEEDS = LOOKUP_SEEDS

type Item = { name: string; active: boolean; sort: number }

function loadAll(): Record<string, Item[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, Item[]>
  } catch {
    /* ignore */
  }
  return Object.fromEntries(
    Object.entries(SEEDS).map(([category, names]) => [
      category,
      names.map((name, sort) => ({ name, active: true, sort })),
    ]),
  )
}

export function LookupCatalogs() {
  const { prospects, updateProspect } = useAgencyData()
  const [catalogs, setCatalogs] = useState(loadAll)
  const [category, setCategory] = useState(Object.keys(SEEDS)[0])
  const [name, setName] = useState('')
  const [shiftDays, setShiftDays] = useState('30')
  const items = catalogs[category] || []

  function persist(next: Record<string, Item[]>) {
    setCatalogs(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const sorted = useMemo(() => [...items].sort((a, b) => a.sort - b.sort), [items])

  return (
    <div>
      <Field label="Catalog">
        <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.keys(SEEDS).map((key) => (
            <option key={key}>{key}</option>
          ))}
        </select>
      </Field>
      {sorted.map((item) => (
        <div key={item.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
          <span style={{ flex: 1, color: item.active ? T.t1 : T.t3 }}>{item.name}</span>
          <Btn
            variant="secondary"
            onClick={() => {
              const nextItems = items.map((row) => (row.name === item.name ? { ...row, active: !row.active } : row))
              persist({ ...catalogs, [category]: nextItems })
            }}
          >
            {item.active ? 'Active' : 'Inactive'}
          </Btn>
          <Btn
            variant="danger"
            onClick={() => persist({ ...catalogs, [category]: items.filter((row) => row.name !== item.name) })}
          >
            Remove
          </Btn>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="New value" />
        <Btn
          onClick={() => {
            const trimmed = name.trim()
            if (!trimmed) return
            persist({
              ...catalogs,
              [category]: [...items, { name: trimmed, active: true, sort: items.length }],
            })
            setName('')
          }}
        >
          Add
        </Btn>
      </div>
      <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px solid ${T.cardBorder}` }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Contract Term Adjustment</div>
        <Field label="Shift every contract end date by days">
          <input style={inputStyle} value={shiftDays} onChange={(e) => setShiftDays(e.target.value)} />
        </Field>
        <Btn
          onClick={() => {
            const days = Number(shiftDays) || 0
            for (const prospect of prospects) {
              if (!prospect.contractEnd) continue
              const end = new Date(`${prospect.contractEnd}T12:00:00`)
              end.setDate(end.getDate() + days)
              updateProspect(prospect.id, { contractEnd: end.toISOString().slice(0, 10) })
            }
          }}
        >
          Shift end dates
        </Btn>
        <div style={{ fontWeight: 700, margin: '16px 0 8px' }}>Open-Ended Contract</div>
        <Btn
          variant="secondary"
          onClick={() => {
            for (const prospect of prospects) {
              if (prospect.representationType === 'nonexclusive') {
                updateProspect(prospect.id, { contractEnd: null })
              }
            }
          }}
        >
          Mark non-exclusive contracts open-ended
        </Btn>
      </div>
    </div>
  )
}
