-- Add 2025 and 2026 model-year rows to vehicle_models
-- Run this after 20260619000000_vehicle_models.sql (base schema + 2024-and-older seed)
--
-- What this does:
--   1. Corrects a few 2024 used prices where CarGurus data differed from the seed
--   2. Moves MSRPs off 2024 rows → onto 2025 rows (2025 is where the new-car price belongs)
--   3. Inserts 2025 rows for all active models (CarGurus Price Trends, June 2026)
--   4. Moves MSRPs off 2025 rows → onto 2026 rows for the 8 models already on the used market
--   5. Inserts 2026 rows for those 8 models
--
-- Models with no 2025 used-market data yet (thin inventory — MSRP + range only, no used_price):
--   Tesla Model S/X, Rivian R1T, Polestar 2, GMC Sierra EV
--
-- Sources (all June 2026):
--   used_price → CarGurus Price Trends (cargurus.com/research/price-trends/)
--   msrp       → manufacturer websites
--   range_mi   → EPA fueleconomy.gov; same as prior year unless a change was published

-- ── 1. Correct a few 2024 used prices ────────────────────────────────────────

UPDATE vehicle_models SET used_price = 35600 WHERE make = 'BMW'    AND model = '3 Series' AND year = 2024;
UPDATE vehicle_models SET used_price = 20700 WHERE make = 'Toyota' AND model = 'Corolla'   AND year = 2024;
UPDATE vehicle_models SET used_price = 24600 WHERE make = 'Honda'  AND model = 'Civic'     AND year = 2024;

-- ── 2. Move MSRPs off 2024 rows (they now belong on 2025) ─────────────────────

UPDATE vehicle_models SET msrp = NULL
WHERE year = 2024 AND msrp IS NOT NULL;

-- ── 3. Insert 2025 rows ───────────────────────────────────────────────────────

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mi_per_kwh, range_mi, used_price, discontinued)
VALUES
  ('ev', 'Tesla',      'Model 3',         2025, 38630, 4.0, 342, 38459, false), -- tesla.com; CarGurus $38,459
  ('ev', 'Tesla',      'Model Y',         2025, 41630, 3.5, 310, 39587, false), -- tesla.com; CarGurus $39,587
  ('ev', 'Tesla',      'Model S',         2025, 79990, 3.7, 405,  NULL, false), -- tesla.com; no 2025 CarGurus data
  ('ev', 'Tesla',      'Model X',         2025, 84990, 2.9, 335,  NULL, false), -- tesla.com; no 2025 CarGurus data
  ('ev', 'Chevy',      'Equinox EV',      2025, 34995, 3.2, 319, 28474, false), -- CarGurus $28,474
  ('ev', 'Ford',       'Mustang Mach-E',  2025, 37995, 3.0, 320, 39058, false), -- ford.com; CarGurus $39,058
  ('ev', 'Ford',       'F-150 Lightning', 2025, 49780, 2.1, 320, 56709, false), -- ford.com; CarGurus $56,709
  ('ev', 'Hyundai',    'Ioniq 5',         2025, 37000, 3.3, 303, 33435, false), -- hyundaiusa.com; CarGurus $33,435
  ('ev', 'Hyundai',    'Ioniq 6',         2025, 39095, 3.9, 361, 31457, false), -- hyundaiusa.com; CarGurus $31,457
  ('ev', 'Kia',        'EV6',             2025, 42900, 3.3, 310, 33865, false), -- kia.com; CarGurus $33,865
  ('ev', 'Kia',        'EV9',             2025, 54900, 3.0, 304, 53410, false), -- kia.com; CarGurus $53,410
  ('ev', 'Volkswagen', 'ID.4',            2025, 45095, 3.1, 291, 33460, false), -- vw.com; CarGurus $33,460
  ('ev', 'Rivian',     'R1T',             2025, 80900, 2.3, 352,  NULL, false), -- rivian.com; no 2025 CarGurus data
  ('ev', 'Rivian',     'R1S',             2025, 82900, 2.3, 400, 79077, false), -- rivian.com; CarGurus $79,077
  ('ev', 'BMW',        'i4',              2025, 57900, 3.3, 301, 53516, false), -- bmwusa.com; CarGurus $53,516
  ('ev', 'Cadillac',   'Lyriq',           2025, 58595, 2.8, 314, 51835, false), -- CarGurus $51,835
  ('ev', 'Honda',      'Prologue',        2025, 47400, 3.0, 296, 30260, false), -- CarGurus $30,260
  ('ev', 'Polestar',   '2',               2025, 64800, 3.3, 320,  NULL, false), -- polestar.com; no 2025 CarGurus data
  ('ev', 'Nissan',     'Leaf',            2025, 28140, 3.3, 212, 21231, false), -- CarGurus $21,231
  ('ev', 'GMC',        'Sierra EV',       2025, 91995, 2.1, 440,  NULL, false)  -- gmc.com; no 2025 CarGurus data
ON CONFLICT (make, model, year) DO UPDATE SET
  msrp         = EXCLUDED.msrp,
  mi_per_kwh   = EXCLUDED.mi_per_kwh,
  range_mi     = EXCLUDED.range_mi,
  used_price   = EXCLUDED.used_price,
  discontinued = EXCLUDED.discontinued;

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mpg, used_price)
VALUES
  ('gas', 'Toyota', 'RAV4',           2025, 28850, 30, 33836), -- toyota.com; CarGurus $33,836
  ('gas', 'Honda',  'CR-V',           2025, 30100, 30, 31871), -- honda.com; CarGurus $31,871
  ('gas', 'Toyota', 'Camry',          2025, 28400, 32, 30115), -- CarGurus $30,115
  ('gas', 'Honda',  'Accord',         2025, 28750, 32, 27653), -- CarGurus $27,653
  ('gas', 'Toyota', 'Corolla',        2025, 22050, 35, 21359), -- CarGurus $21,359
  ('gas', 'Honda',  'Civic',          2025, 24950, 36, 25385), -- CarGurus $25,385
  ('gas', 'Mazda',  'CX-5',           2025, 28850, 27, 29197), -- CarGurus $29,197
  ('gas', 'Ford',   'F-150',          2025, 41405, 20, 54850), -- ford.com; CarGurus $54,850
  ('gas', 'Chevy',  'Silverado 1500', 2025, 37600, 20, 47013), -- CarGurus $47,013
  ('gas', 'Toyota', 'Tacoma',         2025, 31500, 22, 41161), -- CarGurus $41,161
  ('gas', 'Chevy',  'Equinox',        2025, 28000, 30, 27090), -- CarGurus $27,090
  ('gas', 'Ford',   'Explorer',       2025, 37650, 24, 42291), -- CarGurus $42,291
  ('gas', 'Toyota', 'Highlander',     2025, 38005, 24, 41927), -- CarGurus $41,927
  ('gas', 'BMW',    '3 Series',       2025, 43800, 28, 37986), -- CarGurus $37,986
  ('gas', 'Toyota', 'Tundra',         2025, 38555, 18, 50945)  -- CarGurus $50,945
ON CONFLICT (make, model, year) DO UPDATE SET
  msrp       = EXCLUDED.msrp,
  mpg        = EXCLUDED.mpg,
  used_price = EXCLUDED.used_price;

-- ── 4. Move MSRPs off 2025 rows for models that now have 2026 data ────────────

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

-- ── 5. Insert 2026 rows ───────────────────────────────────────────────────────

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mi_per_kwh, range_mi, used_price, discontinued)
VALUES
  ('ev', 'Tesla',   'Model Y',    2026, 41630, 3.5, 310, 46433, false), -- tesla.com; CarGurus $46,433
  ('ev', 'Hyundai', 'Ioniq 5',   2026, 35000, 3.3, 303, 38221, false), -- hyundaiusa.com (price cut); CarGurus $38,221
  ('ev', 'Chevy',   'Equinox EV',2026, 34995, 3.2, 319, 37401, false), -- CarGurus $37,401
  ('ev', 'BMW',     'i4',        2026, 57900, 3.3, 301, 64622, false)  -- bmwusa.com; CarGurus $64,622
ON CONFLICT (make, model, year) DO UPDATE SET
  msrp         = EXCLUDED.msrp,
  mi_per_kwh   = EXCLUDED.mi_per_kwh,
  range_mi     = EXCLUDED.range_mi,
  used_price   = EXCLUDED.used_price,
  discontinued = EXCLUDED.discontinued;

INSERT INTO vehicle_models
  (type, make, model, year, msrp, mpg, used_price)
VALUES
  ('gas', 'Honda', 'CR-V',           2026, 32370, 30, 34583), -- honda.com; CarGurus $34,583
  ('gas', 'Honda', 'Accord',         2026, 28395, 32, 29783), -- honda.com; CarGurus $29,783
  ('gas', 'Ford',  'Explorer',       2026, 38465, 24, 46581), -- ford.com; CarGurus $46,581
  ('gas', 'Chevy', 'Silverado 1500', 2026, 39695, 20, 51138)  -- chevy.com; CarGurus $51,138
ON CONFLICT (make, model, year) DO UPDATE SET
  msrp       = EXCLUDED.msrp,
  mpg        = EXCLUDED.mpg,
  used_price = EXCLUDED.used_price;
