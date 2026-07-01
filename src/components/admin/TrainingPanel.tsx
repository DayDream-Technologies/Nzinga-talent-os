import type { Role } from '@/types'
import { ROLE_LABELS } from '@/constants/roles'
import { T } from '@/lib/tokens'

const TRAINING_BY_ROLE: Record<
  Role,
  { title: string; items: { label: string; description: string; url?: string }[] }
> = {
  scout: {
    title: 'Scout Training',
    items: [
      {
        label: 'Jordan Score Guide',
        description: 'How to score all 5 pillars and write rationales for each prospect.',
      },
      {
        label: 'Prospect Outreach Templates',
        description: 'Email and SMS templates for initial contact and application invites.',
      },
      {
        label: 'Application Review Checklist',
        description: 'Steps for reviewing submitted applications before pipeline import.',
      },
    ],
  },
  team1_lead: {
    title: 'Team 1 Lead Training',
    items: [
      {
        label: 'Review Criteria',
        description: 'Gate decisions at Team 1 Review — approve, hold, or return to scout.',
      },
      {
        label: 'Escalation Procedures',
        description: 'When and how to escalate borderline prospects to the director.',
      },
    ],
  },
  ops_specialist: {
    title: 'Ops Specialist Training',
    items: [
      {
        label: 'Compliance Checklist',
        description: 'Verify all required documents and compliance fields before ops processing.',
      },
      {
        label: 'Document Verification Guide',
        description: 'How to validate gov ID, tax docs, banking, and proof of income.',
      },
    ],
  },
  team2_lead: {
    title: 'Team 2 Lead Training',
    items: [
      {
        label: 'Audit Standards',
        description: 'Team 2 audit criteria and sign-off requirements.',
      },
      {
        label: 'Quality Review Process',
        description: 'Final quality checks before executive review.',
      },
    ],
  },
  director: {
    title: 'Director Training',
    items: [
      {
        label: 'Platform Overview',
        description: 'End-to-end pipeline flow, roles, and RBAC across all stages.',
      },
      {
        label: 'Admin Guide',
        description: 'User management, role assignment, audit log, and system settings.',
      },
      {
        label: 'Executive Decision Framework',
        description: 'Criteria for signing, archiving, or marking prospects not viable.',
      },
    ],
  },
  success_manager: {
    title: 'Success Manager Training',
    items: [
      {
        label: 'Onboarding Checklist',
        description: 'Portal setup, technical routing, and warm handoff confirmation.',
      },
      {
        label: 'Client Handoff Process',
        description: 'Transition signed talent from executive review to active client status.',
      },
    ],
  },
}

interface TrainingPanelProps {
  role: Role
}

export function TrainingPanel({ role }: TrainingPanelProps) {
  const content = TRAINING_BY_ROLE[role]

  return (
    <div style={{ padding: '22px 26px', flex: 1, overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, fontFamily: 'Georgia, serif' }}>
          My Training
        </div>
        <div style={{ fontSize: 13, color: T.t3, marginTop: 3 }}>
          Resources for {ROLE_LABELS[role]}s
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '18px 22px',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.t1, marginBottom: 14 }}>
          {content.title}
        </div>
        {content.items.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.blue, marginBottom: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>{item.description}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 11,
          color: T.t4,
        }}
      >
        Contact your director for live training sessions or updated SOP documents.
      </div>
    </div>
  )
}
