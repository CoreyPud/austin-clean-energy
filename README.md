# austin-clean-energy

Developer Brief: Austin Clean Energy Opportunity Dashboard
Overview

The Austin Clean Energy Opportunity Dashboard is a backend-driven application that enables climate activists, policymakers, and community members to identify and promote solar energy adoption, energy efficiency upgrades, and battery energy storage systems (BESS) across Austin.

The images provide some rough mock ups of previous versions but should not be used as design inspiration. The design of the app should be much more modern and user friendly. 

Here are some sample data sources that could be used: 
Solar Program Current Incentive Levels and Available Capacity: https://data.austintexas.gov/resource/vxq2-zjmn.json
Solar on City Facilities: https://data.austintexas.gov/resource/3kyh-ggqg.json
https://data.austintexas.gov/resource/tk9p-m8c7.json
Weatherization Assistance Program: https://data.austintexas.gov/resource/fnns-rqqh.json
Austin Energy Single Family Audits: https://data.austintexas.gov/resource/tk9p-m8c7.json
Commercial Buildings Requiring Benchmarking for FY 2016: https://data.austintexas.gov/resource/b49u-qucc.json
Green Building Ratings Aggregate: https://data.austintexas.gov/resource/dpvb-c5fy.json


The platform is designed to:

Highlight opportunities for distributed solar installations.

Identify cost-saving and emissions-reducing building efficiency measures.

Promote the integration of battery storage for resilience, peak demand reduction, and grid flexibility.

The user journey flows from broad area-level insights → detailed property-level assessments → actionable recommendations.

Core Modules
1. Area Opportunity Analysis

Purpose: Provide community-level insights into solar, storage, and efficiency opportunities across geographic areas (zip codes, neighborhoods, building clusters).

Inputs:

Geographic identifier (zip code or neighborhood)

Building datasets (size, type, age, condition)

Energy audit and green building data

Existing solar installation records

Efficiency and weatherization program participation data

Battery storage adoption or interconnection data (if available)

Outputs:

Total buildings analyzed

Key opportunity areas for solar, efficiency, and storage adoption

Community-level insights (adoption momentum, efficiency gaps, resiliency potential with storage)

Incentive and rebate opportunities

High-level recommendations for outreach and further data collection

2. Individual Property Assessment

Purpose: Provide tailored clean energy assessments for a specific property.

Inputs:

Property details (address, type, age, condition)

Energy usage data (load profiles if available)

Solar installation and shading data

Incentive program eligibility

Neighborhood adoption trends

Outputs:

Solar assessment: Viability, estimated generation, savings, payback period, installation considerations

Efficiency assessment: Upgrade opportunities (e.g., insulation, windows, HVAC, lighting), estimated savings, carbon reduction

Battery storage assessment: Estimated capacity fit, backup duration, demand-shaving potential, resiliency benefits, cost ranges

Financial overview: Upfront investment ranges, available rebates and tax credits, ROI assessment, property value impact

Contextual insights: Comparison to peer properties, neighborhood adoption momentum

Next steps: Site-specific recommendations for audits, installer quotes, and incentive applications

3. Recommendation Engine

Purpose: Combine area and property insights into actionable strategies that balance solar, efficiency, and storage adoption.

Inputs:

Area analysis results

Property-level assessments

Incentive program timelines and funding caps

Seasonal generation/usage patterns

Community adoption and readiness data

Outputs:

Prioritized opportunities: Properties or neighborhoods with high ROI and/or high climate impact

Strategic insights: Market momentum, timing considerations, resiliency benefits from combining solar + storage, and demand reduction from efficiency upgrades

Action plans:

Immediate priorities: Data collection, property owner engagement, rebate applications

Medium-term goals: Outreach campaigns, installer partnerships, bundling efficiency + solar + storage packages

Advocacy strategies: Highlight financial, resiliency, and environmental benefits of combined measures

Data gaps: Identify missing datasets (e.g., detailed load shapes, updated incentive info, building-specific energy audits)

Functional Requirements

Dynamic Data Flow

User exploration flows from area-level → property-level → recommendations.

Frontend must pass filtered results between modules to guide navigation.

Response Handling

All responses rendered dynamically; no hardcoded data.

JSON and Markdown outputs should be displayed cleanly.

Graceful fallbacks if structured parsing fails (show raw response in readable form).

Validation & Resilience

Confirm data structures before rendering (e.g., lists, objects).

Handle incomplete/missing data without breaking UI.

User Experience

Provide clear loading states and non-technical error messages.

Make it easy to compare solar, efficiency, and storage opportunities side by side.

Ensure a smooth transition between analysis levels.

Developer Notes

Each module must support solar, efficiency, and storage data equally.

Design should allow expansion (e.g., electric vehicle integration, demand response programs, virtual power plants).

The Recommendation Engine should prioritize bundled solutions (e.g., efficiency upgrades first, then right-sized solar + storage) for maximum ROI and impact.

System must support localized incentive programs (Austin Energy, federal ITC, state-level rebates).

✅ End Goal: A robust, extensible dashboard that empowers residents, policymakers, and activists to evaluate solar, efficiency, and storage solutions together, enabling data-driven decisions that cut costs, improve resiliency, and accelerate Austin’s clean energy transition.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://austin-clean-energy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76eceb09-8d68-4c59-889c-2374aeae8ae2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
