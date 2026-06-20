-- Add 2025 model-year rows and move MSRPs from 2024 → 2025
--
-- Sources (all CarGurus Price Trends, June 2026):
--   used_price → cargurus.com/research/price-trends/<model>
--   msrp       → manufacturer base price, 2025 model year (manufacturer websites)
--   range_mi   → same as 2024 EPA rating unless EPA published a change
--
-- Models with no 2025 CarGurus listing data (thin used inventory):
--   Tesla Model S/X, Rivian R1T, Polestar 2, GMC Sierra EV
--   → 2025 row added with msrp + range only; used_price left NULL

-- ── Step 1: Clear MSRPs from 2024 rows — they now live on 2025 rows ────────────

UPDATE vehicle_models
SET msrp = NULL
WHERE year = 2024 AND msrp IS NOT NULL;

-- ── Step 2: Correct a few 2024 used prices where CarGurus data differed ────────

UPDATE vehicle_models SET used_price = 35600 WHERE make = 'BMW'    AND model = '3 Series' AND year = 2024;
UPDATE vehicle_models SET used_price = 20700 WHERE make = 'Toyota' AND model = 'Corolla'   AND year = 2024;
UPDATE vehicle_models SET used_price = 24600 WHERE make = 'Honda'  AND model = 'Civic'     AND year = 2024;

-- ── Step 3: Insert 2025 rows ───────────────────────────────────────────────────

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mi_per_kwh, range_mi, used_price, discontinued)
VALUES

-- Tesla Model 3 — CarGurus avg $38,459; tesla.com 2025 MSRP $38,630
  ('ev', 'Tesla', 'Model 3', 2025, 38630, 4.0, 342, 38459, false),

-- Tesla Model Y — CarGurus avg $39,587; tesla.com 2025 MSRP $41,630
  ('ev', 'Tesla', 'Model Y', 2025, 41630, 3.5, 310, 39587, false),

-- Tesla Model S — no 2025 CarGurus data (thin inventory); tesla.com 2025 MSRP $79,990
  ('ev', 'Tesla', 'Model S', 2025, 79990, 3.7, 405, NULL, false),

-- Tesla Model X — no 2025 CarGurus data (thin inventory); tesla.com 2025 MSRP $84,990
  ('ev', 'Tesla', 'Model X', 2025, 84990, 2.9, 335, NULL, false),

-- Chevy Equinox EV — CarGurus avg $28,474; $34,995 MSRP
  ('ev', 'Chevy', 'Equinox EV', 2025, 34995, 3.2, 319, 28474, false),

-- Ford Mustang Mach-E — CarGurus avg $39,058; ford.com 2025 MSRP $37,995
  ('ev', 'Ford', 'Mustang Mach-E', 2025, 37995, 3.0, 320, 39058, false),

-- Ford F-150 Lightning — CarGurus avg $56,709; ford.com 2025 MSRP $49,780
  ('ev', 'Ford', 'F-150 Lightning', 2025, 49780, 2.1, 320, 56709, false),

-- Hyundai Ioniq 5 — CarGurus avg $33,435; hyundaiusa.com 2025 MSRP $37,000
  ('ev', 'Hyundai', 'Ioniq 5', 2025, 37000, 3.3, 303, 33435, false),

-- Hyundai Ioniq 6 — CarGurus avg $31,457; hyundaiusa.com 2025 MSRP $39,095
  ('ev', 'Hyundai', 'Ioniq 6', 2025, 39095, 3.9, 361, 31457, false),

-- Kia EV6 — CarGurus avg $33,865; kia.com 2025 MSRP $42,900
  ('ev', 'Kia', 'EV6', 2025, 42900, 3.3, 310, 33865, false),

-- Kia EV9 — CarGurus avg $53,410; kia.com 2025 MSRP $54,900
  ('ev', 'Kia', 'EV9', 2025, 54900, 3.0, 304, 53410, false),

-- Volkswagen ID.4 — CarGurus avg $33,460; vw.com 2025 MSRP $45,095
  ('ev', 'Volkswagen', 'ID.4', 2025, 45095, 3.1, 291, 33460, false),

-- Rivian R1T — no 2025 CarGurus data (thin inventory); rivian.com 2025 MSRP $80,900
  ('ev', 'Rivian', 'R1T', 2025, 80900, 2.3, 352, NULL, false),

-- Rivian R1S — CarGurus avg $79,077; rivian.com 2025 MSRP $82,900
  ('ev', 'Rivian', 'R1S', 2025, 82900, 2.3, 400, 79077, false),

-- BMW i4 — CarGurus avg $53,516; bmwusa.com 2025 MSRP $57,900
  ('ev', 'BMW', 'i4', 2025, 57900, 3.3, 301, 53516, false),

-- Cadillac Lyriq — CarGurus avg $51,835; $58,595 MSRP
  ('ev', 'Cadillac', 'Lyriq', 2025, 58595, 2.8, 314, 51835, false),

-- Honda Prologue — CarGurus avg $30,260; $47,400 MSRP
  ('ev', 'Honda', 'Prologue', 2025, 47400, 3.0, 296, 30260, false),

-- Polestar 2 — no 2025 CarGurus data; polestar.com 2025 MSRP $64,800
  ('ev', 'Polestar', '2', 2025, 64800, 3.3, 320, NULL, false),

-- Nissan Leaf — CarGurus avg $21,231; $28,140 MSRP
  ('ev', 'Nissan', 'Leaf', 2025, 28140, 3.3, 212, 21231, false),

-- GMC Sierra EV — no 2025 CarGurus data (thin inventory); gmc.com 2025 MSRP $91,995
  ('ev', 'GMC', 'Sierra EV', 2025, 91995, 2.1, 440, NULL, false)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp         = EXCLUDED.msrp,
  mi_per_kwh   = EXCLUDED.mi_per_kwh,
  range_mi     = EXCLUDED.range_mi,
  used_price   = EXCLUDED.used_price,
  discontinued = EXCLUDED.discontinued;

-- Gas models 2025 ─────────────────────────────────────────────────────────────

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mpg, used_price)
VALUES

-- Toyota RAV4 — CarGurus avg $33,836; toyota.com 2025 MSRP $28,850
  ('gas', 'Toyota', 'RAV4',           2025, 28850, 30, 33836),

-- Honda CR-V — CarGurus avg $31,871; honda.com 2025 MSRP $30,100
  ('gas', 'Honda',  'CR-V',           2025, 30100, 30, 31871),

-- Toyota Camry — CarGurus avg $30,115; $28,400 MSRP
  ('gas', 'Toyota', 'Camry',          2025, 28400, 32, 30115),

-- Honda Accord — CarGurus avg $27,653; $28,750 MSRP
  ('gas', 'Honda',  'Accord',         2025, 28750, 32, 27653),

-- Toyota Corolla — CarGurus avg $21,359; $22,050 MSRP
  ('gas', 'Toyota', 'Corolla',        2025, 22050, 35, 21359),

-- Honda Civic — CarGurus avg $25,385; $24,950 MSRP
  ('gas', 'Honda',  'Civic',          2025, 24950, 36, 25385),

-- Mazda CX-5 — CarGurus avg $29,197; $28,850 MSRP
  ('gas', 'Mazda',  'CX-5',           2025, 28850, 27, 29197),

-- Ford F-150 — CarGurus avg $54,850; ford.com 2025 XL MSRP $41,405
  ('gas', 'Ford',   'F-150',          2025, 41405, 20, 54850),

-- Chevy Silverado 1500 — CarGurus avg $47,013; $37,600 MSRP
  ('gas', 'Chevy',  'Silverado 1500', 2025, 37600, 20, 47013),

-- Toyota Tacoma — CarGurus avg $41,161; $31,500 MSRP
  ('gas', 'Toyota', 'Tacoma',         2025, 31500, 22, 41161),

-- Chevy Equinox — CarGurus avg $27,090; $28,000 MSRP
  ('gas', 'Chevy',  'Equinox',        2025, 28000, 30, 27090),

-- Ford Explorer — CarGurus avg $42,291; $37,650 MSRP
  ('gas', 'Ford',   'Explorer',       2025, 37650, 24, 42291),

-- Toyota Highlander — CarGurus avg $41,927; $38,005 MSRP
  ('gas', 'Toyota', 'Highlander',     2025, 38005, 24, 41927),

-- BMW 3 Series — CarGurus avg $37,986; $43,800 MSRP
  ('gas', 'BMW',    '3 Series',       2025, 43800, 28, 37986),

-- Toyota Tundra — CarGurus avg $50,945; $38,555 MSRP
  ('gas', 'Toyota', 'Tundra',         2025, 38555, 18, 50945)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp       = EXCLUDED.msrp,
  mpg        = EXCLUDED.mpg,
  used_price = EXCLUDED.used_price;
