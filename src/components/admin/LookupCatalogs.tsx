import { useMemo, useState } from 'react'
import { useAgencyData } from '@/context/AgencyDataContext'
import { Btn, Field, inputStyle } from '@/components/agency/AgencyUI'
import { LEAD_SOURCE_CATEGORY, LOOKUP_SEEDS } from '@/lib/lookup-catalogs'
import { T } from '@/lib/tokens'

const STORAGE_KEY = 'nto_lookup_catalogs'
const SEEDS = LOOKUP_SEEDS

type Item = { name: string; active: boolean; sort: number }

function seedItems(names: string[]): Item[] {
  return names.map((name, sort) => ({ name, active: true, sort }))
}

function loadAll(): Record<string, Item[]> {
  let stored: Record<string, Item[]> = {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw) as Record<string, Item[]>
  } catch {
    stored = {}
  }
  const next: Record<string, Item[]> = {}
  for (const [category, names] of Object.entries(SEEDS)) {
    next[category] = stored[category]?.length ? stored[category] : seedItems(names)
  }
  for (const [category, items] of Object.entries(stored)) {
    if (!next[category]) next[category] = items
  }
  return next
}

export function LookupCatalogs() {
  const { prospects, updateProspect } = useAgencyData()
  const [catalogs, setCatalogs] = useState(loadAll)
  const [category, setCategory] = useState(LEAD_SOURCE_CATEGORY)
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
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
        <select
          style={inputStyle}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setFormError('')
          }}
        >
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
      {category === LEAD_SOURCE_CATEGORY && (
        <p style={{ fontSize: 12, color: T.t3, marginTop: 0 }}>
          Lead sources appear when staff create a prospect or record a discovery source.
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setFormError('')
          }}
          placeholder={category === LEAD_SOURCE_CATEGORY ? 'New lead source' : 'New value'}
          aria-label={category === LEAD_SOURCE_CATEGORY ? 'New lead source' : 'New catalog value'}
        />
        <Btn
          onClick={() => {
            const trimmed = name.trim()
            if (!trimmed) return
            if (items.some((row) => row.name.toLowerCase() === trimmed.toLowerCase())) {
              setFormError('That value already exists.')
              return
            }
            persist({
              ...catalogs,
              [category]: [...items, { name: trimmed, active: true, sort: items.length }],
            })
            setName('')
            setFormError('')
          }}
        >
          Add
        </Btn>
      </div>
      {formError && <div style={{ color: T.red, fontSize: 12, marginTop: 6 }}>{formError}</div>}
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
