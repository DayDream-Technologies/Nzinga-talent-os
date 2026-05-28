import { APP_SECTIONS } from '@/constants/app-sections'

interface IncompleteSectionAlertProps {
  missingMap: Record<string, string[]>
  onJump?: (secId: string) => void
  dark?: boolean
}

export function IncompleteSectionAlert({ missingMap, onJump, dark }: IncompleteSectionAlertProps) {
  const incomplete = Object.entries(missingMap).filter(([, fields]) => fields.length > 0)
  if (!incomplete.length) return null

  const bg = dark ? 'bg-red-950/20' : 'bg-red-100'
  const border = dark ? 'border-red-800/40' : 'border-red-300'
  const textColor = dark ? 'text-red-300' : 'text-brand-red'

  return (
    <div className={`mb-3 rounded-lg border p-3 ${bg} ${border}`}>
      <div className={`mb-1.5 text-xs font-bold ${textColor}`}>
        ⚠ Incomplete sections — required fields missing
      </div>
      <div className="flex flex-wrap gap-1.5">
        {incomplete.map(([secId, fields]) => {
          const sec = APP_SECTIONS.find((s) => s.id === secId)
          return (
            <button
              key={secId}
              type="button"
              onClick={() => onJump?.(secId)}
              className={`cursor-pointer rounded-md border px-2.5 py-0.5 text-[11px] font-semibold underline ${textColor} bg-transparent font-sans`}
              style={{ borderColor: 'currentColor' }}
            >
              {sec?.icon} {sec?.label} ({fields.length} missing)
            </button>
          )
        })}
      </div>
    </div>
  )
}
