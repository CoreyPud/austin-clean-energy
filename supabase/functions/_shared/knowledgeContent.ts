// Embedded knowledge base content to avoid filesystem reads in Edge Functions
// This ensures the content is bundled at build time and available at runtime.

export const prioritiesContent = `# Clean Energy Priority Framework
Last Updated: 2025-10-22

## Overview
This framework guides AI recommendations based on individual climate impact potential. Rankings are based on Project Drawdown research and IPCC findings, adapted for Austin, Texas context.

## Priority Rankings

### 1. Transportation Electrification
**Impact Score:** 9/10  
**Annual CO₂ Reduction:** 4-6 tons per vehicle  
**Rationale:** Electric vehicles eliminate the largest source of individual carbon emissions. The average driver produces 4.6 tons of CO₂ annually from gasoline combustion. EVs powered by Austin's grid (which is increasingly renewable) eliminate these emissions entirely.  
**Austin Context:** Growing charging infrastructure, Austin Energy EV rates available, multiple federal and state incentives active.  
**Key Barriers:** Upfront cost, charging access for renters, range anxiety  
**Current Incentives:** Federal EV tax credit up to $7,500, Austin Energy rebates for home charging equipment

### 2. Zero-Carbon Home Power (Solar + Clean Grid)
**Impact Score:** 8/10  
**Annual CO₂ Reduction:** 3-5 tons per household  
**Rationale:** Residential solar combined with clean grid electricity eliminates home energy emissions. Austin Energy's grid is moving toward renewable sources, making this increasingly effective.  
**Austin Context:** Excellent solar conditions (235+ sunny days/year), Austin Energy solar buyback program, 30% federal ITC still available  
**Key Barriers:** Roof condition/ownership, HOA restrictions, upfront costs  
**Current Incentives:** 30% federal solar tax credit, Austin Energy solar rebates up to $2,500

### 3. Home Energy Efficiency
**Impact Score:** 7/10  
**Annual CO₂ Reduction:** 1-3 tons per household  
**Rationale:** Reducing energy consumption through efficiency measures (insulation, air sealing, efficient HVAC) prevents emissions and saves money. In Austin's climate, AC efficiency is critical.  
**Austin Context:** Hot climate makes cooling efficiency especially impactful, free home energy audits available, weatherization assistance for qualifying households  
**Key Barriers:** Lack of awareness, upfront investment, difficulty finding qualified contractors  
**Current Incentives:** Free energy audits, Austin Energy rebates for AC/insulation upgrades, weatherization grants for low-income households

### 4. Sustainable Transportation Options
**Impact Score:** 6/10  
**Annual CO₂ Reduction:** 1-4 tons depending on mode shift  
**Rationale:** Biking, transit, carpooling, and telecommuting reduce vehicle miles traveled. Impact varies greatly based on baseline commute distance and frequency.  
**Austin Context:** Expanding bike infrastructure, CapMetro transit system, growing remote work culture  
**Key Barriers:** Limited transit coverage, hot climate, car-centric city design  
**Current Incentives:** Free CapMetro employer programs, bike-share subsidies, HOV lane access for carpools

### 5. Dietary Changes (Plant-Rich Diet)
**Impact Score:** 5/10  
**Annual CO₂ Reduction:** 0.5-2 tons depending on current diet  
**Rationale:** Food production, especially meat and dairy, creates significant emissions. Shifting toward plant-rich diets reduces agricultural emissions and land use.  
**Austin Context:** Strong local food culture, farmers markets, growing plant-based restaurant scene  
**Key Barriers:** Cultural habits, taste preferences, nutritional concerns, cost perception  
**Current Incentives:** None directly, but local food co-ops and farmers markets make sustainable food accessible

### 6. Waste Reduction and Recycling
**Impact Score:** 4/10  
**Annual CO₂ Reduction:** 0.5-1.5 tons per household  
**Rationale:** Reducing consumption, reusing items, and proper recycling prevent manufacturing emissions and methane from landfills. Composting organic waste is particularly impactful.  
**Austin Context:** Strong zero-waste initiatives, composting programs, repair/reuse culture  
**Key Barriers:** Convenience, lack of access to recycling/composting, confusion about what's recyclable  
**Current Incentives:** Free curbside composting in some areas, City recycling programs, repair cafes

### 7. Water Conservation
**Impact Score:** 3/10  
**Annual CO₂ Reduction:** 0.2-0.8 tons per household  
**Rationale:** Water treatment and heating consume energy. Conservation reduces both. In drought-prone Austin, water efficiency is critical for resilience beyond climate impact.  
**Austin Context:** Frequent drought conditions, water restrictions common, Austin Water rebate programs  
**Key Barriers:** Habit change, upfront costs for efficient fixtures, lack of visibility into water use  
**Current Incentives:** Austin Water rebates for efficient fixtures, free water audits, rainwater harvesting incentives

### 8. Green Building and Renovation
**Impact Score:** 7/10 (for new construction/major renovation)  
**Annual CO₂ Reduction:** 2-4 tons per household  
**Rationale:** Energy-efficient design, sustainable materials, and passive strategies create long-term emissions reductions. Most impactful when building new or doing major renovations.  
**Austin Context:** Austin Energy Green Building program well-established, growing green building industry  
**Key Barriers:** Higher upfront costs, finding qualified builders, design complexity  
**Current Incentives:** Austin Energy Green Building incentives, faster permitting for green builds, property tax exemptions for solar

## Geographic Context
Austin, Texas specific factors:
- **Climate:** Hot summers (cooling-dominated), mild winters
- **Grid:** Austin Energy moving toward renewables (40%+ renewable in 2024)
- **Transportation:** Car-dependent city with growing bike/transit infrastructure
- **Housing:** Mix of older homes needing efficiency upgrades and new development
- **Policy:** Relatively progressive climate policies, strong renewable energy goals

## Update Guidelines
When updating this framework:
1. Cite sources for impact estimates (use peer-reviewed research)
2. Update "Current Incentives" section quarterly (check Austin Energy, federal programs)
3. Adjust scores based on new research or local grid changes
4. Keep "Austin Context" section current with infrastructure and policy changes
5. Note the last updated date at the top`;

export const resourcesContent = `# Austin Clean Energy Resources
Last Updated: 2025-10-22

## Solar Programs

### Austin Energy Solar Solutions
**URL:** https://austinenergy.com/solar  
**Description:** Comprehensive solar program information and interconnection process  
**Target Audience:** Homeowners, businesses considering solar installation

### Solar Rebate Program
**URL:** https://austinenergy.com/rebates/solar  
**Incentive:** Up to $2,500 for residential solar installations  
**Eligibility:** Austin Energy customers installing new solar systems  
**Notes:** Rebate amounts vary by system size; combine with federal tax credit for maximum savings

### Community Solar
**URL:** https://austinenergy.com/community-solar  
**Description:** Solar access for renters and those with unsuitable roofs  
**Incentive:** Subscribe to solar credits without rooftop installation  
**Target Audience:** Renters, condo owners, homes with shaded/unsuitable roofs

### Federal Solar Investment Tax Credit (ITC)
**URL:** https://www.energy.gov/eere/solar/homeowners-guide-federal-tax-credit-solar-photovoltaics  
**Incentive:** 30% tax credit on solar installation costs  
**Eligibility:** All US taxpayers who own their solar system  
**Valid Through:** 30% credit available through 2032

## Energy Efficiency

### Rewiring America FAQs
**URL:** https://homes.rewiringamerica.org/federal-incentives/faqs

**Description:** Common questions about the Federal Tax Incentives

**Use Case:** Answer questions that people have about how to take advantage of the tax incentives before Jan 1, 2025

### Free Home Energy Audit
**URL:** https://austinenergy.com/energy-efficiency/home-energy-audit  
**Service:** Professional assessment of home energy use with personalized recommendations  
**Cost:** Free for Austin Energy customers  
**Value:** Typically identifies $300-800 in annual savings opportunities

### Austin Energy Power Saver Program
**URL:** https://austinenergy.com/rebates  
**Incentives:** Rebates for AC systems, insulation, air sealing, smart thermostats  
**Amounts:** Varies by measure; up to $1,200 for AC replacement, $500 for insulation  
**Eligibility:** Austin Energy customers

### Weatherization Assistance Program
**URL:** https://www.austintexas.gov/department/weatherization  
**Service:** Free home weatherization for income-qualified households  
**Includes:** Insulation, air sealing, AC repair/replacement, LED lighting  
**Eligibility:** Income at or below 200% of federal poverty level

### ENERGY STAR Product Finder
**URL:** https://www.energystar.gov/products  
**Description:** Database of efficient appliances and equipment  
**Use Case:** Research efficient replacements for aging appliances

## Electric Vehicles

### Austin Energy EV Charging Program
**URL:** https://austinenergy.com/ev  
**Services:** Home charging rebates, special EV electricity rates, public charging map  
**Rebates:** Up to $1,200 for home Level 2 charger installation

### Federal EV Tax Credit
**URL:** https://fueleconomy.gov/feg/taxevb.shtml  
**Incentive:** Up to $7,500 for new EVs, $4,000 for used EVs  
**Eligibility:** Income limits apply; vehicle must meet criteria  
**Notes:** Check vehicle eligibility before purchase

### CapMetro Electric Bus Program
**URL:** https://www.capmetro.org/electric-buses  
**Description:** Transit system transitioning to electric buses  
**Relevance:** Demonstrates city commitment to transportation electrification

### Plug-In Austin Map
**URL:** https://pluginaustin.com/charging-stations  
**Service:** Public EV charging station map  
**Use Case:** Plan charging for EVs, assess charging access before purchase

## Transportation Alternatives

### CapMetro Public Transit
**URL:** https://www.capmetro.org  
**Services:** Bus and rail service, employer programs, reduced fare options  
**Incentives:** Free employer transit passes, reduced fares for low-income riders

### Austin BCycle Bike Share
**URL:** https://austin.bcycle.com  
**Service:** Bike-share system with 75+ stations  
**Cost:** Various pass options from single rides to annual memberships  
**Subsidies:** Reduced memberships for low-income residents

### Austin Bike Infrastructure Map
**URL:** https://austintexas.gov/bicycle  
**Resource:** Map of bike lanes, trails, and planned infrastructure  
**Use Case:** Plan bike commute routes, assess biking feasibility

### Commute Solutions
**URL:** https://www.capmetro.org/commutesolutions  
**Services:** Carpool matching, vanpool subsidies, telework resources, employer programs  
**Target Audience:** Employers and commuters looking for alternatives to solo driving

## Green Building

### Austin Energy Green Building Program
**URL:** https://austinenergy.com/green-building  
**Services:** Technical assistance, ratings, incentives for green construction/renovation  
**Incentives:** Rebates up to $10,000+ for certified green buildings  
**Ratings:** 1-star to 5-star certification system

### Sustainable Materials Library
**URL:** https://sxsw.eco/sustainable-materials  
**Resource:** Information on low-carbon building materials available locally  
**Target Audience:** Builders, architects, homeowners planning renovations

## Financial Assistance

### Property Assessed Clean Energy (PACE) Financing
**URL:** https://comptroller.texas.gov/economy/economic-development/pace  
**Service:** Financing for energy efficiency and renewable energy improvements  
**Terms:** Repaid through property tax bills, can be 20-year terms  
**Eligibility:** Property owners; program availability varies by county

### Austin Community Solar Credits
**URL:** https://austinenergy.com/community-solar  
**Benefit:** Monthly bill credits for community solar subscriptions  
**Use Case:** Solar benefits without installation for renters/unsuitable properties

## Education and Advocacy

### Austin Climate Action Plan
**URL:** https://www.austintexas.gov/department/austin-climate-action-plan  
**Resource:** City's roadmap to net-zero emissions  
**Use Case:** Understand city priorities and how individual actions align

### Environment Texas
**URL:** https://environmenttexas.org/austin  
**Organization:** Local environmental advocacy group  
**Activities:** Policy advocacy, educational events, volunteer opportunities

### Sustainable Food Center
**URL:** https://sustainablefoodcenter.org  
**Services:** Farmers markets, gardening education, food access programs  
**Relevance:** Supports local food systems and sustainable agriculture

### Austin Resource Recovery
**URL:** https://www.austintexas.gov/department/austin-resource-recovery  
**Services:** Recycling, composting, hazardous waste disposal information  
**Programs:** Free compost, electronics recycling events, repair initiatives

## How to Use This Resource List

**For AI Recommendations:**
- Link to specific programs based on user's lifestyle data and priorities
- Include current incentive amounts in financial analyses
- Direct users to audit/assessment programs before major purchases
- Suggest free resources first (audits, education) before paid solutions

**For Updates:**
- Check incentive amounts quarterly (especially Austin Energy rebates)
- Verify all URLs are still active (monthly)
- Add new programs as they launch
- Archive outdated programs in a separate section with "No longer available" notes
- Update the "Last Updated" date at top when changes are made

**Update Sources:**
- Austin Energy website (austinenergy.com)
- City of Austin announcements (austintexas.gov)
- CapMetro website (capmetro.org)
- Federal programs (energy.gov, fueleconomy.gov)
- Local sustainability organizations`;

export const expertContextContent = `# Expert Knowledge & Best Practices
Last Updated: 2025-10-22

## Current Policy Context

### Federal Incentives (2024-2025)
- **Inflation Reduction Act (IRA)** continues through 2030s, providing stable incentives
- **Solar ITC:** 30% through 2032, then steps down to 26% (2033), 22% (2034)
- **EV Tax Credits:** $7,500 for new EVs, $4,000 for used; income caps and sourcing requirements apply
- **Energy Efficiency Rebates (HOMES Program):** Up to $8,000 for whole-home retrofits based on energy savings

### Texas State Context
- **No state renewable energy tax credits** (unlike many states)
- **Property tax exemptions** available for solar installations
- **PACE financing** available in some counties for energy improvements
- **Deregulated electricity market** in most of Texas, but Austin is an exception with municipal utility (Austin Energy)

### Austin-Specific Developments
- **Austin Energy Grid:** Moving toward 100% carbon-free by 2035 goal
- **Current renewable mix:** ~40% renewable (solar, wind), increasing annually
- **Climate Equity Plan:** Focus on underserved communities, environmental justice
- **Zero-Waste Goal:** 75% diversion from landfills by 2030
- **Transportation:** Project Connect transit expansion underway

## Research-Based Recommendations

### Transportation Electrification
**Latest Findings:**
- EVs now reach cost parity with gas vehicles by year 3-5 of ownership when including fuel/maintenance savings
- Charging at home costs 60-70% less than gasoline per mile
- Battery technology improving rapidly: 300+ mile range now standard, degradation minimal (<10% after 10 years)
- Used EV market growing: 2019-2021 models now available $15k-25k with 150k+ mile battery warranties

**Best Practices:**
- Recommend Level 2 home charger for daily charging (240V)
- For renters: assess workplace charging and public network density before purchase
- Right-size vehicle to actual needs (smaller EVs more cost-effective than large SUVs)
- Consider hybrid as bridge if charging access limited

### Solar Energy
**Latest Findings:**
- Solar costs down 70% since 2010; now $2.50-3.50/watt installed in Austin
- Battery storage costs dropping rapidly; Tesla Powerwall and competitors at $10k-15k installed
- Modern panels last 25-30 years with minimal degradation (<1%/year)
- Virtual power plant programs emerging: batteries can earn revenue providing grid services

**Best Practices:**
- Solar pays back in 6-10 years in Austin with current incentives
- Recommend battery storage only for: frequent outages, time-of-use rates, goal of grid independence
- Size system to 100-110% of current usage (not undersized for future EV)
- Must evaluate roof condition first; if re-roofing needed, coordinate timing
- For unsuitable roofs: community solar is viable alternative

### Home Energy Efficiency
**Latest Findings:**
- Air sealing provides highest ROI for efficiency investments (typical $500-1500 investment saves $200-400/year)
- In Austin's climate, AC efficiency and insulation drive 60-70% of energy bills
- Smart thermostats show 10-15% cooling savings on average
- LED lighting now 85% less energy than incandescent, prices dropped below $2/bulb

**Best Practices:**
- Always recommend free energy audit first—professionals identify highest-impact opportunities
- Priority sequence: air sealing → insulation → AC efficiency → windows → appliances
- Don't recommend window replacement for energy alone (20-30 year payback)
- Heat pump water heaters save 50-70% on water heating in Austin climate

### Dietary Impact
**Latest Findings:**
- Beef production creates 20-50x more emissions per calorie than plant-based proteins
- "Meatless Monday" approach (1 day/week plant-based) = 0.3 ton CO₂/year reduction
- Local food claims often overstate climate benefits; what you eat matters far more than where it's from
- Food waste contributes 8% of global emissions; reduction is high-impact

**Best Practices:**
- Frame as "more plants, less beef" rather than strict vegetarian/vegan
- Emphasize co-benefits: health, cost savings ($700-1000/year typical)
- Recommend starting with 1-2 plant-based meals/week
- Connect to Austin's farmers markets and local food culture

## Common Misconceptions to Address

### Solar Myths
❌ "Solar doesn't work on cloudy days"  
✅ Modern panels work in diffuse light; Austin has 235+ sunny days/year anyway

❌ "I'll save money by waiting for better technology"  
✅ Cost of waiting (electricity bills) typically exceeds cost of upgrading later

❌ "Batteries are required for solar to work"  
✅ Grid-tied solar works without batteries; they're optional for backup power

### EV Myths
❌ "EVs don't reduce emissions because electricity is from coal"  
✅ Austin Energy grid is 40%+ renewable and improving; even coal-grid EVs beat gas cars on emissions

❌ "Batteries wear out quickly and cost $15k to replace"  
✅ Modern batteries last 200k-300k miles, warranties cover 8-10 years, degradation minimal

❌ "Charging takes hours, it's inconvenient"  
✅ Most charging happens overnight at home while you sleep; road trips require planning but 150kW+ fast charging now common

### Efficiency Myths
❌ "Small actions like unplugging chargers make a real difference"  
✅ Vampire loads are <2% of home energy use; focus on AC, water heating, appliances

❌ "Natural gas is cleaner than electricity for heating"  
✅ In Austin's grid, heat pumps (electric heating) now lower-emission than gas

## Behavioral Science Insights

### Effective Communication Strategies
- **Lead with co-benefits:** Cost savings, comfort, health, not just climate
- **Make it concrete:** "$80/month savings" not "30% reduction"
- **Avoid overwhelm:** Recommend 1-2 next steps, not comprehensive lists
- **Frame positively:** "Upgrade" not "sacrifice"
- **Social proof:** "Your neighbors have installed..." leverages conformity

### Barriers to Action
1. **Upfront costs:** Address with payback periods, financing options, incentives
2. **Complexity:** Simplify with specific next actions ("Call for free audit")
3. **Status quo bias:** Emphasize "when replacing" not "replace immediately"
4. **Lack of trust:** Cite specific programs, avoid generic advice
5. **Split incentives (renters):** Focus on actions within tenant control

## Ethical Considerations

### Equity and Access
- **Energy burden:** Low-income households spend 3x more of income on energy
- **Prioritize:** Free programs (audits, weatherization) before paid solutions
- **Renters:** 40% of Austin households; focus on transit, efficiency, behavior
- **Digital divide:** Not everyone has internet access to research programs

### Avoiding Greenwashing
- Be honest about impact magnitude: efficiency < solar < EVs for most households
- Don't oversell small actions (reusable bags, bamboo toothbrushes have minimal climate impact)
- Acknowledge trade-offs: manufacturing impacts exist for all technologies
- Avoid "carbon neutral" claims without explaining offsets

## Emerging Trends (2025-2026 Watch List)

- **Vehicle-to-grid (V2G):** EVs as home batteries; pilots starting in Texas
- **Heat pump adoption:** Federal rebates driving residential heat pump HVAC retrofits
- **Community solar expansion:** Growing access for renters and unsuitable roofs
- **Circular economy:** Right-to-repair laws, product longevity requirements gaining traction
- **Climate attribution:** Personalized carbon footprint tools improving in accuracy

## External Resources for Real-Time Context

The recommendation engine can fetch and cache external resources to supplement the static knowledge in this file. Add URLs below that should be checked for up-to-date information.

### Austin Energy Current Programs
**URL:** https://austinenergy.com/green-power  
**Purpose:** Latest renewable energy programs, rates, and incentives  
**Refresh:** Daily  
**Sections to extract:** Program updates, current rebate amounts, new initiatives

### Federal IRS Tax Credits
**URL:** https://www.irs.gov/credits-deductions/residential-clean-energy-credit  
**Purpose:** Current federal tax credit rates and eligibility requirements  
**Refresh:** Monthly  
**Sections to extract:** Credit percentages, income limits, qualifying technologies

### DSIRE Texas Incentives Database
**URL:** https://programs.dsireusa.org/system/program?state=TX  
**Purpose:** Comprehensive state and local incentive tracking  
**Refresh:** Weekly  
**Sections to extract:** Active programs, rebate amounts, policy changes

### Project Drawdown Research Updates
**URL:** https://drawdown.org/solutions  
**Purpose:** Latest climate solution rankings and research  
**Refresh:** Monthly  
**Sections to extract:** Solution rankings, updated impact data, new technologies

### How External Resources Work

1. **Static knowledge first:** The AI uses the content in this file as the primary knowledge base
2. **Supplemental fetching:** External URLs are fetched, cached, and used to check for updates
3. **Cache duration:** Content is cached based on the "Refresh" frequency to avoid excessive requests
4. **Fallback:** If external resources fail to fetch, the static knowledge is still used
5. **Context augmentation:** External content is added to AI prompts as supplemental, current information

### Adding New External Resources

To add a new external resource:
1. Add a new heading with the resource name
2. Specify the **URL** to fetch
3. Define the **Purpose** (what information it provides)
4. Set **Refresh** frequency (Hourly, Daily, Weekly, Monthly)
5. Describe **Sections to extract** (what specific content to focus on)

Example:
```markdown
### Austin Transportation Electrification Plan
**URL:** https://www.austintexas.gov/department/electric-vehicle-plan  
**Purpose:** City's EV infrastructure and policy roadmap  
**Refresh:** Monthly  
**Sections to extract:** Charging station expansion, fleet electrification timeline
```

### Notes for Administrators

- External resources are fetched asynchronously and won't block recommendations
- If a URL becomes unavailable, the system falls back to static knowledge
- Monitor edge function logs to see which external resources are being used
- Keep the "Refresh" frequency realistic (too frequent = unnecessary bandwidth)
- Consider adding RSS feeds or API endpoints for structured data sources

## Update Guidelines

This document should be updated:
- **Quarterly:** Policy changes, incentive amounts, grid composition
- **Annually:** Research findings, technology costs, best practices
- **As needed:** Major policy changes (new federal programs, Austin Energy rate changes)

When updating:
1. Cite sources for research findings (peer-reviewed preferred)
2. Keep "Latest Findings" sections current (no older than 2 years)
3. Add new misconceptions as they emerge in public discourse
4. Update cost figures at least annually
5. Note update date at top of file
6. Review external resource URLs quarterly to ensure they're still valid`;

export const dataSourcesContent = `# Data Sources Configuration
Last Updated: 2025-10-22

## Overview
This file defines the external data sources used by the recommendation engine. Each source includes API endpoints, data interpretation guidelines, and fallback behavior.

## Austin Open Data Portal

### Solar Permits
**API Endpoint:** \`https://data.austintexas.gov/resource/fvet-w56k.json\`  
**Purpose:** Track solar installation activity by ZIP code and neighborhood  
**Update Frequency:** Updated monthly by Austin Energy  
**Key Fields:**
- \`issue_date\`: When permit was issued
- \`completed_date\`: When installation was completed  
- \`zipcode\`: Location of installation
- \`work_class\`: Type of work (filter for "Auxiliary Power" for solar)
- \`permit_type\`: Usually "Solar Photovoltaic System"
- \`latitude\`, \`longitude\`: Location coordinates

**Filter Parameters:**
- \`$where=issue_date >= '2020-01-01'\` (get recent installations, past 5 years)
- \`work_class='Auxiliary Power'\` (isolates solar from other electrical work)

**Interpretation:**
- **High activity (>50 permits/ZIP in past year):** "This area has strong solar adoption"
- **Medium activity (20-50 permits/ZIP):** "Growing solar interest in this area"
- **Low activity (<20 permits/ZIP):** "Solar is just beginning in this area" or "Opportunity to be an early adopter"

**Fallback:** If API unavailable, use generic language: "Solar installations are growing across Austin"

### Energy Audits
**API Endpoint:** \`https://data.austintexas.gov/resource/77pk-yxf5.json\`  
**Purpose:** Track participation in free energy audit program  
**Update Frequency:** Updated quarterly  
**Key Fields:**
- \`zip_code\`: Where audit was conducted
- \`year\`: Year of audit
- \`number_of_audits\`: Count in that ZIP/year

**Interpretation:**
- **High audit activity:** Indicates community awareness of efficiency programs
- **Low audit activity:** Opportunity to promote free audit program

**Fallback:** Always recommend energy audits; API data just adds context

### Weatherization Projects
**API Endpoint:** \`https://data.austintexas.gov/resource/4c7y-k5ay.json\`  
**Purpose:** Track low-income weatherization assistance program  
**Update Frequency:** Updated quarterly  
**Key Fields:**
- \`zip_code\`: Project location
- \`year_of_completion\`: When work was completed
- \`project_type\`: Type of weatherization work

**Interpretation:**
- Indicates areas with older housing stock and energy burden
- Use to contextualize efficiency recommendations

**Fallback:** Don't penalize missing data; weatherization data is for context only

### Green Buildings
**API Endpoint:** \`https://data.austintexas.gov/resource/4c7y-k5ay.json\`  
**Purpose:** Track Austin Energy Green Building certified projects  
**Update Frequency:** Updated monthly  
**Key Fields:**
- \`rating\`: Star rating (1-5 stars)
- \`project_type\`: Residential, commercial, multi-family
- \`completion_date\`: When certified

**Interpretation:**
- Presence indicates local green building expertise
- Use to recommend green building programs for renovations

**Fallback:** Generic green building recommendations

## Google APIs

### Geocoding API
**Purpose:** Convert addresses to coordinates and standardized format  
**Endpoint:** \`https://maps.googleapis.com/maps/api/geocode/json\`  
**Required:** API key in \`GOOGLE_SOLAR_API_KEY\` secret  
**Rate Limits:** 40,000 requests/day (free tier)

**Response Fields Used:**
- \`formatted_address\`: Standardized address
- \`geometry.location.lat\`, \`geometry.location.lng\`: Coordinates
- \`address_components[postal_code]\`: Extracted ZIP code

**Error Handling:**
- Invalid address → Return clear error message to user
- Rate limit exceeded → Graceful degradation, skip address-specific features

### Solar API
**Purpose:** Analyze solar potential of specific properties  
**Endpoint:** \`https://solar.googleapis.com/v1/buildingInsights:findClosest\`  
**Required:** API key in \`GOOGLE_SOLAR_API_KEY\` secret  
**Rate Limits:** 1,000 requests/day (check current quota)

**Response Fields Used:**
- \`solarPotential.maxArrayPanelsCount\`: Max panels that fit on roof
- \`solarPotential.maxArrayAreaMeters2\`: Usable roof area  
- \`solarPotential.maxSunshineHoursPerYear\`: Annual sun exposure
- \`solarPotential.carbonOffsetFactorKgPerMwh\`: Local grid carbon intensity
- \`solarPotential.financialAnalyses\`: Array of financial scenarios (20-year savings projections)

**Interpretation:**
- \`maxArrayPanelsCount > 15\`: "Excellent solar potential"
- \`maxArrayPanelsCount 10-15\`: "Good solar potential"
- \`maxArrayPanelsCount < 10\`: "Limited roof space, consider community solar"
- \`maxSunshineHoursPerYear > 1600\`: "Excellent sun exposure" (Austin average)

**Fallback:**
- If API unavailable or property not found, use Austin averages:
  - Average system size: 20 panels, 7kW
  - Average annual production: 10,000 kWh
  - Average savings: $1,200/year

## Data Quality Considerations

### Known Limitations
1. **Solar Permit Data:**
   - Some commercial permits included; filter by \`work_class\`
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
- **Solar permits:** Filter out \`issue_date\` before 2015 (data quality issues)
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
- \`GOOGLE_SOLAR_API_KEY\`: For Geocoding and Solar APIs (same key used for both)

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
- New secrets/credentials are required`;
