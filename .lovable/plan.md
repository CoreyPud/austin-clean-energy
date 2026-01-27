

## CSV Column Mapping Feature for PIR Import

### Overview
Add an interactive column mapping step between file upload and data import that displays a preview of the CSV data and allows admins to map source columns to target database fields.

### User Flow

```
Upload CSV → Preview Data → Map Columns → Validate → Import
```

1. Admin selects CSV file
2. System parses first 5 rows and extracts headers
3. Preview table displays sample data with auto-detected mappings
4. Admin adjusts mappings using dropdown selectors
5. Validation checks required fields are mapped
6. Warning shows any unmapped columns
7. Admin confirms and imports

### Frontend Changes (src/pages/PIRImport.tsx)

**New State Variables:**
- `csvHeaders: string[]` - Extracted column headers from uploaded file
- `csvPreview: string[][]` - First 5 data rows for preview display
- `columnMappings: Record<string, string | null>` - Maps target fields to source columns
- `step: 'upload' | 'mapping' | 'importing' | 'complete'` - UI flow state
- `unmappedColumns: string[]` - Source columns not assigned to any field

**New Components:**

1. **ColumnMappingStep** - Main mapping interface
   - Displays preview table with first 5 rows
   - Each target field (install_date, kw_capacity, etc.) has a dropdown
   - Dropdown shows all CSV headers plus "Skip" option
   - Auto-detect attempts to pre-fill based on header name matching
   - Required fields (install_date, kw_capacity, installer) marked with asterisk

2. **PreviewTable** - CSV data preview
   - Shows headers in first row
   - Displays up to 5 sample data rows
   - Highlights which columns are mapped vs unmapped
   - Color-coded: green = mapped, yellow = unmapped

3. **MappingValidation** - Status display
   - Shows required fields status (mapped/missing)
   - Warning alert for unmapped columns
   - Proceed button disabled until required fields mapped

**Target Fields to Map:**

| Field | Required | Database Column |
|-------|----------|-----------------|
| Install Date | Yes | interconnection_date |
| kW Capacity | Yes | installed_kw |
| Installer | Yes | installer_name |
| Battery kWh | No | battery_kwh |
| Cost | No | system_cost |
| AE Rebate | No | ae_rebate |
| $/kW Rebate | No | dollar_per_kw_rebate |
| % Rebate | No | percent_rebate |
| Fiscal Year | No | fiscal_year |
| Notes | No | notes |

### Backend Changes (supabase/functions/import-pir-data/index.ts)

**Modified Request Body:**
```typescript
{
  csvData: string,
  columnMapping?: Record<string, number>  // Target field → column index
}
```

**Logic Changes:**
- If `columnMapping` provided in request, use it directly instead of auto-detection
- Still perform auto-detection as fallback for backwards compatibility
- Add validation that required mappings exist before processing
- Return more detailed error messages for mapping issues

### UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  PIR Data Import                                            │
├─────────────────────────────────────────────────────────────┤
│  Step 2: Map Columns                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Preview (first 5 rows)                                  ││
│  ├──────────┬──────────┬──────────┬──────────┬─────────────┤│
│  │ Column A │ Column B │ Col C    │ Col D    │ Col E       ││
│  ├──────────┼──────────┼──────────┼──────────┼─────────────┤│
│  │ 2024-01-5│ 8.5      │ Tesla... │ 25000    │ 2500        ││
│  │ 2024-01-8│ 12.0     │ Sunrun   │ 32000    │ 3200        ││
│  │ ...      │ ...      │ ...      │ ...      │ ...         ││
│  └──────────┴──────────┴──────────┴──────────┴─────────────┘│
│                                                             │
│  Map to Database Fields:                                    │
│  ┌────────────────────┬─────────────────────┐              │
│  │ Install Date *     │ [Column A ▼]        │              │
│  ├────────────────────┼─────────────────────┤              │
│  │ kW Capacity *      │ [Column B ▼]        │              │
│  ├────────────────────┼─────────────────────┤              │
│  │ Installer *        │ [Column C ▼]        │              │
│  ├────────────────────┼─────────────────────┤              │
│  │ Cost (optional)    │ [Column D ▼]        │              │
│  ├────────────────────┼─────────────────────┤              │
│  │ AE Rebate          │ [Column E ▼]        │              │
│  └────────────────────┴─────────────────────┘              │
│                                                             │
│  ⚠️ 3 columns won't be imported: "Col F", "Col G", "Col H"  │
│                                                             │
│  [← Back]                          [Confirm & Import →]     │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Detection Logic

When CSV is loaded, attempt to auto-map columns by matching headers:
- Fuzzy match header names against known patterns
- Example: "Installation Date", "INSTALL_DATE", "Date Installed" all map to install_date
- Pre-populate dropdowns with best guesses
- Admin can override any auto-detected mapping

### Validation Rules

Before allowing import:
1. Install Date, kW Capacity, and Installer must all be mapped
2. No duplicate mappings (can't map two fields to same source column)
3. At least 1 data row after header

### Files to Modify

1. `src/pages/PIRImport.tsx` - Add mapping UI, step flow, preview parsing
2. `supabase/functions/import-pir-data/index.ts` - Accept optional mapping, validation

### Estimated Complexity
- Frontend: Medium (new UI components, state management)
- Backend: Low (minor changes to accept mapping parameter)

