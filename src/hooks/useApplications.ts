import { useAppData } from '@/context/AppDataContext'

export function useApplications() {
  const { applications, saveApp, handleSendApp, importAppToPipeline, setReviewingApp, reviewingApp } =
    useAppData()
  return { applications, saveApp, handleSendApp, importAppToPipeline, setReviewingApp, reviewingApp }
}
