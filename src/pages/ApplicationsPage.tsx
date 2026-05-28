import { ApplicationsPanel } from '@/components/dashboard/Dashboard'
import { useAppData } from '@/context/AppDataContext'

export function ApplicationsPage() {
  const { applications, talents, setReviewingApp, importAppToPipeline } = useAppData()
  return (
    <ApplicationsPanel
      applications={applications}
      talents={talents}
      onViewApp={setReviewingApp}
      onImportApp={importAppToPipeline}
    />
  )
}
