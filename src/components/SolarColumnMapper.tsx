import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, XCircle, ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { parseCSVLine } from "@/components/PIRColumnMapper";

export const SOLAR_TARGET_FIELDS = [
  { key: 'project_id', label: 'Project ID', required: true, patterns: ['project id', 'project_id', 'projectid'] },
  { key: 'permit_number', label: 'Permit Number', required: false, patterns: ['permit num', 'permit_number', 'permit number'] },
  { key: 'address', label: 'Address', required: true, patterns: ['address', 'original address', 'address 1', 'street'] },
  { key: 'description', label: 'Description', required: false, patterns: ['description', 'desc', 'project name'] },
  { key: 'permit_class', label: 'Permit Class', required: false, patterns: ['permit class mapped', 'permit class', 'permit_class'] },
  { key: 'installed_kw', label: 'Installed kW', required: false, patterns: ['installed kw', 'installed_kw', 'kw', 'capacity'] },
  { key: 'total_job_valuation', label: 'Total Job Valuation', required: false, patterns: ['total job valuation', 'total_job_valuation', 'total valuation', 'job valuation'] },
  { key: 'electrical_valuation', label: 'Electrical Valuation', required: false, patterns: ['electrical valuation', 'electrical_valuation', 'elec valuation'] },
  { key: 'applied_date', label: 'Applied Date', required: false, patterns: ['applied date', 'applied_date', 'date applied'] },
  { key: 'issued_date', label: 'Issued Date', required: false, patterns: ['issued date', 'issued_date', 'date issued'] },
  { key: 'calendar_year_issued', label: 'Calendar Year Issued', required: false, patterns: ['calendar year issued', 'calendar_year_issued', 'year issued'] },
  { key: 'status_current', label: 'Status Current', required: false, patterns: ['status current', 'status_current', 'status'] },
  { key: 'completed_date', label: 'Completed Date', required: false, patterns: ['completed date', 'completed_date', 'date completed'] },
  { key: 'original_zip', label: 'ZIP Code', required: false, patterns: ['original zip', 'original_zip', 'zip', 'zipcode', 'zip code'] },
  { key: 'council_district', label: 'Council District', required: false, patterns: ['council district', 'council_district', 'district'] },
  { key: 'jurisdiction', label: 'Jurisdiction', required: false, patterns: ['jurisdiction'] },
  { key: 'latitude', label: 'Latitude', required: false, patterns: ['latitude', 'lat'] },
  { key: 'longitude', label: 'Longitude', required: false, patterns: ['longitude', 'lng', 'lon', 'long'] },
  { key: 'contractor_company', label: 'Contractor Company', required: false, patterns: ['contractor company', 'contractor_company', 'contractor company name'] },
  { key: 'contractor_city', label: 'Contractor City', required: false, patterns: ['contractor city', 'contractor_city'] },
  { key: 'link', label: 'Link', required: false, patterns: ['link', 'url', 'permit link'] },
] as const;

export type SolarTargetFieldKey = typeof SOLAR_TARGET_FIELDS[number]['key'];

interface SolarColumnMapperProps {
  csvHeaders: string[];
  csvPreview: string[][];
  columnMappings: Record<SolarTargetFieldKey, string | null>;
  onMappingChange: (field: SolarTargetFieldKey, value: string | null) => void;
  onBack: () => void;
  onConfirm: () => void;
  isImporting: boolean;
}

export function autoDetectSolarMappings(headers: string[]): Record<SolarTargetFieldKey, string | null> {
  const mappings: Record<string, string | null> = {};

  SOLAR_TARGET_FIELDS.forEach(field => {
    mappings[field.key] = null;
  });

  const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s]+/g, ' ').trim());

  SOLAR_TARGET_FIELDS.forEach(field => {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      const matches = field.patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase().replace(/[_\s]+/g, ' ');
        return header === normalizedPattern || header.includes(normalizedPattern);
      });

      if (matches && !Object.values(mappings).includes(headers[i])) {
        mappings[field.key] = headers[i];
        break;
      }
    }
  });

  return mappings as Record<SolarTargetFieldKey, string | null>;
}

export function parseSolarCSVPreview(csvData: string): { headers: string[]; preview: string[][]; headerRowIndex: number } {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 1) {
    return { headers: [], preview: [], headerRowIndex: 0 };
  }

  // Find header row - look for common solar permit headers in first 5 rows
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('permit') || lower.includes('address') || lower.includes('project id')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = parseCSVLine(lines[headerRowIndex]);

  const preview: string[][] = [];
  for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 6, lines.length); i++) {
    if (lines[i].trim()) {
      preview.push(parseCSVLine(lines[i]));
    }
  }

  return { headers, preview, headerRowIndex };
}

export default function SolarColumnMapper({
  csvHeaders,
  csvPreview,
  columnMappings,
  onMappingChange,
  onBack,
  onConfirm,
  isImporting,
}: SolarColumnMapperProps) {
  const mappedColumns = new Set(Object.values(columnMappings).filter(Boolean));
  const unmappedColumns = csvHeaders.filter(h => !mappedColumns.has(h));

  const requiredFields = SOLAR_TARGET_FIELDS.filter(f => f.required);
  const missingRequired = requiredFields.filter(f => !columnMappings[f.key]);
  const isValid = missingRequired.length === 0;

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

  const getColumnStatus = (header: string): 'mapped' | 'unmapped' => {
    return mappedColumns.has(header) ? 'mapped' : 'unmapped';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Map Columns</CardTitle>
        <CardDescription>
          Review the data preview and map CSV columns to solar installation database fields. Required fields are marked with *.
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
            {SOLAR_TARGET_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-2">
                <label className="w-40 text-sm font-medium flex-shrink-0">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <ColumnCombobox
                  headers={csvHeaders}
                  value={columnMappings[field.key]}
                  onChange={(value) => onMappingChange(field.key, value)}
                />
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
          {missingRequired.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Required fields missing:</span>{' '}
                {missingRequired.map(f => f.label).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {hasDuplicates && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">Duplicate mappings detected:</span>{' '}
                {duplicates.map(([col]) => `"${col}" is mapped to multiple fields`).join('; ')}
              </AlertDescription>
            </Alert>
          )}

          {unmappedColumns.length > 0 && isValid && !hasDuplicates && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{unmappedColumns.length} column(s) won't be imported:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {unmappedColumns.slice(0, 20).map((col, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                  {unmappedColumns.length > 20 && (
                    <Badge variant="secondary" className="text-xs">
                      +{unmappedColumns.length - 20} more
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

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
