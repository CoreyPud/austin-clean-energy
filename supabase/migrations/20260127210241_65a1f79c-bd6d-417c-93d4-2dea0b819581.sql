-- Create table to store knowledge base content
CREATE TABLE public.knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  content text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text
);

-- Enable RLS
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Anyone can read knowledge files
CREATE POLICY "Anyone can read knowledge files"
  ON public.knowledge_files
  FOR SELECT
  USING (true);

-- Insert initial content from the existing markdown files
INSERT INTO public.knowledge_files (name, content) VALUES
('priorities', '# Clean Energy Priority Framework
Last Updated: 2025-10-22

## Overview
This framework guides AI recommendations based on individual climate impact potential. Rankings are based on Project Drawdown research and IPCC findings, adapted for Austin, Texas context.

## Priority Rankings

### 1. Transportation Electrification
**Impact Score:** 9/10  
**Annual CO₂ Reduction:** 4-6 tons per vehicle  
**Rationale:** Electric vehicles eliminate the largest source of individual carbon emissions.

### 2. Zero-Carbon Home Power (Solar + Clean Grid)
**Impact Score:** 8/10  
**Annual CO₂ Reduction:** 3-5 tons per household

### 3. Home Energy Efficiency
**Impact Score:** 7/10  
**Annual CO₂ Reduction:** 1-3 tons per household

### 4. Sustainable Transportation Options
**Impact Score:** 6/10  
**Annual CO₂ Reduction:** 1-4 tons depending on mode shift

### 5. Dietary Changes (Plant-Rich Diet)
**Impact Score:** 5/10  
**Annual CO₂ Reduction:** 0.5-2 tons depending on current diet

### 6. Waste Reduction and Recycling
**Impact Score:** 4/10  
**Annual CO₂ Reduction:** 0.5-1.5 tons per household

### 7. Water Conservation
**Impact Score:** 3/10  
**Annual CO₂ Reduction:** 0.2-0.8 tons per household

### 8. Green Building and Renovation
**Impact Score:** 7/10 (for new construction/major renovation)  
**Annual CO₂ Reduction:** 2-4 tons per household'),

('resources', '# Austin Clean Energy Resources
Last Updated: 2025-10-22

## Solar Programs

### Austin Energy Solar Solutions
**URL:** https://austinenergy.com/solar  
**Description:** Comprehensive solar program information

### Solar Rebate Program
**URL:** https://austinenergy.com/rebates/solar  
**Incentive:** Up to $2,500 for residential solar installations

### Federal Solar Investment Tax Credit (ITC)
**URL:** https://www.energy.gov/eere/solar/homeowners-guide-federal-tax-credit-solar-photovoltaics  
**Incentive:** 30% tax credit on solar installation costs

## Energy Efficiency

### Free Home Energy Audit
**URL:** https://austinenergy.com/energy-efficiency/home-energy-audit  
**Cost:** Free for Austin Energy customers

### Austin Energy Power Saver Program
**URL:** https://austinenergy.com/rebates  
**Incentives:** Rebates for AC systems, insulation, air sealing, smart thermostats

## Electric Vehicles

### Austin Energy EV Charging Program
**URL:** https://austinenergy.com/ev  
**Rebates:** Up to $1,200 for home Level 2 charger installation

### Federal EV Tax Credit
**URL:** https://fueleconomy.gov/feg/taxevb.shtml  
**Incentive:** Up to $7,500 for new EVs, $4,000 for used EVs'),

('expert-context', '# Expert Context for Recommendations
Last Updated: 2025-10-22

## Current Policy Landscape

### Federal Incentives (Inflation Reduction Act)
- 30% solar tax credit through 2032
- EV tax credits up to $7,500 new, $4,000 used
- Heat pump and efficiency rebates

### Austin Local Context
- Austin Energy renewable portfolio growing
- Strong solar adoption rates
- Hot climate prioritizes cooling efficiency

## Research Insights

### Project Drawdown Rankings
Transportation and building energy are top individual impact areas.

### IPCC Guidance
Individual actions matter when scaled across communities.'),

('data-sources', '# Data Sources Configuration
Last Updated: 2025-10-22

## Primary Data Sources

### City of Austin Permit API
**Endpoint:** City open data portal  
**Fields:** permit_id, address, kW, dates, contractor  
**Update Frequency:** Daily

### Austin Energy PIR Data
**Source:** Manual imports from utility records  
**Fields:** system_kw, interconnection_date, address  
**Update Frequency:** Monthly

## Data Processing Rules

### Address Normalization
- Standardize street suffixes (ST, AVE, DR)
- Remove unit numbers for matching
- Uppercase all addresses

### Deduplication
- Match on project_id for City permits
- Match on address + date for PIR records');