import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Target fields that can be mapped
export const TARGET_FIELDS = [
  { key: 'install_date', label: 'Install Date', required: true, patterns: ['install_date', 'install date', 'installation date', 'date installed', 'interconnection'] },
  { key: 'kw_capacity', label: 'kW Capacity', required: true, patterns: ['kw_capacity', 'kw capacity', 'capacity', 'system_kw', 'kw', 'kilowatt'] },
  { key: 'installer', label: 'Installer', required: true, patterns: ['installer', 'contractor', 'company', 'vendor'] },
  { key: 'battery_kwh', label: 'Battery kWh', required: false, patterns: ['battery', 'battery_kwh', 'battery kwh', 'storage'] },
  { key: 'cost', label: 'Cost', required: false, patterns: ['cost', 'price', 'total_cost', 'system_cost'] },
  { key: 'ae_rebate', label: 'AE Rebate', required: false, patterns: ['ae_rebate', 'ae rebate', 'rebate amount'] },
  { key: 'dollar_per_kw_rebate', label: '$/kW Rebate', required: false, patterns: ['$/kw', 'dollar_per_kw', 'dollar per kw', 'per kw'] },
  { key: 'percent_rebate', label: '% Rebate', required: false, patterns: ['%_rebate', '% rebate', 'percent_rebate', 'percent rebate'] },
  { key: 'fiscal_year', label: 'Fiscal Year', required: false, patterns: ['fiscal_year', 'fiscal year', 'fy', 'fiscalyear'] },
  { key: 'notes', label: 'Notes', required: false, patterns: ['notes', 'comments', 'question', 'look_into'] },
] as const;

export type TargetFieldKey = typeof TARGET_FIELDS[number]['key'];

interface PIRColumnMapperProps {
  csvHeaders: string[];
  csvPreview: string[][];
  columnMappings: Record<TargetFieldKey, string | null>;
  onMappingChange: (field: TargetFieldKey, value: string | null) => void;
  onBack: () => void;
  onConfirm: () => void;
  isImporting: boolean;
}

// Parse CSV line handling quoted fields
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Auto-detect column mappings based on header names
export function autoDetectMappings(headers: string[]): Record<TargetFieldKey, string | null> {
  const mappings: Record<string, string | null> = {};
  
  // Initialize all fields to null
  TARGET_FIELDS.forEach(field => {
    mappings[field.key] = null;
  });

  // Normalize headers for matching
  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s]+/g, ' ').trim());
  
  // For each target field, try to find a matching header
  TARGET_FIELDS.forEach(field => {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      
      // Check if any pattern matches
      const matches = field.patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase().replace(/[_\s]+/g, ' ');
        return header.includes(normalizedPattern) || normalizedPattern.includes(header);
      });
      
      if (matches && !Object.values(mappings).includes(headers[i])) {
        mappings[field.key] = headers[i];
        break;
      }
    }
  });

  return mappings as Record<TargetFieldKey, string | null>;
}

// Extract headers and preview rows from CSV
export function parseCSVPreview(csvData: string): { headers: string[]; preview: string[][]; headerRowIndex: number } {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 1) {
    return { headers: [], preview: [], headerRowIndex: 0 };
  }

  // Find the header row - look for "Install Date" in first 5 rows
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].toLowerCase().includes('install date') || 
        lines[i].toLowerCase().includes('install_date') ||
        lines[i].toLowerCase().includes('kw capacity')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerRowIndex]);
  
  // Get next 5 data rows for preview
  const preview: string[][] = [];
  for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 6, lines.length); i++) {
    if (lines[i].trim()) {
      preview.push(parseCSVLine(lines[i]));
    }
  }

  return { headers, preview, headerRowIndex };
}

export default function PIRColumnMapper({
  csvHeaders,
  csvPreview,
  columnMappings,
  onMappingChange,
  onBack,
  onConfirm,
  isImporting,
}: PIRColumnMapperProps) {
  // Calculate unmapped columns
  const mappedColumns = new Set(Object.values(columnMappings).filter(Boolean));
  const unmappedColumns = csvHeaders.filter(h => !mappedColumns.has(h));
  
  // Check validation
  const requiredFields = TARGET_FIELDS.filter(f => f.required);
  const missingRequired = requiredFields.filter(f => !columnMappings[f.key]);
  const isValid = missingRequired.length === 0;

  // Check for duplicate mappings
  const duplicates = useMemo(() => {
    const seen = new Map<string, string[]>();
    Object.entries(columnMappings).forEach(([field, col]) => {
      if (col) {
        const existing = seen.get(col) || [];
        existing.push(field);
        seen.set(col, existing);
      }
    });
    return Array.from(seen.entries()).filter(([_, fields]) => fields.length > 1);
  }, [columnMappings]);

  const hasDuplicates = duplicates.length > 0;

  // Get column index for highlighting
  const getColumnStatus = (header: string): 'mapped' | 'unmapped' => {
    return mappedColumns.has(header) ? 'mapped' : 'unmapped';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Map Columns</CardTitle>
        <CardDescription>
          Review the data preview and map CSV columns to database fields. Required fields are marked with *.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview Table */}
        <div>
          <h4 className="font-medium mb-2 text-sm">Data Preview (first {csvPreview.length} rows)</h4>
          <div className="border rounded-lg overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  {csvHeaders.map((header, idx) => (
                    <TableHead 
                      key={idx}
                      className={`whitespace-nowrap ${
                        getColumnStatus(header) === 'mapped' 
                          ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                          : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {getColumnStatus(header) === 'mapped' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {header}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvPreview.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <TableCell 
                        key={cellIdx} 
                        className="whitespace-nowrap max-w-[200px] truncate"
                        title={cell}
                      >
                        {cell || <span className="text-muted-foreground italic">empty</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Column Mapping Selectors */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Map to Database Fields</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TARGET_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-2">
                <label className="w-32 text-sm font-medium flex-shrink-0">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <Select
                  value={columnMappings[field.key] || "__skip__"}
                  onValueChange={(value) => onMappingChange(field.key, value === "__skip__" ? null : value)}
                >
                  <SelectTrigger className="flex-1 bg-background">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="__skip__">
                      <span className="text-muted-foreground">— Skip —</span>
                    </SelectItem>
                    {csvHeaders.map((header, idx) => (
                      <SelectItem key={idx} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {columnMappings[field.key] && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {field.required && !columnMappings[field.key] && (
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Validation Messages */}
        <div className="space-y-3">
          {/* Missing Required Fields */}
          {missingRequired.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Required fields missing:</span>{' '}
                {missingRequired.map(f => f.label).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Mappings */}
          {hasDuplicates && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Duplicate mappings detected:</span>{' '}
                {duplicates.map(([col, fields]) => 
                  `"${col}" is mapped to multiple fields`
                ).join('; ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Unmapped Columns Warning */}
          {unmappedColumns.length > 0 && isValid && !hasDuplicates && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{unmappedColumns.length} column(s) won't be imported:</span>{' '}
                <div className="flex flex-wrap gap-1 mt-1">
                  {unmappedColumns.map((col, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* All Good */}
          {isValid && !hasDuplicates && unmappedColumns.length === 0 && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                All columns are mapped and ready for import!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isImporting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={!isValid || hasDuplicates || isImporting}
          >
            {isImporting ? 'Importing...' : 'Confirm & Import'}
            {!isImporting && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
