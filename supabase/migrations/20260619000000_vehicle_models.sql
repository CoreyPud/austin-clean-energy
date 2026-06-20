-- Vehicle comparison data for the EV vs Gas Cost Comparison page
--
-- One row per (make, model, year). Type column distinguishes EV from gas.
-- mi_per_kwh and range_mi are EV-only; mpg is gas-only.
-- msrp is populated only for the most recent model year (new-car price, 2025).
--
-- Data sources (all retrieved June 2026):
--   msrp       → manufacturer base price, 2025 model year (manufacturer websites)
--   mi_per_kwh → EPA combined efficiency, fueleconomy.gov (LR RWD trim where multiple exist)
--   mpg        → EPA combined, fueleconomy.gov
--   range_mi   → EPA combined range, fueleconomy.gov (via insideevs.com, greencarreports.com)
--   used_price → CarGurus Price Trends, cargurus.com/research/price-trends/

CREATE TABLE IF NOT EXISTS vehicle_models (
  id           SERIAL PRIMARY KEY,
  type         TEXT           NOT NULL CHECK (type IN ('ev', 'gas')),
  make         TEXT           NOT NULL,
  model        TEXT           NOT NULL,
  year         SMALLINT       NOT NULL,
  msrp         INTEGER,
  mi_per_kwh   NUMERIC(4,2),
  mpg          SMALLINT,
  range_mi     SMALLINT,
  used_price   INTEGER,
  discontinued BOOLEAN        NOT NULL DEFAULT false,
  UNIQUE (make, model, year)
);

ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read vehicle_models" ON vehicle_models FOR SELECT USING (true);

-- ── Seed data ─────────────────────────────────────────────────────────────────────
-- msrp only on the most recent year row; older rows leave it null (used-car purchase only)
-- mi_per_kwh / mpg repeated per row — per-year EPA data not available for historical years

INSERT INTO vehicle_models (type, make, model, year, msrp, mi_per_kwh, range_mi, used_price, discontinued) VALUES

-- ── Tesla Model 3 ── CarGurus d2475; EPA 25 kWh/100mi LR RWD; tesla.com 2025 $38,630
  ('ev', 'Tesla', 'Model 3', 2019, NULL,   4.0, 325, 20800, false),
  ('ev', 'Tesla', 'Model 3', 2020, NULL,   4.0, 326, 22600, false),
  ('ev', 'Tesla', 'Model 3', 2021, NULL,   4.0, 358, 23700, false),
  ('ev', 'Tesla', 'Model 3', 2022, NULL,   4.0, 358, 26000, false),
  ('ev', 'Tesla', 'Model 3', 2023, NULL,   4.0, 333, 27800, false),
  ('ev', 'Tesla', 'Model 3', 2024, 38630,  4.0, 342, 36500, false),

-- ── Tesla Model Y ── CarGurus d3044; EPA 28 kWh/100mi LR AWD; tesla.com 2025 $41,630
  ('ev', 'Tesla', 'Model Y', 2020, NULL,   3.5, 316, 25300, false),
  ('ev', 'Tesla', 'Model Y', 2021, NULL,   3.5, 326, 27300, false),
  ('ev', 'Tesla', 'Model Y', 2022, NULL,   3.5, 330, 30300, false),
  ('ev', 'Tesla', 'Model Y', 2023, NULL,   3.5, 330, 33600, false),
  ('ev', 'Tesla', 'Model Y', 2024, 41630,  3.5, 310, 36800, false),

-- ── Tesla Model S ── CarGurus d2039; EPA 27 kWh/100mi (124 MPGe) std; tesla.com 2025 $79,990
  ('ev', 'Tesla', 'Model S', 2019, NULL,   3.7, 370, 29800, false),
  ('ev', 'Tesla', 'Model S', 2020, NULL,   3.7, 402, 32300, false),
  ('ev', 'Tesla', 'Model S', 2021, NULL,   3.7, 405, 46400, false),
  ('ev', 'Tesla', 'Model S', 2022, NULL,   3.7, 405, 48900, false),
  ('ev', 'Tesla', 'Model S', 2023, 79990,  3.7, 405, 57000, false),

-- ── Tesla Model X ── CarGurus d2132; EPA 34 kWh/100mi (98 MPGe) std; tesla.com 2025 $84,990
  ('ev', 'Tesla', 'Model X', 2019, NULL,   2.9, 325, 32700, false),
  ('ev', 'Tesla', 'Model X', 2020, NULL,   2.9, 351, 36100, false),
  ('ev', 'Tesla', 'Model X', 2022, NULL,   2.9, 348, 56700, false),
  ('ev', 'Tesla', 'Model X', 2023, NULL,   2.9, 348, 62600, false),
  ('ev', 'Tesla', 'Model X', 2024, 84990,  2.9, 335, 72900, false),

-- ── Chevy Equinox EV ── CarGurus d3267; EPA 31 kWh/100mi (104 MPGe) FWD; $34,995
  ('ev', 'Chevy', 'Equinox EV', 2024, 34995, 3.2, 319, 27500, false),

-- ── Chevy Bolt EUV ── CarGurus d3116; EPA 29 kWh/100mi; discontinued after 2023
  ('ev', 'Chevy', 'Bolt EUV', 2022, NULL,  3.4, 247, 20600, true),
  ('ev', 'Chevy', 'Bolt EUV', 2023, NULL,  3.4, 247, 21600, true),

-- ── Ford Mustang Mach-E ── CarGurus d2990; EPA ~33 kWh/100mi ER RWD; ford.com 2025 $37,995
  ('ev', 'Ford', 'Mustang Mach-E', 2021, NULL,  3.0, 305, 24000, false),
  ('ev', 'Ford', 'Mustang Mach-E', 2022, NULL,  3.0, 314, 28100, false),
  ('ev', 'Ford', 'Mustang Mach-E', 2023, NULL,  3.0, 303, 33100, false),
  ('ev', 'Ford', 'Mustang Mach-E', 2024, 37995, 3.0, 320, 34600, false),

-- ── Ford F-150 Lightning ── CarGurus d3147; EPA 48 kWh/100mi (66 MPGe) ER 4WD; ford.com 2025 $49,780
  ('ev', 'Ford', 'F-150 Lightning', 2022, NULL,  2.1, 320, 41700, false),
  ('ev', 'Ford', 'F-150 Lightning', 2023, NULL,  2.1, 320, 46300, false),
  ('ev', 'Ford', 'F-150 Lightning', 2024, 49780, 2.1, 320, 50900, false),

-- ── Hyundai Ioniq 5 ── CarGurus d3120; EPA 30 kWh/100mi (114 MPGe) RWD; hyundaiusa.com 2025 $37,000
  ('ev', 'Hyundai', 'Ioniq 5', 2022, NULL,  3.3, 303, 22600, false),
  ('ev', 'Hyundai', 'Ioniq 5', 2023, NULL,  3.3, 303, 28100, false),
  ('ev', 'Hyundai', 'Ioniq 5', 2024, 37000, 3.3, 303, 28400, false),

-- ── Hyundai Ioniq 6 ── CarGurus d3297; EPA 26 kWh/100mi (132 MPGe) LR RWD 18"; $39,095
  ('ev', 'Hyundai', 'Ioniq 6', 2023, NULL,  3.9, 361, 25700, false),
  ('ev', 'Hyundai', 'Ioniq 6', 2024, 39095, 3.9, 361, 25800, false),

-- ── Kia EV6 ── CarGurus d3127; EPA 30 kWh/100mi (114 MPGe) LR RWD; kia.com 2025 $42,900
  ('ev', 'Kia', 'EV6', 2022, NULL,  3.3, 310, 23900, false),
  ('ev', 'Kia', 'EV6', 2023, NULL,  3.3, 310, 28800, false),
  ('ev', 'Kia', 'EV6', 2024, 42900, 3.3, 310, 29800, false),

-- ── Kia EV9 ── EPA ~33 kWh/100mi LR RWD; kia.com 2025 $54,900
  ('ev', 'Kia', 'EV9', 2024, 54900, 3.0, 304, 48000, false),

-- ── Volkswagen ID.4 ── CarGurus d3098; EPA 32 kWh/100mi (104 MPGe) Pro RWD; vw.com 2025 $45,095
  ('ev', 'Volkswagen', 'ID.4', 2021, NULL,  3.1, 260, 19900, false),
  ('ev', 'Volkswagen', 'ID.4', 2022, NULL,  3.1, 275, 22000, false),
  ('ev', 'Volkswagen', 'ID.4', 2023, NULL,  3.1, 275, 24700, false),
  ('ev', 'Volkswagen', 'ID.4', 2024, 45095, 3.1, 291, 25100, false),

-- ── Rivian R1T ── CarGurus d2837; EPA 43 kWh/100mi (79 MPGe) Dual Std 20"; rivian.com 2025 $80,900
  ('ev', 'Rivian', 'R1T', 2022, NULL,  2.3, 314, 52600, false),
  ('ev', 'Rivian', 'R1T', 2023, 80900, 2.3, 352, 57500, false),

-- ── Rivian R1S ── CarGurus d2839; EPA ~44 kWh/100mi; rivian.com 2025 $82,900
  ('ev', 'Rivian', 'R1S', 2023, NULL,  2.3, 352, 65900, false),
  ('ev', 'Rivian', 'R1S', 2024, 82900, 2.3, 400, 72400, false),

-- ── BMW i4 ── CarGurus d3155; EPA 30 kWh/100mi (112 MPGe) eDrive40 18"; bmwusa.com 2025 $57,900
  ('ev', 'BMW', 'i4', 2023, NULL,  3.3, 301, 34500, false),
  ('ev', 'BMW', 'i4', 2024, 57900, 3.3, 301, 39300, false),

-- ── Cadillac Lyriq ── CarGurus d3157; EPA 36 kWh/100mi (92 MPGe) RWD; $58,595
  ('ev', 'Cadillac', 'Lyriq', 2024, 58595, 2.8, 314, 42000, false),

-- ── Honda Prologue ── EPA 33 kWh/100mi (104 MPGe) FWD; $47,400
  ('ev', 'Honda', 'Prologue', 2024, 47400, 3.0, 296, 38000, false),

-- ── Polestar 2 ── CarGurus d3036; EPA 30 kWh/100mi (114 MPGe) SM 19"; polestar.com 2025 $64,800
  ('ev', 'Polestar', '2', 2022, NULL,  3.3, 270, 23700, false),
  ('ev', 'Polestar', '2', 2023, NULL,  3.3, 270, 28600, false),
  ('ev', 'Polestar', '2', 2024, 64800, 3.3, 320, 31700, false),

-- ── Nissan Leaf ── CarGurus d2077; EPA 30 kWh/100mi (111 MPGe) Plus; $28,140
  ('ev', 'Nissan', 'Leaf', 2019, NULL,  3.3, 226, 11200, false),
  ('ev', 'Nissan', 'Leaf', 2023, 28140, 3.3, 212, 17500, false),

-- ── GMC Sierra EV ── EPA 48 kWh/100mi (64 MPGe) Denali; gmc.com 2025 $91,995
  ('ev', 'GMC', 'Sierra EV', 2024, 91995, 2.1, 440, 50000, false),

-- ── Hyundai Ioniq Electric ── CarGurus d2684; EPA ~26 kWh/100mi; discontinued after 2021
  ('ev', 'Hyundai', 'Ioniq Electric', 2017, NULL, 3.8, 124, 11000, true),
  ('ev', 'Hyundai', 'Ioniq Electric', 2018, NULL, 3.8, 124, 12500, true),
  ('ev', 'Hyundai', 'Ioniq Electric', 2019, NULL, 3.8, 124, 13500, true),
  ('ev', 'Hyundai', 'Ioniq Electric', 2020, NULL, 3.8, 170, 15000, true),
  ('ev', 'Hyundai', 'Ioniq Electric', 2021, NULL, 3.8, 170, 15000, true),

-- ── Chevy Bolt EV ── CarGurus d2397; EPA 28 kWh/100mi (118 MPGe); discontinued after 2023
  ('ev', 'Chevy', 'Bolt EV', 2017, NULL, 3.5, 238, 13000, true),
  ('ev', 'Chevy', 'Bolt EV', 2018, NULL, 3.5, 238, 14000, true),
  ('ev', 'Chevy', 'Bolt EV', 2019, NULL, 3.5, 238, 15800, true),
  ('ev', 'Chevy', 'Bolt EV', 2020, NULL, 3.5, 259, 16200, true),
  ('ev', 'Chevy', 'Bolt EV', 2021, NULL, 3.5, 259, 17500, true),
  ('ev', 'Chevy', 'Bolt EV', 2022, NULL, 3.5, 259, 19000, true),
  ('ev', 'Chevy', 'Bolt EV', 2023, NULL, 3.5, 259, 20300, true),

-- ── BMW i3 ── CarGurus d2263; EPA ~31 kWh/100mi avg; discontinued after 2021
  ('ev', 'BMW', 'i3', 2014, NULL, 3.5,  81,  7000, true),
  ('ev', 'BMW', 'i3', 2015, NULL, 3.5,  81,  7500, true),
  ('ev', 'BMW', 'i3', 2016, NULL, 3.5,  81,  8000, true),
  ('ev', 'BMW', 'i3', 2017, NULL, 3.5, 114,  8500, true),
  ('ev', 'BMW', 'i3', 2018, NULL, 3.5, 114,  9000, true),
  ('ev', 'BMW', 'i3', 2019, NULL, 3.5, 153,  9500, true),
  ('ev', 'BMW', 'i3', 2020, NULL, 3.5, 153, 10000, true),
  ('ev', 'BMW', 'i3', 2021, NULL, 3.5, 153, 10500, true)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp         = EXCLUDED.msrp,
  mi_per_kwh   = EXCLUDED.mi_per_kwh,
  range_mi     = EXCLUDED.range_mi,
  used_price   = EXCLUDED.used_price,
  discontinued = EXCLUDED.discontinued;

INSERT INTO vehicle_models (type, make, model, year, msrp, mpg, used_price) VALUES

-- ── Toyota RAV4 ── CarGurus d306; EPA 28/35 → 30 combined; toyota.com 2025 $28,850
  ('gas', 'Toyota', 'RAV4', 2019, NULL,  30, 22900),
  ('gas', 'Toyota', 'RAV4', 2020, NULL,  30, 23700),
  ('gas', 'Toyota', 'RAV4', 2021, NULL,  30, 25000),
  ('gas', 'Toyota', 'RAV4', 2022, NULL,  30, 27900),
  ('gas', 'Toyota', 'RAV4', 2023, NULL,  30, 30300),
  ('gas', 'Toyota', 'RAV4', 2024, 28850, 30, 31100),

-- ── Honda CR-V ── CarGurus d589; EPA 28/34 → 30 combined; honda.com 2025 $30,100
  ('gas', 'Honda', 'CR-V', 2019, NULL,  30, 20900),
  ('gas', 'Honda', 'CR-V', 2020, NULL,  30, 23300),
  ('gas', 'Honda', 'CR-V', 2021, NULL,  30, 24700),
  ('gas', 'Honda', 'CR-V', 2022, NULL,  30, 26900),
  ('gas', 'Honda', 'CR-V', 2023, NULL,  30, 29800),
  ('gas', 'Honda', 'CR-V', 2024, 30100, 30, 31000),

-- ── Toyota Camry ── CarGurus d292; EPA 28/37 → 32 combined; $28,400
  ('gas', 'Toyota', 'Camry', 2019, NULL,  32, 19000),
  ('gas', 'Toyota', 'Camry', 2020, NULL,  32, 20600),
  ('gas', 'Toyota', 'Camry', 2021, NULL,  32, 22100),
  ('gas', 'Toyota', 'Camry', 2022, NULL,  32, 23700),
  ('gas', 'Toyota', 'Camry', 2023, NULL,  32, 25400),
  ('gas', 'Toyota', 'Camry', 2024, 28400, 32, 26600),

-- ── Honda Accord ── CarGurus d585; EPA 29/37 → 32 combined; $28,750
  ('gas', 'Honda', 'Accord', 2019, NULL,  32, 19300),
  ('gas', 'Honda', 'Accord', 2020, NULL,  32, 20700),
  ('gas', 'Honda', 'Accord', 2021, NULL,  32, 22300),
  ('gas', 'Honda', 'Accord', 2022, NULL,  32, 24700),
  ('gas', 'Honda', 'Accord', 2023, NULL,  32, 24600),
  ('gas', 'Honda', 'Accord', 2024, 28750, 32, 25500),

-- ── Toyota Corolla ── CarGurus d295; EPA 32/40 → 35 combined; $22,050
  ('gas', 'Toyota', 'Corolla', 2019, NULL,  35, 14700),
  ('gas', 'Toyota', 'Corolla', 2020, NULL,  35, 16500),
  ('gas', 'Toyota', 'Corolla', 2021, NULL,  35, 17300),
  ('gas', 'Toyota', 'Corolla', 2022, NULL,  35, 19000),
  ('gas', 'Toyota', 'Corolla', 2023, NULL,  35, 20700),
  ('gas', 'Toyota', 'Corolla', 2024, 22050, 35, 21400),

-- ── Honda Civic ── CarGurus d586; EPA 32/41 → 36 combined; $24,950
  ('gas', 'Honda', 'Civic', 2019, NULL,  36, 17800),
  ('gas', 'Honda', 'Civic', 2020, NULL,  36, 19000),
  ('gas', 'Honda', 'Civic', 2021, NULL,  36, 19700),
  ('gas', 'Honda', 'Civic', 2022, NULL,  36, 22500),
  ('gas', 'Honda', 'Civic', 2023, NULL,  36, 24600),
  ('gas', 'Honda', 'Civic', 2024, 24950, 36, 25400),

-- ── Mazda CX-5 ── CarGurus d2133; EPA 25/31 → 27 combined FWD; $28,850
  ('gas', 'Mazda', 'CX-5', 2019, NULL,  27, 19300),
  ('gas', 'Mazda', 'CX-5', 2020, NULL,  27, 20200),
  ('gas', 'Mazda', 'CX-5', 2021, NULL,  27, 22000),
  ('gas', 'Mazda', 'CX-5', 2022, NULL,  27, 24200),
  ('gas', 'Mazda', 'CX-5', 2023, NULL,  27, 25900),
  ('gas', 'Mazda', 'CX-5', 2024, 28850, 27, 26600),

-- ── Ford F-150 ── CarGurus d337; EPA 20/26 avg; ford.com 2025 XL 2WD $41,405
  ('gas', 'Ford', 'F-150', 2019, NULL,  20, 26900),
  ('gas', 'Ford', 'F-150', 2020, NULL,  20, 29600),
  ('gas', 'Ford', 'F-150', 2021, NULL,  20, 34200),
  ('gas', 'Ford', 'F-150', 2022, NULL,  20, 39200),
  ('gas', 'Ford', 'F-150', 2023, NULL,  20, 44100),
  ('gas', 'Ford', 'F-150', 2024, 41405, 20, 48800),

-- ── Chevy Silverado 1500 ── CarGurus d630; EPA 18/24 → 20 combined (4.3L V6 4x2); $37,600
  ('gas', 'Chevy', 'Silverado 1500', 2019, NULL,  20, 27300),
  ('gas', 'Chevy', 'Silverado 1500', 2020, NULL,  20, 29400),
  ('gas', 'Chevy', 'Silverado 1500', 2021, NULL,  20, 32200),
  ('gas', 'Chevy', 'Silverado 1500', 2022, NULL,  20, 36000),
  ('gas', 'Chevy', 'Silverado 1500', 2023, NULL,  20, 40100),
  ('gas', 'Chevy', 'Silverado 1500', 2024, 37600, 20, 44400),

-- ── Toyota Tacoma ── CarGurus d311; EPA 20/26 → 22 combined (2WD non-hybrid); $31,500
  ('gas', 'Toyota', 'Tacoma', 2019, NULL,  22, 29800),
  ('gas', 'Toyota', 'Tacoma', 2020, NULL,  22, 31800),
  ('gas', 'Toyota', 'Tacoma', 2021, NULL,  22, 33200),
  ('gas', 'Toyota', 'Tacoma', 2022, NULL,  22, 34100),
  ('gas', 'Toyota', 'Tacoma', 2023, NULL,  22, 37400),
  ('gas', 'Toyota', 'Tacoma', 2024, 31500, 22, 39200),

-- ── Chevy Equinox ── CarGurus d616; EPA 26/34 → 30 combined (1.5L FWD); $28,000
  ('gas', 'Chevy', 'Equinox', 2019, NULL,  30, 14800),
  ('gas', 'Chevy', 'Equinox', 2020, NULL,  30, 16000),
  ('gas', 'Chevy', 'Equinox', 2021, NULL,  30, 17300),
  ('gas', 'Chevy', 'Equinox', 2022, NULL,  30, 20200),
  ('gas', 'Chevy', 'Equinox', 2023, NULL,  30, 22500),
  ('gas', 'Chevy', 'Equinox', 2024, 28000, 30, 23700),

-- ── Ford Explorer ── CarGurus d334; EPA 21/29 → 24 combined RWD; $37,650
  ('gas', 'Ford', 'Explorer', 2019, NULL,  24, 18000),
  ('gas', 'Ford', 'Explorer', 2020, NULL,  24, 22900),
  ('gas', 'Ford', 'Explorer', 2021, NULL,  24, 24900),
  ('gas', 'Ford', 'Explorer', 2022, NULL,  24, 29400),
  ('gas', 'Ford', 'Explorer', 2023, NULL,  24, 33300),
  ('gas', 'Ford', 'Explorer', 2024, 37650, 24, 35800),

-- ── Toyota Highlander ── CarGurus d298; EPA 21/29 → 24 combined FWD; $38,005
  ('gas', 'Toyota', 'Highlander', 2019, NULL,  24, 24400),
  ('gas', 'Toyota', 'Highlander', 2020, NULL,  24, 28400),
  ('gas', 'Toyota', 'Highlander', 2021, NULL,  24, 30500),
  ('gas', 'Toyota', 'Highlander', 2022, NULL,  24, 33700),
  ('gas', 'Toyota', 'Highlander', 2023, NULL,  24, 36400),
  ('gas', 'Toyota', 'Highlander', 2024, 38005, 24, 39200),

-- ── BMW 3 Series ── CarGurus d1512; EPA 25/33 → 28 combined (330i RWD); $43,800
  ('gas', 'BMW', '3 Series', 2019, NULL,  28, 20800),
  ('gas', 'BMW', '3 Series', 2020, NULL,  28, 23800),
  ('gas', 'BMW', '3 Series', 2021, NULL,  28, 26400),
  ('gas', 'BMW', '3 Series', 2022, NULL,  28, 29900),
  ('gas', 'BMW', '3 Series', 2023, NULL,  28, 35600),
  ('gas', 'BMW', '3 Series', 2024, 43800, 28, 38000),

-- ── Toyota Tundra ── CarGurus d313; EPA 14/19 → 18 combined (V8 non-hybrid); $38,555
  ('gas', 'Toyota', 'Tundra', 2019, NULL,  18, 35100),
  ('gas', 'Toyota', 'Tundra', 2020, NULL,  18, 37600),
  ('gas', 'Toyota', 'Tundra', 2021, NULL,  18, 39800),
  ('gas', 'Toyota', 'Tundra', 2022, NULL,  18, 40400),
  ('gas', 'Toyota', 'Tundra', 2023, NULL,  18, 44800),
  ('gas', 'Toyota', 'Tundra', 2024, 38555, 18, 47300)

ON CONFLICT (make, model, year) DO UPDATE SET
  msrp       = EXCLUDED.msrp,
  mpg        = EXCLUDED.mpg,
  used_price = EXCLUDED.used_price;
