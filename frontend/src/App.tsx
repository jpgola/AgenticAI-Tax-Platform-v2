
import React, { useEffect, useMemo, useState } from 'react'
import { uploadDoc, fetchPreview } from './services/api'

type Summary = {
  totalIncome: number
  deductions: number
  estimatedTax: number
  estimatedRefund: number
  filingStatus: string
  complianceScore: number
}

export default function App() {
  const [year] = useState(2024)
  const [lastUpload, setLastUpload] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const summary: Summary | null = preview?.summary ?? null

  const onUpload = async (f: File) => {
    setErr(null)
    setLoading(true)
    try {
      const res = await uploadDoc(f)
      setLastUpload(res)
      const p = await fetchPreview(year)
      setPreview(p)
    } catch (e: any) {
      setErr(e?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <h1>AgenticAI Tax (Intuit-like Demo)</h1>
      <p style={{ color: '#555' }}>
        Upload a W-2-like file and step through a simple “TurboTax-style” preview loop.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>1) Upload Documents</h3>
          <input type="file" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          {loading && <p>Working...</p>}
          {err && <p style={{ color: 'crimson' }}>{err}</p>}
          {lastUpload && (
            <pre style={{ marginTop: 12, background: '#111', color: '#eee', padding: 12, borderRadius: 8, overflow: 'auto' }}>
{JSON.stringify(lastUpload, null, 2)}
            </pre>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
          <h3>2) Return Preview</h3>
          {!preview && <p>No preview yet. Upload a doc.</p>}
          {summary && (
            <ul>
              <li><b>Total income:</b> ${summary.totalIncome.toLocaleString()}</li>
              <li><b>Deductions:</b> ${summary.deductions.toLocaleString()}</li>
              <li><b>Estimated tax:</b> ${summary.estimatedTax.toLocaleString()}</li>
              <li><b>Estimated refund:</b> ${summary.estimatedRefund.toLocaleString()}</li>
              <li><b>Status:</b> {summary.filingStatus}</li>
              <li><b>Compliance score:</b> {summary.complianceScore}/100</li>
            </ul>
          )}
          {preview && (
            <pre style={{ marginTop: 12, background: '#f7f7f7', padding: 12, borderRadius: 8, overflow: 'auto' }}>
{JSON.stringify(preview, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: '#666' }}>
        Preview only. Not tax advice.
      </div>
    </div>
  )
}
