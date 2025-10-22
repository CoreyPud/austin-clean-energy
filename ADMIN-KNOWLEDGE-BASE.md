# Admin Guide: Managing the Recommendation Knowledge Base

## Overview

Your Austin Clean Energy recommendation engine now uses a **configurable knowledge base** that you can update without touching code. This system separates "what to recommend" (policy/expertise) from "how to recommend it" (code logic).

## Quick Start

All configuration files are located in: `supabase/functions/_shared/knowledge/`

**To update recommendations:**
1. Edit the relevant `.md` file in the knowledge folder
2. Save your changes
3. Edge functions automatically redeploy (happens in ~30 seconds)
4. Your updates are live!

## Configuration Files

### 📋 priorities.md
**What it controls:** The climate impact framework that ranks actions by effectiveness

**Update frequency:** Quarterly (or when major research/policy changes occur)

**What to update:**
- Impact scores (1-10 scale)
- CO₂ reduction estimates
- Current incentive amounts
- Austin-specific context (grid mix, infrastructure changes)

**Example update:**
```markdown
### 1. Transportation Electrification
**Impact Score:** 9/10  
**Current Incentives:** Federal EV tax credit up to $7,500, NEW: State rebate launched March 2025
```

### 🔗 resources.md
**What it controls:** Austin-specific programs, rebates, and resources linked in recommendations

**Update frequency:** Monthly URL checks, quarterly incentive updates

**What to update:**
- Incentive amounts (rebates, tax credits)
- Program URLs (verify they work!)
- Eligibility criteria
- Add new programs, archive discontinued ones

**Example update:**
```markdown
### Solar Rebate Program
**Incentive:** Up to $3,000 (increased from $2,500 as of Jan 2025)
```

### 💡 expert-context.md
**What it controls:** Best practices, current research, policy context, common misconceptions, AND external resources to fetch

**Update frequency:** Quarterly for static content, add external sources as needed

**What to update:**
- Federal/state/local policy changes
- Technology cost updates (solar, batteries, EVs)
- New research findings
- Current Austin Energy initiatives
- **External resource URLs** (new!) - websites to fetch for real-time information

**External Resources Feature:**
The `expert-context.md` file now includes an "External Resources for Real-Time Context" section where you can configure websites that will be automatically fetched and cached to supplement the static knowledge base.

**Example external resource:**
```markdown
### Austin Energy Current Programs
**URL:** https://austinenergy.com/green-power
**Purpose:** Latest renewable energy programs, rates, and incentives
**Refresh:** Daily
**Sections to extract:** Program updates, current rebate amounts
```

**How it works:**
1. The recommendation engine reads the external resources list
2. Fetches content from each URL with caching (based on refresh frequency)
3. Uses static markdown knowledge first, then supplements with fresh external data
4. Falls back to static knowledge if any external source is unavailable

**Best practices for external resources:**
- Use official sources only (government, utilities, research institutions)
- Set realistic refresh frequencies: Daily for programs/rates, Monthly for research
- Monitor edge function logs to verify sources fetch successfully
- Add 3-5 key sources; too many will slow down recommendations

### 🗄️ data-sources.md
**What it controls:** External API configurations and data interpretation rules

**Update frequency:** As needed (API changes, new data sources)

**What to update:**
- API endpoints if they change
- Interpretation thresholds (e.g., "50+ solar permits = high activity")
- Known data quality issues

## How to Make Updates

### Step 1: Open the File
Navigate to `supabase/functions/_shared/knowledge/` and open the relevant `.md` file.

### Step 2: Edit in Markdown
Use standard markdown formatting. Follow existing structure and formatting patterns.

### Step 3: Save & Verify
- Save the file
- Edge functions redeploy automatically (~30 seconds)
- Test by generating recommendations in your app

### Step 4: Update the Date
Change the "Last Updated: YYYY-MM-DD" at the top of the file.

## Best Practices

### ✅ DO:
- **Cite sources** for impact estimates and research findings
- **Verify all URLs** before saving (click to test they load)
- **Use consistent formatting** (follow existing patterns)
- **Keep it concise** - AI uses this as context, so brevity helps
- **Update regularly** - stale information hurts credibility

### ❌ DON'T:
- Don't make assumptions - verify numbers from official sources
- Don't use outdated research (prefer last 2-3 years for costs, 5 years for impact studies)
- Don't break markdown formatting (it will cause parsing errors)
- Don't forget to update the "Last Updated" date

## Testing Your Changes

After updating:
1. Wait ~30 seconds for redeployment
2. Generate recommendations in your app
3. Verify new information appears in AI outputs
4. Check edge function logs for any loading errors

## Troubleshooting

### Problem: Changes aren't showing up
- **Wait longer** - Redeployment takes up to 60 seconds
- **Check logs** - Look for knowledge loading errors in edge function logs
- **Verify markdown** - Broken formatting can cause loading failures

### Problem: AI isn't using updated info
- **Check prompt structure** - Ensure edge functions inject knowledge correctly
- **Test with obvious change** - Try a dramatic update to confirm it's working

### Problem: URLs are broken
- **Test manually** - Open each URL in browser
- **Update or remove** - Fix broken links or mark programs as discontinued

## Maintenance Schedule

**Monthly:**
- Verify all resource URLs are active
- Check for program updates on Austin Energy website

**Quarterly:**
- Update incentive amounts
- Review priorities.md for research updates
- Update expert-context.md with policy changes
- Update cost figures (solar, batteries, EVs)

**As Needed:**
- Add new programs when they launch
- Update API endpoints if they change
- Fix data quality issues

## Getting Help

**For detailed documentation:** See `supabase/functions/_shared/knowledge/README.md`

**Questions about markdown formatting:** Follow existing file patterns

**Need to add a new data source:** Update `data-sources.md` and modify edge functions (requires code changes)

## Key Benefits

✅ **No code changes needed** - Update expertise without deploying code  
✅ **Always current** - Keep recommendations fresh with latest programs  
✅ **Version controlled** - Git tracks all changes  
✅ **Transparent** - See exactly what drives recommendations  
✅ **Collaborative** - Multiple experts can review/update

---

## Quick Reference: What to Update When

| Event | Files to Update |
|-------|----------------|
| New rebate program launches | resources.md |
| Incentive amount changes | priorities.md, resources.md |
| New research published | expert-context.md, priorities.md |
| Austin Energy grid mix changes | priorities.md, expert-context.md |
| API endpoint changes | data-sources.md (+ code changes) |
| Policy change (federal/state/local) | expert-context.md |
| Want real-time data from website | expert-context.md (add to External Resources) |

---

**Last Updated:** 2025-10-22
