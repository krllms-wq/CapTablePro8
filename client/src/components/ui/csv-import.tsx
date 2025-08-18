/**
 * CSV import component with preview and error handling
 */

import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './table';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { Separator } from './separator';
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CsvRow {
  [key: string]: string;
}

export interface CsvImportError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CsvImportResult {
  data: CsvRow[];
  errors: CsvImportError[];
  headers: string[];
  totalRows: number;
  validRows: number;
}

export interface CsvImportProps {
  onImport: (result: CsvImportResult) => void;
  expectedHeaders?: string[];
  maxFileSize?: number; // in bytes
  maxRows?: number;
  validateRow?: (row: CsvRow, index: number) => CsvImportError[];
  className?: string;
}

export function CsvImport({
  onImport,
  expectedHeaders = [],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  maxRows = 10000,
  validateRow,
  className,
}: CsvImportProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CsvImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [delimiter, setDelimiter] = useState<string>(',');

  // Auto-detect CSV delimiter
  const detectDelimiter = (content: string): string => {
    const delimiters = [',', ';', '\t', '|'];
    const firstLine = content.split('\n')[0];
    
    let maxCount = 0;
    let bestDelimiter = ',';
    
    for (const delim of delimiters) {
      const count = (firstLine.match(new RegExp(delim, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delim;
      }
    }
    
    return bestDelimiter;
  };

  // Parse CSV content
  const parseCSV = useCallback((content: string, delimiter: string): CsvImportResult => {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return {
        data: [],
        errors: [{ row: 0, column: '', message: 'File is empty', severity: 'error' }],
        headers: [],
        totalRows: 0,
        validRows: 0,
      };
    }

    // Parse CSV with basic quote handling
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const data: CsvRow[] = [];
    const errors: CsvImportError[] = [];
    let validRows = 0;

    // Validate headers
    if (expectedHeaders.length > 0) {
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        errors.push({
          row: 0,
          column: 'headers',
          message: `Missing required headers: ${missingHeaders.join(', ')}`,
          severity: 'error',
        });
      }
    }

    // Parse data rows
    for (let i = 1; i < lines.length && i <= maxRows; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push({
          row: i,
          column: '',
          message: `Row has ${values.length} columns, expected ${headers.length}`,
          severity: 'warning',
        });
      }

      const row: CsvRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Custom validation
      if (validateRow) {
        const rowErrors = validateRow(row, i);
        errors.push(...rowErrors);
      }

      data.push(row);
      
      // Count as valid if no errors for this row
      const hasRowErrors = errors.some(e => e.row === i && e.severity === 'error');
      if (!hasRowErrors) {
        validRows++;
      }
    }

    return {
      data,
      errors,
      headers,
      totalRows: lines.length - 1,
      validRows,
    };
  }, [expectedHeaders, maxRows, validateRow]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > maxFileSize) {
      setParseResult({
        data: [],
        errors: [{
          row: 0,
          column: '',
          message: `File size exceeds limit of ${Math.round(maxFileSize / 1024 / 1024)}MB`,
          severity: 'error',
        }],
        headers: [],
        totalRows: 0,
        validRows: 0,
      });
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);
    
    try {
      const content = await selectedFile.text();
      const detectedDelimiter = detectDelimiter(content);
      setDelimiter(detectedDelimiter);
      
      const result = parseCSV(content, detectedDelimiter);
      setParseResult(result);
    } catch (error) {
      setParseResult({
        data: [],
        errors: [{
          row: 0,
          column: '',
          message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        }],
        headers: [],
        totalRows: 0,
        validRows: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [maxFileSize, parseCSV]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileSelect(csvFile);
    }
  }, [handleFileSelect]);

  // File input handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Reparse with different delimiter
  const handleDelimiterChange = useCallback(async (newDelimiter: string) => {
    if (!file) return;
    
    setDelimiter(newDelimiter);
    setIsLoading(true);
    
    try {
      const content = await file.text();
      const result = parseCSV(content, newDelimiter);
      setParseResult(result);
    } catch (error) {
      console.error('Failed to reparse with new delimiter:', error);
    } finally {
      setIsLoading(false);
    }
  }, [file, parseCSV]);

  // Submit import
  const handleImport = useCallback(() => {
    if (parseResult) {
      onImport(parseResult);
    }
  }, [parseResult, onImport]);

  const hasErrors = parseResult?.errors.some(e => e.severity === 'error');
  const hasWarnings = parseResult?.errors.some(e => e.severity === 'warning');

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Select a CSV file to import data. Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto max-w-md">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Label htmlFor="csv-file" className="cursor-pointer">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />
                  <Button variant="outline" className="mt-2">
                    Choose File
                  </Button>
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parsing Options */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Parsing Options</CardTitle>
            <CardDescription>
              Adjust how the CSV file is parsed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delimiter">Delimiter</Label>
                <select
                  id="delimiter"
                  value={delimiter}
                  onChange={(e) => handleDelimiterChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  File: {file.name} ({Math.round(file.size / 1024)}KB)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parse Results */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Import Preview</span>
              <div className="flex items-center gap-2">
                <Badge variant={hasErrors ? "destructive" : "secondary"}>
                  {parseResult.validRows} / {parseResult.totalRows} valid rows
                </Badge>
                {hasWarnings && (
                  <Badge variant="secondary">
                    {parseResult.errors.filter(e => e.severity === 'warning').length} warnings
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errors and Warnings */}
            {parseResult.errors.length > 0 && (
              <div className="space-y-2">
                {parseResult.errors.slice(0, 10).map((error, index) => (
                  <Alert key={index} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                    <div className="flex items-center gap-2">
                      {error.severity === 'error' ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {error.row > 0 ? `Row ${error.row}: ` : ''}
                        {error.message}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
                {parseResult.errors.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {parseResult.errors.length - 10} more issues
                  </p>
                )}
              </div>
            )}

            {/* Data Preview */}
            {parseResult.data.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Data Preview (first 5 rows)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parseResult.headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.data.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          {parseResult.headers.map((header, cellIndex) => (
                            <TableCell key={cellIndex} className="max-w-32 truncate">
                              {row[header]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Separator />

            {/* Import Button */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParseResult(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={hasErrors || parseResult.validRows === 0 || isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Import {parseResult.validRows} Rows
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}