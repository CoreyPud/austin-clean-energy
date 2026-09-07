import { useEffect, useState } from "react";
import { SlidersHorizontal, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import MultiSelectDropdown from "@/components/explore/MultiSelectDropdown";
import { TYPE_LABEL } from "@/lib/property-solar";
import {
  NUMERIC_FIELDS,
  type NumericFieldKey,
  type NumericBounds,
  type NumericRange,
} from "@/lib/property-numeric-filters";

const TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }));

const DISTRICT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `District ${i + 1}`,
}));

const sameMembers = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v));

const sameRanges = (
  a: Record<NumericFieldKey, NumericRange> | null,
  b: Record<NumericFieldKey, NumericRange> | null,
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return NUMERIC_FIELDS.every((f) => a[f.key].min === b[f.key].min && a[f.key].max === b[f.key].max);
};

interface Props {
  selectedTypes: string[];
  onTypesChange: (v: string[]) => void;
  selectedDistricts: string[];
  onDistrictsChange: (v: string[]) => void;
  /** Each field's full [min, max] across the loaded dataset -- a slider's extent. Null until
   *  the bulk load completes and there's real data to compute it from. */
  numericBounds: Record<NumericFieldKey, NumericBounds> | null;
  /** Current *applied* selection per field -- what's actually filtering the map right now.
   *  Null exactly when numericBounds is -- see Explore.tsx's own comment. */
  numericRange: Record<NumericFieldKey, NumericRange> | null;
  onNumericRangeChange: (v: Record<NumericFieldKey, NumericRange>) => void;
}

/**
 * Every control here edits local draft state, not the applied filters directly -- dragging a
 * range slider fires onValueChange continuously, and each of those was recomputing Explore's
 * pointFilter and calling Mapbox's setFilter on the 'inst-point' layer immediately, which made
 * dragging visibly laggy. An explicit Apply button batches a whole editing session (type
 * toggles, district toggles, slider drags) into one filter change instead of one per tick.
 */
export default function ExploreFilterPanel({
  selectedTypes, onTypesChange,
  selectedDistricts, onDistrictsChange,
  numericBounds, numericRange, onNumericRangeChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [draftTypes, setDraftTypes] = useState(selectedTypes);
  const [draftDistricts, setDraftDistricts] = useState(selectedDistricts);
  const [draftRange, setDraftRange] = useState(numericRange);

  // Only the applied props themselves ever change these -- either Explore computing
  // numericBounds/numericRange for the first time (null -> real), or Apply below feeding a
  // draft back in as the new applied value (draft already matches by definition at that point).
  // Nothing else in this component's lifecycle mutates the applied props, so syncing on every
  // change here can't clobber an in-progress, not-yet-applied edit.
  useEffect(() => { setDraftTypes(selectedTypes); }, [selectedTypes]);
  useEffect(() => { setDraftDistricts(selectedDistricts); }, [selectedDistricts]);
  useEffect(() => { setDraftRange(numericRange); }, [numericRange]);

  const isDirty =
    !sameMembers(draftTypes, selectedTypes) ||
    !sameMembers(draftDistricts, selectedDistricts) ||
    !sameRanges(draftRange, numericRange);

  const applyFilters = () => {
    onTypesChange(draftTypes);
    onDistrictsChange(draftDistricts);
    if (draftRange) onNumericRangeChange(draftRange);
  };

  // Counts against the *applied* filters (what's actually affecting the map), not the draft --
  // the badge is a status of current state, not a preview of pending edits.
  const activeNumeric = numericBounds && numericRange
    ? NUMERIC_FIELDS.filter((f) => {
        const b = numericBounds[f.key];
        const r = numericRange[f.key];
        return r.min > b.min || r.max < b.max;
      })
    : [];
  const activeFilterCount = selectedTypes.length + selectedDistricts.length + activeNumeric.length;

  const setDraftFieldRange = (key: NumericFieldKey, min: number, max: number) => {
    if (!draftRange) return;
    setDraftRange({ ...draftRange, [key]: { min, max } });
  };

  const clearDraftNumeric = () => {
    if (!numericBounds) return;
    setDraftRange(
      NUMERIC_FIELDS.reduce(
        (acc, f) => ({ ...acc, [f.key]: { ...numericBounds[f.key] } }),
        {} as Record<NumericFieldKey, NumericRange>,
      ),
    );
  };
  const draftNumericActive = numericBounds && draftRange
    ? NUMERIC_FIELDS.some((f) => draftRange[f.key].min > numericBounds[f.key].min || draftRange[f.key].max < numericBounds[f.key].max)
    : false;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-2 hover:bg-white transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4 text-foreground" />
        {activeFilterCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {activeFilterCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute inset-y-0 left-0 z-20 w-72 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
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
            selected={draftTypes}
            onChange={setDraftTypes}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Council district</p>
          <MultiSelectDropdown
            label="Any district"
            options={DISTRICT_OPTIONS}
            selected={draftDistricts}
            onChange={setDraftDistricts}
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
            <div className="space-y-4 pt-1">
              <div className="flex justify-end">
                <button
                  className="text-xs text-muted-foreground underline disabled:opacity-40 disabled:no-underline"
                  disabled={!draftNumericActive}
                  onClick={clearDraftNumeric}
                >
                  Clear all
                </button>
              </div>
              {NUMERIC_FIELDS.map((f) => {
                const bounds = numericBounds?.[f.key];
                const range = draftRange?.[f.key];
                if (!bounds || !range) {
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <div className="h-5 flex items-center text-xs text-muted-foreground/60">Loading…</div>
                    </div>
                  );
                }
                return (
                  <div key={f.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-xs text-foreground tabular-nums whitespace-nowrap">
                        {f.format(range.min)} - {f.format(range.max)}
                      </p>
                    </div>
                    <Slider
                      min={bounds.min}
                      max={bounds.max}
                      step={f.step}
                      value={[range.min, range.max]}
                      onValueChange={([min, max]) => setDraftFieldRange(f.key, min, max)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <Button className="w-full" size="sm" disabled={!isDirty} onClick={applyFilters}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}
