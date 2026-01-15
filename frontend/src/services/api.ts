
export async function uploadDoc(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function fetchPreview(year: number) {
  const res = await fetch(`/api/returns/${year}/preview`)
  if (!res.ok) throw new Error(`Preview failed: ${res.status}`)
  return res.json()
}
