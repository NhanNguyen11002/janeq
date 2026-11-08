import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

function getExportFilename(submittedAt) {
  const date = new Date(submittedAt)
  const timestamp = Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString()
  return `attempt-${timestamp.replace(/[:.]/g, '-')}.json`
}

function AttemptExportButton({ attemptId, submittedAt }) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  async function downloadExport() {
    if (isExporting) return

    setIsExporting(true)
    setError('')
    try {
      const file = await apiRequest(`/attempts/${attemptId}/export`, {
        authRequired: true,
        responseType: 'blob',
      })
      const downloadUrl = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = getExportFilename(submittedAt)
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
    } catch (downloadError) {
      setError(downloadError.message || 'Could not download the attempt export. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert className="items-start" variant="destructive">
          <AlertTitle>Export download failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        aria-busy={isExporting}
        disabled={isExporting}
        onClick={downloadExport}
        variant="outline"
      >
        {isExporting ? (
          <RefreshCw aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
        ) : (
          <Download aria-hidden="true" />
        )}
        {isExporting ? 'Preparing export…' : 'Download answers'}
      </Button>
    </div>
  )
}

export default AttemptExportButton
