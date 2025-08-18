import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useCsvParser } from "@/hooks/useCsvParser"
import { CsvPreviewTable } from "./csv-preview-table"
import { Upload, Copy, FileText } from "lucide-react"

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[]) => void
  title?: string
  description?: string
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onImport,
  title = "Import CSV Data",
  description = "Paste your CSV data or upload a file to import"
}: CsvImportDialogProps) {
  const [csvText, setCsvText] = useState("")
  const [delimiter, setDelimiter] = useState("auto")
  const [hasHeaders, setHasHeaders] = useState(true)
  const { parseResult, isProcessing, parseCsvText, clearResult } = useCsvParser({
    headerRow: hasHeaders,
    delimiter: delimiter === "auto" ? undefined : delimiter,
  })

  const handleParse = () => {
    if (!csvText.trim()) return
    parseCsvText(csvText, { 
      headerRow: hasHeaders,
      delimiter: delimiter === "auto" ? undefined : delimiter,
    })
  }

  const handleImport = () => {
    if (parseResult?.data) {
      onImport(parseResult.data)
      handleClose()
    }
  }

  const handleClose = () => {
    setCsvText("")
    clearResult()
    onOpenChange(false)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCsvText(text)
    } catch (error) {
      console.warn("Failed to read clipboard:", error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvText(text)
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Options */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimiter</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value="\t">Tab (\t)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="has-headers">First Row Headers</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="has-headers"
                  checked={hasHeaders}
                  onCheckedChange={setHasHeaders}
                />
                <Label htmlFor="has-headers">
                  {hasHeaders ? "Yes" : "No"}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaste}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Paste
                </Button>
                <label className="relative">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-text">CSV Data</Label>
            <Textarea
              id="csv-text"
              placeholder="Paste your CSV data here..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />
          </div>

          {/* Parse Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleParse}
              disabled={!csvText.trim() || isProcessing}
              className="min-w-32"
            >
              {isProcessing ? "Parsing..." : "Parse CSV"}
            </Button>
          </div>

          {/* Preview */}
          {parseResult && (
            <CsvPreviewTable
              data={parseResult.preview}
              headers={parseResult.headers}
              errors={parseResult.errors}
              title="Import Preview"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult?.data || parseResult.errors.length > 0}
          >
            Import {parseResult?.data?.length || 0} Row{parseResult?.data?.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}