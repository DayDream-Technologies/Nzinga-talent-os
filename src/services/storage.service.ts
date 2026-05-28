import { DOCUMENTS_BUCKET, supabase, supabaseConfigured } from '@/lib/supabase'
import type { UploadedDoc } from '@/types'

export async function uploadDocument(
  talentId: string,
  docId: string,
  file: File,
): Promise<UploadedDoc> {
  if (!supabaseConfigured || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        resolve({
          name: file.name,
          data: ev.target?.result as string,
          type: file.type,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const path = `${talentId}/${docId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path)
  return {
    name: file.name,
    data: urlData.publicUrl,
    type: file.type,
    storagePath: path,
  }
}

export async function getDocumentUrl(doc: UploadedDoc): Promise<string> {
  if (!doc.storagePath || !supabaseConfigured || !supabase) {
    return doc.data
  }
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}
