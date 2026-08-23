import { useState } from "react";
import { Filter, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import MultiSelectDropdown from "@/components/explore/MultiSelectDropdown";
import { TYPE_LABEL } from "@/lib/property-solar";
import {
  NUMERIC_FIELDS,
  EMPTY_NUMERIC_FILTERS,
  type NumericFieldKey,
  type NumericRange,
} from "@/lib/property-numeric-filters";

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));

const DISTRICT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `District ${i + 1}`,
}));

interface Props {
  selectedTypes: string[];
  onTypesChange: (v: string[]) => void;
  selectedDistricts: string[];
  onDistrictsChange: (v: string[]) => void;
  numericFilters: Record<NumericFieldKey, NumericRange>;
  onNumericFiltersChange: (v: Record<NumericFieldKey, NumericRange>) => void;
}

export default function ExploreFilterPanel({
  selectedTypes, onTypesChange,
  selectedDistricts, onDistrictsChange,
  numericFilters, onNumericFiltersChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeNumeric = NUMERIC_FIELDS.filter(
    (f) => numericFilters[f.key].min !== "" || numericFilters[f.key].max !== "",
  );
  const activeFilterCount = selectedTypes.length + selectedDistricts.length + activeNumeric.length;

  const setRange = (key: NumericFieldKey, patch: Partial<NumericRange>) => {
    onNumericFiltersChange({ ...numericFilters, [key]: { ...numericFilters[key], ...patch } });
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-2 hover:bg-white transition-colors"
      >
        <Filter className="h-4 w-4 text-foreground" />
        {activeFilterCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute top-4 left-4 bottom-4 z-20 w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {activeFilterCount}
            </span>
          )}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Property type</p>
          <MultiSelectDropdown
            label="Any type"
            options={TYPE_OPTIONS}
            selected={selectedTypes}
            onChange={onTypesChange}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Council district</p>
          <MultiSelectDropdown
            label="Any district"
            options={DISTRICT_OPTIONS}
            selected={selectedDistricts}
            onChange={onDistrictsChange}
          />
        </div>

        <div className="pt-1 border-t border-border space-y-2">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center justify-between w-full text-left pt-2"
          >
            <span className="text-xs font-medium text-muted-foreground">
              More filters
              {activeNumeric.length > 0 && (
                <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeNumeric.length}
                </span>
              )}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </button>

          {advancedOpen && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-end">
                <button
                  className="text-xs text-muted-foreground underline disabled:opacity-40 disabled:no-underline"
                  disabled={activeNumeric.length === 0}
                  onClick={() => onNumericFiltersChange(EMPTY_NUMERIC_FILTERS)}
                >
                  Clear all
                </button>
              </div>
              {NUMERIC_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Min"
                      value={numericFilters[f.key].min}
                      onChange={(e) => setRange(f.key, { min: e.target.value })}
                      className="h-7 w-full rounded border border-input bg-background px-2 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Max"
                      value={numericFilters[f.key].max}
                      onChange={(e) => setRange(f.key, { max: e.target.value })}
                      className="h-7 w-full rounded border border-input bg-background px-2 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
