

## Data Comparison Bar Graph: City vs PIR Records

### Overview
Add an interactive bar chart to the `/admin/data-comparison` page that visually compares installation counts and kW capacity between City permit data (`solar_installations`) and Austin Energy PIR data (`pir_installations`), with a toggle to switch between Calendar Year and Fiscal Year views.

### User Experience
1. Admin navigates to Data Comparison page
2. A new "Year-over-Year Comparison" section displays below the stats cards
3. Toggle switch allows switching between Calendar Year and Fiscal Year
4. Grouped bar chart shows City vs PIR data side-by-side for each year
5. Two metrics available: Installation Count and Total kW

### Design

```
┌──────────────────────────────────────────────────────────────────┐
│  Year-over-Year Comparison                                       │
│  [Calendar Year] [Fiscal Year]  ←─ Toggle                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Installations by Year                         │ │
│  │  ■ City Permits   ■ PIR Records                              │ │
│  │                                                              │ │
│  │  800 │    ██                                                 │ │
│  │  600 │    ██ ▓▓                                              │ │
│  │  400 │    ██ ▓▓    ██ ▓▓    ██ ▓▓                            │ │
│  │  200 │    ██ ▓▓    ██ ▓▓    ██ ▓▓    ██ ▓▓                   │ │
│  │    0 └─────────────────────────────────────────              │ │
│  │       2021    2022    2023    2024    2025                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Total Capacity (kW) by Year                   │ │
│  │  (Same grouped bar format showing kW comparison)             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Technical Details

#### Data Aggregation Logic

**Calendar Year** (January 1 - December 31):
- City: Group by `EXTRACT(YEAR FROM completed_date)` or fallback to `issued_date`
- PIR: Group by `EXTRACT(YEAR FROM interconnection_date)`

**Fiscal Year** (October 1 - September 30, Austin standard):
- FY 2024 = October 1, 2023 through September 30, 2024
- City: If month >= 10 (October+), assign to next year's FY
- PIR: Same logic applied to `interconnection_date`

#### New State Variables
```typescript
// Year mode toggle
const [yearMode, setYearMode] = useState<'calendar' | 'fiscal'>('fiscal');

// Comparison chart data
const [comparisonData, setComparisonData] = useState<ComparisonYearData[]>([]);
const [loadingComparison, setLoadingComparison] = useState(false);

interface ComparisonYearData {
  year: number;
  label: string;  // "2024" or "FY 2024"
  cityCount: number;
  pirCount: number;
  cityKW: number;
  pirKW: number;
}
```

#### Data Fetching Function
```typescript
const fetchComparisonData = async (mode: 'calendar' | 'fiscal') => {
  // Fetch all City records with dates and kW
  const cityData = await supabase
    .from('solar_installations')
    .select('completed_date, issued_date, installed_kw');
  
  // Fetch all PIR records with dates and kW
  const pirData = await supabase
    .from('pir_installations')
    .select('interconnection_date, system_kw');
  
  // Aggregate by year (calendar or fiscal)
  // Return merged dataset with both sources per year
};
```

#### Chart Implementation
- Use `recharts` BarChart with grouped bars (not stacked)
- Two bars per year: City (primary color) and PIR (secondary color)
- Separate charts for Count and kW metrics
- Tooltips show exact values for both sources
- Follows existing chart patterns from `FiscalYearStats.tsx`

### Files to Modify

**src/pages/DataComparison.tsx**
1. Add imports for chart components, Switch, and Label
2. Add new state for `yearMode`, `comparisonData`, `loadingComparison`
3. Add `fetchComparisonData()` function with aggregation logic
4. Add useEffect to fetch data on mount and when yearMode changes
5. Insert new "Year-over-Year Comparison" Card section after stats cards
6. Add Toggle switch for Calendar/Fiscal year mode
7. Add two grouped bar charts (Count and kW)

### Chart Configuration
```typescript
const chartConfig = {
  cityCount: {
    label: "City Permits",
    color: "hsl(var(--primary))",
  },
  pirCount: {
    label: "PIR Records", 
    color: "hsl(var(--chart-2))",
  },
  cityKW: {
    label: "City kW",
    color: "hsl(var(--primary))",
  },
  pirKW: {
    label: "PIR kW",
    color: "hsl(var(--chart-2))",
  },
};
```

### Edge Cases
- Handle years with City data but no PIR data (and vice versa)
- Show 0 values rather than hiding bars for missing data
- Limit to years where at least one source has data
- Handle null dates gracefully (skip records with no date)

### Data Note
- City records use `completed_date` (preferred) or `issued_date` (fallback)
- PIR records use `interconnection_date`
- Both use their respective kW fields: `installed_kw` (City) and `system_kw` (PIR)

