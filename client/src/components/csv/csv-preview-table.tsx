import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface CsvPreviewTableProps<T = Record<string, string>> {
  data: T[]
  headers: string[]
  errors: string[]
  maxRows?: number
  title?: string
}

export function CsvPreviewTable<T = Record<string, string>>({ 
  data, 
  headers, 
  errors, 
  maxRows = 10,
  title = "CSV Preview"
}: CsvPreviewTableProps<T>) {
  const previewData = data.slice(0, maxRows)
  const hasMoreRows = data.length > maxRows
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {errors.length > 0 ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </Badge>
          )}
          <Badge variant="outline">
            {data.length} row{data.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
          <h4 className="text-sm font-medium text-destructive mb-2">Parse Errors:</h4>
          <ul className="text-sm text-destructive space-y-1">
            {errors.slice(0, 5).map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-destructive/70">•</span>
                <span>{error}</span>
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-destructive/70 italic">
                ... and {errors.length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="rounded-md border overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              {headers.map((header, index) => (
                <TableHead key={index} className="min-w-24">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="text-center py-8 text-muted-foreground">
                  No data to preview
                </TableCell>
              </TableRow>
            ) : (
              previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {rowIndex + 1}
                  </TableCell>
                  {headers.map((header, colIndex) => (
                    <TableCell key={colIndex} className="max-w-32 truncate">
                      {(row as any)[header] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasMoreRows && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first {maxRows} of {data.length} rows
        </p>
      )}
    </div>
  )
}