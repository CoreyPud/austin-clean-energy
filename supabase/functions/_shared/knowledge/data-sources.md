# Data Sources Configuration
Last Updated: 2025-10-22

## Overview
This file defines the external data sources used by the recommendation engine. Each source includes API endpoints, data interpretation guidelines, and fallback behavior.

## Austin Open Data Portal

### Solar Permits
**API Endpoint:** `https://data.austintexas.gov/resource/3syk-w9eu.json`  
**Dataset Page:** https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu  
**Purpose:** Track solar installation activity by ZIP code and neighborhood  
**Update Frequency:** Updated daily by the City of Austin  
**Key Fields:**
- `issued_date`: When permit was issued
- `completed_date`: When installation was completed  
- `original_zip`: Location of installation
- `work_class`: Type of work (filter for "Auxiliary Power" for solar)
- `permit_type_desc`: Usually "Electrical Permit" with `work_class='Auxiliary Power'`
- `latitude`, `longitude`: Location coordinates

**Filter Parameters:**
- `work_class=Auxiliary Power` (isolates solar from other electrical work)
- `$where=issued_date >= '2020-01-01'` (recent installations, past 5 years)

**Interpretation:**
- **High activity (>50 permits/ZIP in past year):** "This area has strong solar adoption"
- **Medium activity (20-50 permits/ZIP):** "Growing solar interest in this area"
- **Low activity (<20 permits/ZIP):** "Solar is just beginning in this area" or "Opportunity to be an early adopter"

**Fallback:** If API unavailable, use generic language: "Solar installations are growing across Austin"

### Energy Audits (Single-Family)
**API Endpoint:** `https://data.austintexas.gov/resource/tk9p-m8c7.json`  
**Dataset Page:** https://data.austintexas.gov/Utilities-and-City-Services/Austin-Energy-Single-Family-Audits/tk9p-m8c7/about_data  
**Purpose:** Track participation in the Austin Energy single-family audit program  
**Update Frequency:** Updated periodically by Austin Energy  
**Key Fields:**
- `zip_code`: Where audit was conducted
- `year`: Year of audit
- Counts of audits and recommended measures

**Interpretation:**
- **High audit activity:** Indicates community awareness of efficiency programs
- **Low audit activity:** Opportunity to promote the free audit program

**Fallback:** Always recommend energy audits; API data just adds context. (Note: this dataset is not currently surfaced as a metric in the UI — it is only used as background context for recommendations.)

### Weatherization & Green Buildings
The City of Austin previously published separate datasets for weatherization
projects and Austin Energy Green Building certifications. Those endpoints are
no longer available on the open data portal, so the recommendation engine no
longer queries them. When the city republishes these datasets, add them back
here with the new resource IDs and link to their dataset pages.

For program information, link users to:
- **Weatherization Assistance Program:** https://austinenergy.com/energy-efficiency
- **Austin Energy Green Building:** https://austinenergy.com/energy-efficiency/green-building

## Google APIs

### Geocoding API
**Purpose:** Convert addresses to coordinates and standardized format  
**Endpoint:** `https://maps.googleapis.com/maps/api/geocode/json`  
**Required:** API key in `GOOGLE_SOLAR_API_KEY` secret  
**Rate Limits:** 40,000 requests/day (free tier)

**Response Fields Used:**
- `formatted_address`: Standardized address
- `geometry.location.lat`, `geometry.location.lng`: Coordinates
- `address_components[postal_code]`: Extracted ZIP code

**Error Handling:**
- Invalid address → Return clear error message to user
- Rate limit exceeded → Graceful degradation, skip address-specific features

### Solar API
**Purpose:** Analyze solar potential of specific properties  
**Endpoint:** `https://solar.googleapis.com/v1/buildingInsights:findClosest`  
**Required:** API key in `GOOGLE_SOLAR_API_KEY` secret  
**Rate Limits:** 1,000 requests/day (check current quota)

**Response Fields Used:**
- `solarPotential.maxArrayPanelsCount`: Max panels that fit on roof
- `solarPotential.maxArrayAreaMeters2`: Usable roof area  
- `solarPotential.maxSunshineHoursPerYear`: Annual sun exposure
- `solarPotential.carbonOffsetFactorKgPerMwh`: Local grid carbon intensity
- `solarPotential.financialAnalyses`: Array of financial scenarios (20-year savings projections)

**Interpretation:**
- `maxArrayPanelsCount > 15`: "Excellent solar potential"
- `maxArrayPanelsCount 10-15`: "Good solar potential"
- `maxArrayPanelsCount < 10`: "Limited roof space, consider community solar"
- `maxSunshineHoursPerYear > 1600`: "Excellent sun exposure" (Austin average)

**Fallback:**
- If API unavailable or property not found, use Austin averages:
  - Average system size: 20 panels, 7kW
  - Average annual production: 10,000 kWh
  - Average savings: $1,200/year

## Data Quality Considerations

### Known Limitations
1. **Solar Permit Data:**
   - Some commercial permits included; filter by `work_class`
   - Historical data complete only from 2015 onward
   - Doesn't distinguish system size (all permits counted equally)

2. **Google Solar API:**
   - Coverage not complete in all areas (rural gaps)
   - Imagery may be outdated (1-3 years)
   - Doesn't account for tree growth since imagery taken

3. **Energy Audit Data:**
   - Includes only Austin Energy customers (not all residents)
   - May lag by 1-2 quarters

### Data Validation Rules
- **Solar permits:** Filter out `issue_date` before 2015 (data quality issues)
- **Coordinates:** Validate latitude/longitude in Austin bounds (30.0-30.6°N, 97.5-98.0°W)
- **ZIP codes:** Validate against known Austin ZIP codes
- **Outliers:** Cap extremely high values that suggest data errors

### Caching Strategy
- **Static context (priorities, resources):** Load once at function startup
- **API data:** Cache for the request duration only (don't persist)
- **Google API results:** No caching (Terms of Service restriction)

## Adding New Data Sources

When adding a new data source to this configuration:

1. **Document the source:**
   - API endpoint and authentication requirements
   - Update frequency and data latency
   - Key fields and their meanings

2. **Define interpretation rules:**
   - What counts as "high" vs "low" activity?
   - How should the data influence recommendations?

3. **Specify fallback behavior:**
   - What happens if API is unavailable?
   - Can recommendations still be useful?

4. **Test thoroughly:**
   - Handle missing fields gracefully
   - Validate data makes sense
   - Check rate limits

5. **Update edge functions:**
   - Import and use the data source
   - Handle errors appropriately
   - Log usage for monitoring

## API Key Management

Current secrets required:
- `GOOGLE_SOLAR_API_KEY`: For Geocoding and Solar APIs (same key used for both)

To rotate keys:
1. Generate new API key in Google Cloud Console
2. Update secret in Supabase dashboard
3. Test that new key works before revoking old key
4. Revoke old key

## Monitoring and Alerts

Recommended monitoring:
- **API availability:** Log when API calls fail
- **Rate limits:** Track approaching quota limits
- **Data freshness:** Alert if Austin data hasn't updated in 90+ days
- **Error rates:** Alert if >5% of requests fail

## Update Guidelines

Update this file when:
- Adding new data sources
- API endpoints change
- Interpretation thresholds change based on new data
- Known limitations are discovered
- New secrets/credentials are required
