INSERT INTO public.knowledge_files (name, content, updated_by)
VALUES (
  'council-members',
  $council$# Austin City Council Contact Directory
Last Updated: 2026-04-23

> **How this file is used:** The unified property-assessment flow geocodes a user's address, looks up their council district via Austin's public ArcGIS service, then pulls the matching member's contact info and current priorities from this file to display in the "Local Advocacy" card.
>
> **Editing rules (keep the parser happy):**
> - Each council member section must start with `## Mayor` or `## District N` (where N is 1-10).
> - Each section must include lines that start with `**Name:**`, `**Email:**`, `**Phone:**`, `**Office Page:**`, and `**Current Priorities:**`.
> - Keep one value per line. Don't change the field labels — only the values after the colon.
> - For unknown fields, leave the value blank after the colon (e.g., `**Phone:**`) — do not delete the line.
> - Refresh after every council election or when a member's contact info changes.

## Mayor
**Name:** Kirk Watson
**Email:** mayor@austintexas.gov
**Phone:** 512-978-2100
**Office Page:** https://www.austintexas.gov/department/mayor
**Current Priorities:** Climate equity plan implementation, Project Connect, affordable housing

## District 1
**Name:** Natasha Harper-Madison
**Email:** district1@austintexas.gov
**Phone:** 512-978-2101
**Office Page:** https://www.austintexas.gov/department/district-1
**Current Priorities:** Eastside weatherization access, EV charging equity, displacement prevention

## District 2
**Name:** Vanessa Fuentes
**Email:** district2@austintexas.gov
**Phone:** 512-978-2102
**Office Page:** https://www.austintexas.gov/department/district-2
**Current Priorities:** Southeast Austin air quality, weatherization for older homes, transit access

## District 3
**Name:** José Velásquez
**Email:** district3@austintexas.gov
**Phone:** 512-978-2103
**Office Page:** https://www.austintexas.gov/department/district-3
**Current Priorities:** Heat island mitigation, multifamily efficiency, gentrification protections

## District 4
**Name:** José "Chito" Vela
**Email:** district4@austintexas.gov
**Phone:** 512-978-2104
**Office Page:** https://www.austintexas.gov/department/district-4
**Current Priorities:** Land Development Code reform, North Lamar transit corridor, renter protections

## District 5
**Name:** Ryan Alter
**Email:** district5@austintexas.gov
**Phone:** 512-978-2105
**Office Page:** https://www.austintexas.gov/department/district-5
**Current Priorities:** Watershed protection, residential solar adoption, missing-middle housing

## District 6
**Name:** Mackenzie Kelly
**Email:** district6@austintexas.gov
**Phone:** 512-978-2106
**Office Page:** https://www.austintexas.gov/department/district-6
**Current Priorities:** Wildfire resilience, public safety, Northwest Austin infrastructure

## District 7
**Name:** Mike Siegel
**Email:** district7@austintexas.gov
**Phone:** 512-978-2107
**Office Page:** https://www.austintexas.gov/department/district-7
**Current Priorities:** Climate action plan, public power expansion, North Austin transit

## District 8
**Name:** Paige Ellis
**Email:** district8@austintexas.gov
**Phone:** 512-978-2108
**Office Page:** https://www.austintexas.gov/department/district-8
**Current Priorities:** Austin Climate Equity Plan, Barton Springs watershed, multimodal transportation

## District 9
**Name:** Zohaib "Zo" Qadri
**Email:** district9@austintexas.gov
**Phone:** 512-978-2109
**Office Page:** https://www.austintexas.gov/department/district-9
**Current Priorities:** Downtown density, transit-oriented development, renter rights

## District 10
**Name:** Marc Duchen
**Email:** district10@austintexas.gov
**Phone:** 512-978-2110
**Office Page:** https://www.austintexas.gov/department/district-10
**Current Priorities:** Western watersheds, neighborhood preservation, wildfire preparedness

---

## Notes for Admins
- **Always-live fallback:** Even if the contact details above go stale (e.g., right after an election), the unified-assessment edge function falls back to the official `austintexas.gov/department/district-N` link returned by the ArcGIS lookup, so users always get a working route to current info.
- **Where to verify:** https://www.austintexas.gov/department/city-council lists all current members and contact info.
- **Election cycle:** Austin council elections happen in November of even-numbered years; expect to update this file every other January.
$council$,
  'system-seed'
)
ON CONFLICT DO NOTHING;

-- Ensure uniqueness on name so future seeds/upserts behave predictably
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_files_name_key'
  ) THEN
    BEGIN
      ALTER TABLE public.knowledge_files ADD CONSTRAINT knowledge_files_name_key UNIQUE (name);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN
      -- ignore if already enforced or duplicates exist
      NULL;
    END;
  END IF;
END$$;