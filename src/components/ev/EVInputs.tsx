import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Zap, Fuel, Car } from "lucide-react";
import {
  EVInputs, EVMode, AUSTIN_EV_DEFAULTS,
  typicalEvPrice, typicalGasPrice, typicalTradeInValue,
} from "@/lib/ev-model";
import { EV_MODELS, GAS_MODELS } from "@/data/vehicle-models";

const CURRENT_YEAR = new Date().getFullYear();

interface Props {
  inputs: EVInputs;
  onChange: (updates: Partial<EVInputs>) => void;
}

const PriceInput = ({
  label, value, onChange, note,
}: {
  label: string; value: number; onChange: (v: number) => void; note?: string;
}) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">$</span>
      <Input
        type="number"
        value={value}
        step={500}
        onChange={e => {
          const n = Number(e.target.value);
          if (!isNaN(n) && n >= 0) onChange(n);
        }}
        className="pl-6 h-8 text-sm"
      />
    </div>
    {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
  </div>
);

const DecimalInput = ({
  label, value, onChange, note,
}: {
  label: string; value: number; onChange: (v: number) => void; note?: string;
}) => {
  const [text, setText] = useState(value.toFixed(2));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value.toFixed(2));
  }, [value]);

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">$</span>
        <Input
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={() => { focused.current = true; }}
          onBlur={() => {
            focused.current = false;
            const n = parseFloat(text);
            if (!isNaN(n) && n > 0) { setText(n.toFixed(2)); onChange(n); }
            else setText(value.toFixed(2));
          }}
          onChange={e => {
            setText(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n) && n > 0) onChange(n);
          }}
          className="pl-6 h-8 text-sm"
        />
      </div>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
  );
};

const ModeSelector = ({ mode, onChange }: { mode: EVMode; onChange: (m: EVMode) => void }) => (
  <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
    <button
      onClick={() => onChange("buying")}
      className={`flex-1 px-4 py-2.5 transition-colors text-center leading-snug ${
        mode === "buying"
          ? "bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      I'm adding a vehicle
    </button>
    <div className="w-px bg-border shrink-0" />
    <button
      onClick={() => onChange("own-gas")}
      className={`flex-1 px-4 py-2.5 transition-colors text-center leading-snug ${
        mode === "own-gas"
          ? "bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      I'm replacing a vehicle
    </button>
  </div>
);

function closestUsedPrice(usedPrices: Partial<Record<number, number>>, year: number): number | null {
  const years = Object.keys(usedPrices).map(Number).sort((a, b) => b - a);
  if (!years.length) return null;
  const exact = usedPrices[year];
  if (exact) return exact;
  const older = years.filter(y => y <= year);
  if (older.length) return usedPrices[older[0]]!;
  return usedPrices[years[years.length - 1]]!;
}

const ModelSelect = ({
  label,
  type,
  isNew,
  modelYear,
  initialValue,
  onSelect,
  onModelChange,
}: {
  label: string;
  type: "ev" | "gas";
  isNew: boolean;
  modelYear: number;
  initialValue?: string;
  onSelect: (price: number, efficiency: number) => void;
  onModelChange?: (key: string) => void;
}) => {
  const [value, setValue] = useState(initialValue ?? "");
  const models = type === "ev" ? EV_MODELS : GAS_MODELS;
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  // When year or new/used flag changes while a model is already selected,
  // re-fire onSelect so the parent price matches the dropdown label.
  useEffect(() => {
    if (!value) return;
    const [make, model] = value.split("|");
    const vehicle = models.find(v => v.make === make && v.model === model);
    if (!vehicle) return;
    const price = isNew
      ? vehicle.msrp
      : (closestUsedPrice(vehicle.usedPrices, modelYear) ?? vehicle.msrp);
    const efficiency = type === "ev"
      ? (vehicle as typeof EV_MODELS[0]).miPerKwh
      : (vehicle as typeof GAS_MODELS[0]).mpg;
    onSelectRef.current(price, efficiency);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, modelYear]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValue(val);
    onModelChange?.(val);
    if (!val) return;
    const [make, model] = val.split("|");
    const vehicle = models.find(v => v.make === make && v.model === model);
    if (!vehicle) return;

    const price = isNew
      ? vehicle.msrp
      : (closestUsedPrice(vehicle.usedPrices, modelYear) ?? vehicle.msrp);
    const efficiency = type === "ev"
      ? (vehicle as typeof EV_MODELS[0]).miPerKwh
      : (vehicle as typeof GAS_MODELS[0]).mpg;

    onSelect(price, efficiency);
  };

  return (
    <div>
      <select
        value={value}
        onChange={handleChange}
        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Select model to pre-fill…</option>
        {models.map(v => {
          const key = `${v.make}|${v.model}`;
          const price = isNew
            ? v.msrp
            : (closestUsedPrice(v.usedPrices, modelYear) ?? v.msrp);
          return (
            <option key={key} value={key}>
              {v.make} {v.model} · ${price.toLocaleString()}
            </option>
          );
        })}
      </select>
    </div>
  );
};

const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1 - 2012 + 1 },
  (_, i) => CURRENT_YEAR - 1 - i,
);

// "new" is a sentinel; numeric values are model years
type YearValue = "new" | number;

function nearestValidYear(year: number, valid: number[]): number {
  return valid.reduce((best, y) => Math.abs(y - year) < Math.abs(best - year) ? y : best);
}

const YearSelect = ({
  value,
  onChange,
  showNew = true,
  validYears,
  discontinued = false,
}: {
  value: YearValue;
  onChange: (y: YearValue) => void;
  showNew?: boolean;
  validYears?: number[] | null;
  discontinued?: boolean;
}) => (
  <select
    value={value === "new" ? "new" : String(value)}
    onChange={e => onChange(e.target.value === "new" ? "new" : Number(e.target.value))}
    className="h-8 w-[76px] shrink-0 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
  >
    {showNew && <option value="new" disabled={discontinued}>New</option>}
    {YEAR_OPTIONS.map(y => (
      <option key={y} value={y} disabled={validYears != null && !validYears.includes(y)}>{y}</option>
    ))}
  </select>
);

const EVInputsCard = ({ inputs, onChange }: Props) => {
  const {
    mode, gasIsNew, gasModelYear, evIsNew, evModelYear,
    evPrice, evMiPerKwh,
    gasPrice, gasTradeInValue, gasMpg,
    annualMiles, electricityRatePerKwh, gasPricePerGal,
  } = inputs;

  const ownGas = mode === "own-gas";
  const evAge = CURRENT_YEAR - evModelYear;

  // Track selected model keys to derive valid years for YearSelect greying
  const [evModelKey,  setEvModelKey]  = useState<string>("Chevy|Equinox EV");
  const [gasModelKey, setGasModelKey] = useState<string>("Chevy|Equinox");

  const evModelData  = EV_MODELS.find(v => `${v.make}|${v.model}` === evModelKey);
  const gasModelData = GAS_MODELS.find(v => `${v.make}|${v.model}` === gasModelKey);
  const evValidYears  = evModelData  ? Object.keys(evModelData.usedPrices).map(Number).sort((a, b) => a - b)  : null;
  const gasValidYears = gasModelData ? Object.keys(gasModelData.usedPrices).map(Number).sort((a, b) => a - b) : null;
  const evDiscontinued  = evModelData?.discontinued  ?? false;
  const gasDiscontinued = gasModelData?.discontinued ?? false;

  const handleEvModelChange = (key: string) => {
    setEvModelKey(key);
    if (!key) return;
    const model = EV_MODELS.find(v => `${v.make}|${v.model}` === key);
    if (!model) return;
    const valid = Object.keys(model.usedPrices).map(Number).sort((a, b) => a - b);
    if (!valid.length) return;
    if (evIsNew && model.discontinued) {
      onChange({ evIsNew: false, evModelYear: valid[valid.length - 1] });
    } else if (!evIsNew && !valid.includes(evModelYear)) {
      onChange({ evModelYear: nearestValidYear(evModelYear, valid) });
    }
  };

  const handleGasModelChange = (key: string) => {
    setGasModelKey(key);
    if (!key) return;
    const model = GAS_MODELS.find(v => `${v.make}|${v.model}` === key);
    if (!model) return;
    const valid = Object.keys(model.usedPrices).map(Number).sort((a, b) => a - b);
    if (!valid.length) return;
    if (!gasIsNew && !valid.includes(gasModelYear)) {
      onChange({ gasModelYear: nearestValidYear(gasModelYear, valid) });
    }
  };

  const handleModeChange = (m: EVMode) => {
    if (m === "own-gas" && gasIsNew) {
      // current gas car can't be "new" — reset to a sensible used year
      const yr = CURRENT_YEAR - 3;
      onChange({ mode: m, gasIsNew: false, gasModelYear: yr, gasTradeInValue: typicalTradeInValue(yr) });
    } else {
      onChange({ mode: m });
    }
  };

  const handleGasYearChange = (y: YearValue) => {
    if (y === "new") {
      onChange({
        gasIsNew: true,
        gasModelYear: CURRENT_YEAR,
        gasPrice: typicalGasPrice(true, CURRENT_YEAR),
        gasTradeInValue: 15_000,
      });
    } else {
      onChange({
        gasIsNew: false,
        gasModelYear: y,
        gasPrice: typicalGasPrice(false, y),
        gasTradeInValue: typicalTradeInValue(y),
      });
    }
  };

  const handleEvYearChange = (y: YearValue) => {
    if (y === "new") {
      onChange({
        evIsNew: true,
        evModelYear: CURRENT_YEAR,
        evPrice: typicalEvPrice(true, CURRENT_YEAR),
      });
    } else {
      onChange({
        evIsNew: false,
        evModelYear: y,
        evPrice: typicalEvPrice(false, y),
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <CardContent className="pt-5 pb-5 space-y-5">

        <ModeSelector mode={mode} onChange={handleModeChange} />

        {/* Vehicle columns */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Left panel ── */}
          <div className="space-y-3">
            {ownGas ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">My Current Vehicle</span>
                </div>

                <div className="flex gap-2 items-center">
                  <YearSelect
                    value={gasModelYear}
                    onChange={handleGasYearChange}
                    showNew={false}
                    validYears={gasValidYears}
                  />
                  <div className="flex-1 min-w-0">
                    <ModelSelect
                      label="Vehicle (optional)"
                      type="gas"
                      isNew={false}
                      modelYear={gasModelYear}
                      onSelect={(tradeIn, mpg) => onChange({ gasTradeInValue: tradeIn, gasMpg: mpg })}
                      onModelChange={handleGasModelChange}
                    />
                  </div>
                </div>

                <PriceInput
                  label="Estimated trade-in value"
                  value={gasTradeInValue}
                  onChange={v => onChange({ gasTradeInValue: v })}
                  note={`Typical ${gasModelYear} gas vehicle trade-in ~$${typicalTradeInValue(gasModelYear).toLocaleString()}`}
                />

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Fuel economy</Label>
                    <span className="text-xs font-medium tabular-nums">{gasMpg} MPG</span>
                  </div>
                  <Slider
                    value={[gasMpg]} min={10} max={60} step={1}
                    onValueChange={([v]) => onChange({ gasMpg: v })}
                  />
                  <p className="text-[10px] text-muted-foreground">Avg gas vehicle ~28 MPG</p>
                </div>

                <DecimalInput
                  label="Gas price / gallon"
                  value={gasPricePerGal}
                  onChange={v => onChange({ gasPricePerGal: v })}
                  note="Austin avg ~$3.50/gal"
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Gas Vehicle</span>
                </div>

                <div className="flex gap-2 items-center">
                  <YearSelect
                    value={gasIsNew ? "new" : gasModelYear}
                    onChange={handleGasYearChange}
                    validYears={gasValidYears}
                    discontinued={gasDiscontinued}
                  />
                  <div className="flex-1 min-w-0">
                    <ModelSelect
                      label="Vehicle (optional)"
                      type="gas"
                      isNew={gasIsNew}
                      modelYear={gasModelYear}
                      initialValue="Chevy|Equinox"
                      onSelect={(price, mpg) => onChange({ gasPrice: price, gasMpg: mpg })}
                      onModelChange={handleGasModelChange}
                    />
                  </div>
                </div>

                <PriceInput
                  label="Purchase price"
                  value={gasPrice}
                  onChange={v => onChange({ gasPrice: v })}
                  note={gasIsNew
                    ? "Chevy Equinox base MSRP 2025"
                    : `Typical ${gasModelYear} gas vehicle ~$${typicalGasPrice(false, gasModelYear).toLocaleString()}`}
                />

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Fuel economy</Label>
                    <span className="text-xs font-medium tabular-nums">{gasMpg} MPG</span>
                  </div>
                  <Slider
                    value={[gasMpg]} min={10} max={60} step={1}
                    onValueChange={([v]) => onChange({ gasMpg: v })}
                  />
                  <p className="text-[10px] text-muted-foreground">Avg new gas vehicle ~28 MPG</p>
                </div>

                <DecimalInput
                  label="Gas price / gallon"
                  value={gasPricePerGal}
                  onChange={v => onChange({ gasPricePerGal: v })}
                  note="Austin avg ~$3.50/gal"
                />
              </>
            )}
          </div>

          {/* ── Electric Vehicle ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Electric Vehicle</span>
            </div>

            <div className="flex gap-2 items-center">
              <YearSelect
                value={evIsNew ? "new" : evModelYear}
                onChange={handleEvYearChange}
                validYears={evValidYears}
                discontinued={evDiscontinued}
              />
              <div className="flex-1 min-w-0">
                <ModelSelect
                  label="Vehicle (optional)"
                  type="ev"
                  isNew={evIsNew}
                  modelYear={evModelYear}
                  initialValue="Chevy|Equinox EV"
                  onSelect={(price, miPerKwh) => onChange({ evPrice: price, evMiPerKwh: miPerKwh })}
                  onModelChange={handleEvModelChange}
                />
              </div>
            </div>

            <PriceInput
              label="Purchase price"
              value={evPrice}
              onChange={v => onChange({ evPrice: v })}
              note={evIsNew
                ? "Chevy Equinox EV base MSRP 2025"
                : `Typical ${evModelYear} used EV ~$${typicalEvPrice(false, evModelYear).toLocaleString()}`}
            />

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs text-muted-foreground">Efficiency (rated)</Label>
                <span className="text-xs font-medium tabular-nums">{evMiPerKwh} mi/kWh</span>
              </div>
              <Slider
                value={[evMiPerKwh]} min={1.5} max={5.0} step={0.1}
                onValueChange={([v]) => onChange({ evMiPerKwh: +v.toFixed(1) })}
              />
              <p className="text-[10px] text-muted-foreground">
                {evIsNew
                  ? "Mainstream EVs: 3.0–4.0 mi/kWh"
                  : `~2%/yr battery degradation applied · ${evAge === 1 ? "~2%" : `~${Math.round(evAge * 2)}%`} total for ${evModelYear}`}
              </p>
            </div>

            <DecimalInput
              label="Electricity / kWh"
              value={electricityRatePerKwh}
              onChange={v => onChange({ electricityRatePerKwh: v })}
              note="Austin Energy blended ~$0.12/kWh"
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Shared: annual miles */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Annual miles driven</Label>
            <span className="text-xs font-medium tabular-nums">{annualMiles.toLocaleString()} mi/yr</span>
          </div>
          <Slider
            value={[annualMiles]} min={5000} max={30000} step={500}
            onValueChange={([v]) => onChange({ annualMiles: v })}
          />
          <p className="text-[10px] text-muted-foreground">Austin average ~13,500 mi/yr (~37 mi/day)</p>
        </div>

      </CardContent>
    </Card>
  );
};

export default EVInputsCard;
