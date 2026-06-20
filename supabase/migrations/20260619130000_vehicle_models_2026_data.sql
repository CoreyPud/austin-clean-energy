-- Add 2026 model-year rows for models already on the used market
--
-- Not all models have 2026 listings yet — only 8 have meaningful CarGurus data.
-- For those that do, MSRP moves from the 2025 row to the 2026 row.
--
-- Sources (June 2026):
--   used_price → CarGurus Price Trends (cargurus.com/research/price-trends/)
--   msrp       → manufacturer websites, June 2026
--   range_mi   → same EPA rating as 2025 unless a confirmed change is published

-- ── Step 1: Clear MSRPs from 2025 rows for models that now have 2026 data ──────

UPDATE vehicle_models SET msrp = NULL
WHERE year = 2025 AND msrp IS NOT NULL
  AND (make, model) IN (
    ('Tesla',   'Model Y'),
    ('Hyundai', 'Ioniq 5'),
    ('Chevy',   'Equinox EV'),
    ('BMW',     'i4'),
    ('Honda',   'CR-V'),
    ('Honda',   'Accord'),
    ('Ford',    'Explorer'),
    ('Chevy',   'Silverado 1500')
  );

-- ── Step 2: Insert 2026 rows ───────────────────────────────────────────────────

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mi_per_kwh, range_mi, used_price, discontinued)
VALUES

-- Tesla Model Y — CarGurus avg $46,433; tesla.com 2026 MSRP $41,630
  ('ev', 'Tesla', 'Model Y', 2026, 41630, 3.5, 310, 46433, false),

-- Hyundai Ioniq 5 — CarGurus avg $38,221; hyundaiusa.com 2026 MSRP $35,000 (price cut)
  ('ev', 'Hyundai', 'Ioniq 5', 2026, 35000, 3.3, 303, 38221, false),

-- Chevy Equinox EV — CarGurus avg $37,401; $34,995 MSRP (minor trim adjustment)
  ('ev', 'Chevy', 'Equinox EV', 2026, 34995, 3.2, 319, 37401, false),

-- BMW i4 — CarGurus avg $64,622; bmwusa.com 2026 MSRP $57,900 (eDrive40)
  ('ev', 'BMW', 'i4', 2026, 57900, 3.3, 301, 64622, false)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp         = EXCLUDED.msrp,
  mi_per_kwh   = EXCLUDED.mi_per_kwh,
  range_mi     = EXCLUDED.range_mi,
  used_price   = EXCLUDED.used_price,
  discontinued = EXCLUDED.discontinued;

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mpg, used_price)
VALUES

-- Honda CR-V — CarGurus avg $34,583; honda.com 2026 MSRP $32,370
  ('gas', 'Honda', 'CR-V',           2026, 32370, 30, 34583),

-- Honda Accord — CarGurus avg $29,783; honda.com 2026 MSRP $28,395
  ('gas', 'Honda', 'Accord',         2026, 28395, 32, 29783),

-- Ford Explorer — CarGurus avg $46,581; ford.com 2026 MSRP $38,465
  ('gas', 'Ford',  'Explorer',       2026, 38465, 24, 46581),

-- Chevy Silverado 1500 — CarGurus avg $51,138; chevy.com 2026 MSRP $39,695
  ('gas', 'Chevy', 'Silverado 1500', 2026, 39695, 20, 51138)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp       = EXCLUDED.msrp,
  mpg        = EXCLUDED.mpg,
  used_price = EXCLUDED.used_price;
