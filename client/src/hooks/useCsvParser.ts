import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface CsvParseResult<T = Record<string, string>> {
  data: T[]
  headers: string[]
  errors: string[]
  preview: T[]
}

interface CsvParseOptions {
  delimiter?: string
  skipEmptyLines?: boolean
  maxPreviewRows?: number
  headerRow?: boolean
}

export function useCsvParser<T = Record<string, string>>(
  options: CsvParseOptions = {}
) {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    maxPreviewRows = 5,
    headerRow = true,
  } = options
  
  const [parseResult, setParseResult] = useState<CsvParseResult<T> | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const detectDelimiter = useCallback((text: string): string => {
    const firstLine = text.split('\n')[0] || ''
    const delimiters = [',', '\t', ';', '|']
    
    let bestDelimiter = ','
    let maxColumns = 0
    
    for (const del of delimiters) {
      const columns = firstLine.split(del).length
      if (columns > maxColumns) {
        maxColumns = columns
        bestDelimiter = del
      }
    }
    
    return bestDelimiter
  }, [])

  const parseCsvText = useCallback((text: string, customOptions?: Partial<CsvParseOptions>) => {
    const opts = { ...options, ...customOptions }
    const actualDelimiter = opts.delimiter || detectDelimiter(text)
    
    setIsProcessing(true)
    
    try {
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => opts.skipEmptyLines ? line.length > 0 : true)

      if (lines.length === 0) {
        throw new Error('No data found in input')
      }

      let headers: string[] = []
      let dataLines: string[] = []

      if (opts.headerRow && lines.length > 0) {
        headers = parseRow(lines[0], actualDelimiter)
        dataLines = lines.slice(1)
      } else {
        // Generate default headers
        const firstRow = parseRow(lines[0], actualDelimiter)
        headers = firstRow.map((_, index) => `Column ${index + 1}`)
        dataLines = lines
      }

      const data: T[] = []
      const errors: string[] = []

      dataLines.forEach((line, index) => {
        try {
          const row = parseRow(line, actualDelimiter)
          
          // Pad or truncate row to match headers length
          while (row.length < headers.length) {
            row.push('')
          }
          row.splice(headers.length)

          const obj = headers.reduce((acc, header, i) => {
            acc[header] = row[i] || ''
            return acc
          }, {} as any)

          data.push(obj)
        } catch (error) {
          errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`)
        }
      })

      const result: CsvParseResult<T> = {
        data,
        headers,
        errors,
        preview: data.slice(0, opts.maxPreviewRows),
      }

      setParseResult(result)
      
      if (errors.length > 0) {
        toast({
          title: "Parsing completed with warnings",
          description: `${errors.length} rows had issues. Check the preview for details.`,
          variant: "warn",
        })
      } else {
        toast({
          title: "CSV parsed successfully",
          description: `${data.length} rows parsed from CSV data`,
          variant: "success",
        })
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
      
      toast({
        title: "CSV parsing failed",
        description: errorMessage,
        variant: "error",
      })
      
      setParseResult(null)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [options, detectDelimiter, toast])

  const parseRow = (line: string, del: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === del && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    
    // Add the last field
    result.push(current.trim())
    
    return result
  }

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData('text/plain')
    if (!pastedText) return

    // Check if it looks like CSV/TSV data
    const lines = pastedText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return

    const firstLine = lines[0]
    const hasDelimiters = /[,\t;|]/.test(firstLine)
    
    if (hasDelimiters) {
      event.preventDefault()
      parseCsvText(pastedText)
    }
  }, [parseCsvText])

  const clearResult = useCallback(() => {
    setParseResult(null)
  }, [])

  return {
    parseResult,
    isProcessing,
    parseCsvText,
    handlePaste,
    clearResult,
    canParse: parseResult !== null,
  }
}