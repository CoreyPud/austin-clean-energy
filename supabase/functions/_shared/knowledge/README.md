# Knowledge Base Documentation

This directory contains the configurable knowledge base for the Austin Clean Energy Recommendation Engine. These markdown files drive the AI-generated recommendations shown to users.

## Files Overview

- **priorities.md** - Climate impact framework that ranks actions by effectiveness
- **resources.md** - Austin-specific programs, incentives, and resources to link users to
- **expert-context.md** - Current research, policy context, and best practices
- **data-sources.md** - Configuration for external APIs and data interpretation rules

## How It Works

When a user requests recommendations, the edge functions:
1. Load these markdown files using `loadKnowledge.ts`
2. Combine the knowledge with real-time data from Austin's open data portals
3. Send the combined context to the AI model
4. The AI generates personalized recommendations based on this knowledge

**Changes to these files take effect immediately after edge function redeployment** (which happens automatically in Lovable when you edit files).

## How to Update

### Updating Priorities (priorities.md)

**When to update:**
- New research changes impact estimates (quarterly review)
- Austin's grid mix changes significantly (annual)
- New incentive programs launch (as needed)

**What to update:**
1. Impact scores (1-10 scale) if research findings change
2. CO₂ reduction estimates based on latest studies
3. "Austin Context" section with infrastructure/policy changes
4. "Current Incentives" section with program updates
5. "Last Updated" date at the top

**Example update:**
```markdown
### 1. Transportation Electrification
**Impact Score:** 9/10  
**Annual CO₂ Reduction:** 4-6 tons per vehicle  
**Current Incentives:** Federal EV tax credit up to $7,500, Austin Energy rebates for home charging equipment, NEW: State rebate program launched March 2025
```

### Updating Resources (resources.md)

**When to update:**
- Incentive amounts change (check quarterly)
- New programs launch (as needed)
- Program URLs change or become inactive (monthly check)

**What to update:**
1. Incentive amounts (rebates, tax credits)
2. URLs and verify they're still active
3. Eligibility criteria if programs change
4. Add new programs in appropriate categories
5. Archive discontinued programs (move to bottom, mark as "No longer available")
6. "Last Updated" date at top

**Example update:**
```markdown
### Solar Rebate Program
**URL:** https://austinenergy.com/rebates/solar  
**Incentive:** Up to $3,000 for residential solar installations (increased from $2,500 as of Jan 2025)  
**Eligibility:** Austin Energy customers installing new solar systems  
**Notes:** Rebate amounts vary by system size; combine with federal tax credit for maximum savings
```

### Updating Expert Context (expert-context.md)

**When to update:**
- Major policy changes (federal, state, local)
- New research findings published (annual review)
- Technology cost changes (annual)
- New best practices emerge

**What to update:**
1. "Current Policy Context" section with legislative changes
2. "Latest Findings" in each category with recent research
3. Cost figures to reflect current market prices
4. "Common Misconceptions" if new myths emerge
5. "Emerging Trends" section
6. "Last Updated" date at top

**Example update:**
```markdown
### Federal Incentives (2025-2026)
- **Inflation Reduction Act (IRA)** continues through 2030s
- **Solar ITC:** 30% through 2032
- **EV Tax Credits:** $7,500 for new EVs, $4,000 for used; NEW: Income caps increased to $200k single / $400k joint as of Jan 2025
```

### Updating Data Sources (data-sources.md)

**When to update:**
- API endpoints change
- New data sources are added
- Interpretation thresholds need adjustment
- Known data quality issues discovered

**What to update:**
1. API endpoints if URLs change
2. Interpretation rules if data patterns change
3. "Known Limitations" section with discovered issues
4. Add new data source sections when adding APIs
5. Update required secrets list
6. "Last Updated" date at top

**Example update:**
```markdown
### Solar Permits
**API Endpoint:** `https://data.austintexas.gov/resource/fvet-w56k.json`  
**Interpretation:**
- **High activity (>75 permits/ZIP in past year):** "This area has strong solar adoption" (increased from 50 due to overall growth)
```

## Update Best Practices

### Research and Citations
- **Always cite sources** for impact estimates and research findings
- Prefer peer-reviewed studies over blog posts
- Use recent research (within 2-3 years for technology costs, within 5 years for impact studies)
- Good sources: Project Drawdown, IPCC reports, NREL studies, EPA data

### Accuracy and Verification
- **Verify all URLs** before saving changes (test that they load)
- **Check incentive amounts** on official program websites
- **Cross-reference numbers** - if a CO₂ estimate seems off, verify with multiple sources
- **Test AI outputs** after making changes to ensure they're being used correctly

### Consistency
- Use consistent formatting (follow existing structure)
- Keep impact scores on 1-10 scale
- Use standard units: tons CO₂/year, $/year savings, $/watt for solar costs
- Maintain tone: informative, action-oriented, not preachy

### Communication Style
When writing knowledge base content, keep in mind the AI will use this to talk to users:
- **Be specific:** "$80/month savings" not "significant savings"
- **Be honest:** Acknowledge limitations and trade-offs
- **Be actionable:** "Call for free audit at 512-xxx-xxxx" not "consider getting an audit"
- **Avoid jargon:** Explain terms like "ITC," "kWh," "RPS"

## Version Control

While these files are in version control (git), it's helpful to:
- Note the date of major updates in commit messages
- Keep the "Last Updated" date current at top of each file
- Archive old versions if making major rewrites (copy to `knowledge/archive/` folder)

## Testing Changes

After updating knowledge files:
1. **Redeploy edge functions** (automatic in Lovable when you save changes)
2. **Test with the UI:** Generate recommendations and verify new information appears
3. **Check AI outputs:** Ensure the AI is using the new knowledge appropriately
4. **Review logs:** Edge function logs will show if knowledge loading fails

## Common Issues

### Knowledge not loading
- **Check file paths:** Files must be in `supabase/functions/_shared/knowledge/`
- **Check syntax:** Ensure markdown is valid (no broken formatting)
- **Check logs:** Edge function logs show loading errors

### AI not using updated knowledge
- **Wait for redeployment:** Changes take effect after edge functions redeploy
- **Clear cache:** Restart might be needed in some cases
- **Check prompt structure:** Ensure edge functions are injecting knowledge correctly

### URLs not working
- **Test URLs manually:** Open in browser to verify they work
- **Check for typos:** Even small typos break links
- **Update or remove:** If program ended, mark as discontinued

## Need Help?

If you're unsure how to update something:
1. **Look at existing examples** in the files for formatting guidance
2. **Ask in the AI chat** - describe what you want to update
3. **Test small changes first** before major rewrites
4. **Keep backups** of working versions before major changes

## Quick Reference: Update Frequency

| File | Review Frequency | Typical Update Triggers |
|------|-----------------|------------------------|
| priorities.md | Quarterly | New research, grid changes, major incentive changes |
| resources.md | Monthly | Incentive amounts, new programs, URL changes |
| expert-context.md | Quarterly | Policy changes, cost updates, new research |
| data-sources.md | As needed | API changes, new data sources, quality issues |
