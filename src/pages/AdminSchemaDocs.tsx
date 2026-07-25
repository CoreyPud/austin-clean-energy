import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Database, KeyRound, Link2, Copy, Search } from "lucide-react";
import { toast } from "sonner";

type Column = {
  name: string;
  type: string;
  nullable?: boolean;
  pk?: boolean;
  fk?: { table: string; column: string };
  description: string;
};

type ExampleQuery = {
  label: string;
  sql: string;
};

type TableDoc = {
  name: string;
  category: "Solar" | "Property" | "Energy" | "Transportation" | "Content" | "Ops";
  description: string;
  rls: string;
  columns: Column[];
  examples: ExampleQuery[];
};

const TABLES: TableDoc[] = [
  {
    name: "solar_installations",
    category: "Solar",
    description:
      "City of Austin solar permit records, synced daily from the Austin Open Data portal. One row per permit.",
    rls: "Public SELECT. Writes restricted to service role (sync + admin corrections).",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "project_id", type: "text", description: "City permit project identifier used as the sync upsert key." },
      { name: "permit_number", type: "text", description: "City-issued permit number." },
      { name: "permit_class", type: "text", description: "Permit class (Residential, Commercial, etc.)." },
      { name: "address", type: "text", description: "Raw permit address from the City feed." },
      { name: "description", type: "text", description: "Free-text permit description (used to detect battery storage keywords)." },
      { name: "installed_kw", type: "numeric", description: "System size in kW (frequently missing in the City feed — see disclaimers)." },
      { name: "applied_date", type: "date", description: "Permit application date." },
      { name: "issued_date", type: "date", description: "Permit issue date." },
      { name: "completed_date", type: "date", description: "Permit completion date (preferred for fiscal-year analytics)." },
      { name: "calendar_year_issued", type: "integer", description: "Year of issued_date, denormalized for charts." },
      { name: "status_current", type: "text", description: "Latest permit status from the City." },
      { name: "latitude", type: "numeric", description: "Permit latitude." },
      { name: "longitude", type: "numeric", description: "Permit longitude." },
      { name: "original_zip", type: "text", description: "ZIP code from the permit record." },
      { name: "council_district", type: "text", description: "Austin city council district." },
      { name: "jurisdiction", type: "text", description: "Permitting jurisdiction." },
      { name: "contractor_company", type: "text", description: "Installing contractor name." },
      { name: "contractor_city", type: "text", description: "Contractor city." },
      { name: "link", type: "text", description: "Link back to the City permit record." },
      { name: "total_job_valuation", type: "numeric", description: "Total job valuation reported to the City." },
      { name: "electrical_valuation", type: "numeric", description: "Electrical portion of the job valuation." },
      {
        name: "tcad_pid",
        type: "bigint",
        fk: { table: "tcad_properties", column: "pid_int" },
        description: "Travis County parcel ID matched by centroid spatial join (enrich_solar_tcad_pids).",
      },
      { name: "wcad_pid", type: "bigint", description: "Williamson County parcel ID (fallback for non-Travis parcels)." },
      { name: "parcel_id", type: "text", description: "Original parcel ID text as reported by the City feed." },
    ],
    examples: [
      {
        label: "Most recent 20 permits",
        sql: `SELECT project_id, address, installed_kw, issued_date, status_current
FROM solar_installations
ORDER BY issued_date DESC NULLS LAST
LIMIT 20;`,
      },
      {
        label: "Permits per calendar year",
        sql: `SELECT calendar_year_issued AS year, COUNT(*) AS permits, SUM(installed_kw) AS total_kw
FROM solar_installations
WHERE calendar_year_issued IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;`,
      },
      {
        label: "Join permit → parcel (roof potential)",
        sql: `SELECT s.project_id, s.address, s.installed_kw, t.solar_buildable_kw, t.roof_type
FROM solar_installations s
JOIN tcad_properties t ON t.pid_int = s.tcad_pid
WHERE s.tcad_pid IS NOT NULL
LIMIT 25;`,
      },
    ],
  },
  {
    name: "pir_installations",
    category: "Solar",
    description:
      "Austin Energy Program Interconnection Request (PIR) records, imported from CSV. One row per interconnected system.",
    rls: "Public SELECT. Writes via admin PIR importer.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "pir_number", type: "text", description: "Austin Energy PIR identifier." },
      { name: "address", type: "text", description: "Reported address." },
      { name: "address_normalized", type: "text", description: "Normalized address for fuzzy matching against permits." },
      { name: "system_kw", type: "numeric", description: "Interconnected system size in kW." },
      { name: "interconnection_date", type: "date", description: "Date of interconnection." },
      { name: "customer_type", type: "text", description: "Residential / Commercial classification." },
      { name: "fuel_type", type: "text", description: "Generation fuel (typically solar)." },
      { name: "technology", type: "text", description: "Technology descriptor from PIR feed." },
      { name: "raw_data", type: "jsonb", description: "Full source CSV row for auditing." },
    ],
    examples: [
      {
        label: "Capacity by customer type",
        sql: `SELECT customer_type, COUNT(*) AS systems, SUM(system_kw) AS total_kw
FROM pir_installations
GROUP BY 1
ORDER BY total_kw DESC NULLS LAST;`,
      },
      {
        label: "Monthly interconnections (last 24 mo)",
        sql: `SELECT date_trunc('month', interconnection_date) AS month, COUNT(*) AS systems
FROM pir_installations
WHERE interconnection_date >= (CURRENT_DATE - INTERVAL '24 months')
GROUP BY 1 ORDER BY 1;`,
      },
    ],
  },
  {
    name: "data_match_results",
    category: "Solar",
    description: "Output of the City ↔ PIR matching engine. One row per candidate match.",
    rls: "Public SELECT. Writes via admin data-comparison tools.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      {
        name: "solar_installation_id",
        type: "uuid",
        fk: { table: "solar_installations", column: "id" },
        description: "Matched City permit.",
      },
      {
        name: "pir_installation_id",
        type: "uuid",
        fk: { table: "pir_installations", column: "id" },
        description: "Matched Austin Energy PIR row.",
      },
      { name: "match_confidence", type: "numeric", description: "0–1 confidence score from the matcher." },
      { name: "match_type", type: "text", description: "Which matching level produced the pair (address / geo / fuzzy / manual)." },
      { name: "status", type: "text", description: "pending_review | confirmed | rejected." },
      { name: "reviewed_notes", type: "text", description: "Admin notes captured during review." },
    ],
    examples: [
      {
        label: "Pending high-confidence matches",
        sql: `SELECT * FROM data_match_results
WHERE status = 'pending_review' AND match_confidence >= 0.8
ORDER BY match_confidence DESC LIMIT 50;`,
      },
    ],
  },
  {
    name: "installation_corrections",
    category: "Solar",
    description:
      "Manual override layer joined to solar_installations by project_id. Populated by the admin Corrections console.",
    rls: "Public SELECT. Writes via admin corrections API.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "project_id", type: "text", description: "Matches solar_installations.project_id." },
      { name: "corrected_kw", type: "numeric", description: "Override for installed_kw." },
      { name: "corrected_address", type: "text", description: "Override address." },
      { name: "corrected_latitude", type: "numeric", description: "Override latitude." },
      { name: "corrected_longitude", type: "numeric", description: "Override longitude." },
      { name: "corrected_completed_date", type: "date", description: "Override completed_date." },
      { name: "corrected_applied_date", type: "date", description: "Override applied_date." },
      { name: "corrected_issued_date", type: "date", description: "Override issued_date." },
      { name: "corrected_description", type: "text", description: "Override description." },
      { name: "original_*", type: "various", description: "Snapshot of the original fields at the time of correction." },
      { name: "is_duplicate", type: "boolean", description: "Marks the permit as a duplicate to exclude from analytics." },
      { name: "notes", type: "text", description: "Admin free-text notes." },
    ],
    examples: [
      {
        label: "Corrections applied recently",
        sql: `SELECT project_id, corrected_kw, corrected_address, updated_at
FROM installation_corrections
ORDER BY updated_at DESC LIMIT 25;`,
      },
    ],
  },
  {
    name: "tcad_properties",
    category: "Property",
    description:
      "Travis County parcels enriched with centroid coordinates, distance-to-plant metrics, and Google Solar API roof analysis.",
    rls: "Public SELECT.",
    columns: [
      { name: "pid", type: "text", pk: true, description: "TCAD parcel identifier (text form)." },
      { name: "pid_int", type: "bigint", description: "Numeric parcel ID used for joins from solar_installations." },
      { name: "situs_address", type: "text", description: "Property address." },
      { name: "situs_zip", type: "text", description: "Property ZIP code." },
      { name: "property_type", type: "text", description: "TCAD property type." },
      { name: "land_type_desc", type: "text", description: "TCAD land type description." },
      { name: "estimated_roof_sqft", type: "integer", description: "Estimated roof area (sqft)." },
      { name: "market_value", type: "numeric", description: "TCAD market value." },
      { name: "in_ae", type: "boolean", description: "Whether parcel is inside Austin Energy service territory." },
      { name: "has_solar", type: "boolean", description: "Whether TCAD flags the property as having solar." },
      { name: "year_built", type: "integer", description: "Year built from TCAD." },
      { name: "py_owner_name", type: "text", description: "Owner name (public record)." },
      { name: "stat_cd", type: "text", description: "TCAD status code." },
      { name: "county", type: "text", description: "County (default 'travis')." },
      { name: "centroid_lat", type: "double precision", description: "Parcel centroid latitude — used for point-in-polygon matching." },
      { name: "centroid_lon", type: "double precision", description: "Parcel centroid longitude." },
      { name: "dist_nearest_gas_plant_mi", type: "double precision", description: "Miles to the nearest gas power_plants row (Haversine trigger)." },
      { name: "dist_proposed_peaker_mi", type: "double precision", description: "Miles to the nearest proposed_peaker_sites row." },
      { name: "solar_fetched_at", type: "timestamptz", description: "When Google Solar API data was last fetched." },
      { name: "solar_imagery_quality", type: "text", description: "Google Solar imagery quality tier." },
      { name: "solar_imagery_date", type: "date", description: "Date of the imagery used by Google Solar." },
      { name: "solar_max_panels", type: "smallint", description: "Google's theoretical maximum panel count." },
      { name: "solar_buildable_kw", type: "numeric", description: "Realistic buildable kW after derates (setbacks, walkways, low-production panels)." },
      { name: "solar_eligible_kw", type: "numeric", description: "Largest system that meets Austin Energy's 75% TSRF siting requirement." },
      { name: "optimal_system_size_kw", type: "numeric", description: "Recommended residential system size." },
      { name: "solar_max_area_m2", type: "real", description: "Total roof area (m²)." },
      { name: "solar_sunshine_hrs", type: "real", description: "Average annual sunshine hours." },
      { name: "solar_sunshine_median", type: "real", description: "Median panel sunshine hours." },
      { name: "solar_panel_capacity_w", type: "smallint", description: "Assumed panel capacity (W) used in Google's calc." },
      { name: "solar_panels_layout", type: "jsonb", description: "Full per-panel layout geometry from Google Solar." },
      { name: "roof_type", type: "text", description: "Roof type (admin-editable)." },
      { name: "comment", type: "text", description: "Free-text admin comment." },
      { name: "owner_contact", type: "text", description: "Owner contact info (admin-editable)." },
      { name: "owned_or_rented", type: "text", description: "Occupancy status (admin-editable)." },
    ],
    examples: [
      {
        label: "Top 25 largest buildable rooftops",
        sql: `SELECT pid, situs_address, solar_buildable_kw, solar_max_area_m2
FROM tcad_properties
WHERE solar_buildable_kw IS NOT NULL
ORDER BY solar_buildable_kw DESC LIMIT 25;`,
      },
      {
        label: "Parcels near proposed peaker sites (<1 mi)",
        sql: `SELECT pid, situs_address, dist_proposed_peaker_mi
FROM tcad_properties
WHERE dist_proposed_peaker_mi < 1
ORDER BY dist_proposed_peaker_mi ASC LIMIT 100;`,
      },
      {
        label: "Point-in-radius parcel lookup",
        sql: `SELECT * FROM find_parcel_pid_by_point(30.2672, -97.7431, 0.0005);`,
      },
    ],
  },
  {
    name: "tcad_roof_segments",
    category: "Property",
    description: "Per-roof-plane geometry from Google Solar API. Composite key (pid, segment_index).",
    rls: "Public SELECT.",
    columns: [
      { name: "pid", type: "text", pk: true, fk: { table: "tcad_properties", column: "pid" }, description: "Parcel this segment belongs to." },
      { name: "segment_index", type: "smallint", pk: true, description: "Segment ordinal within the parcel." },
      { name: "pitch_deg", type: "real", description: "Roof pitch (degrees)." },
      { name: "azimuth_deg", type: "real", description: "Roof azimuth (degrees from north)." },
      { name: "area_m2", type: "real", description: "Roof plane area (m²)." },
      { name: "ground_area_m2", type: "real", description: "Projected ground area (m²)." },
      { name: "sunshine_median", type: "real", description: "Median annual sunshine hours across panel positions." },
      { name: "sunshine_max", type: "real", description: "Best sunshine value on this segment." },
      { name: "sunshine_quantiles", type: "jsonb", description: "11-element decile array from Google Solar." },
      { name: "center_lat", type: "double precision", description: "Segment center latitude." },
      { name: "center_lon", type: "double precision", description: "Segment center longitude." },
      { name: "max_panels", type: "integer", description: "Google's max panel count for this segment." },
      { name: "max_kw", type: "numeric", description: "Max kW that fits on this segment." },
      { name: "yearly_energy_kwh", type: "numeric", description: "Modeled annual production (kWh)." },
    ],
    examples: [
      {
        label: "Best-producing segments for a parcel",
        sql: `SELECT segment_index, pitch_deg, azimuth_deg, max_kw, yearly_energy_kwh
FROM tcad_roof_segments
WHERE pid = '<PID>'
ORDER BY yearly_energy_kwh DESC NULLS LAST;`,
      },
    ],
  },
  {
    name: "power_plants",
    category: "Energy",
    description: "Texas power plants catalog (fuel, capacity, coordinates, avg output).",
    rls: "Public SELECT.",
    columns: [
      { name: "plantid", type: "integer", pk: true, description: "Plant identifier." },
      { name: "plant_name", type: "text", description: "Plant name." },
      { name: "fuel", type: "text", description: "Fuel type (gas, coal, solar, wind, etc.)." },
      { name: "capacity_mw", type: "numeric", description: "Nameplate capacity (MW)." },
      { name: "latitude", type: "numeric", description: "Plant latitude." },
      { name: "longitude", type: "numeric", description: "Plant longitude." },
      { name: "county", type: "text", description: "County." },
      { name: "owner", type: "text", description: "Owner." },
      { name: "commission_period", type: "text", description: "Commissioning period." },
      { name: "retirement_year", type: "integer", description: "Retirement year, if applicable." },
      { name: "avg_output_mw", type: "numeric", description: "Rolling average output (MW)." },
      { name: "co2_tons", type: "numeric", description: "Annual CO₂ emissions (tons)." },
      { name: "ae_pct", type: "numeric", description: "Share dedicated to Austin Energy load (%)." },
    ],
    examples: [
      {
        label: "Gas plants near Austin (with monthly gen)",
        sql: `SELECT p.plant_name, p.capacity_mw, AVG(g.avg_mw) AS avg_mw
FROM power_plants p
LEFT JOIN plant_monthly_gen g USING (plantid)
WHERE p.fuel = 'gas'
GROUP BY p.plant_name, p.capacity_mw
ORDER BY avg_mw DESC NULLS LAST LIMIT 25;`,
      },
    ],
  },
  {
    name: "plant_monthly_gen",
    category: "Energy",
    description: "Monthly generation per plant. Composite key (plantid, period).",
    rls: "Public SELECT.",
    columns: [
      { name: "plantid", type: "integer", pk: true, fk: { table: "power_plants", column: "plantid" }, description: "Plant reference." },
      { name: "period", type: "text", pk: true, description: "YYYY-MM period." },
      { name: "avg_mw", type: "numeric", description: "Average generation for the period (MW)." },
    ],
    examples: [
      {
        label: "Statewide gas generation over time",
        sql: `SELECT g.period, SUM(g.avg_mw) AS gas_mw
FROM plant_monthly_gen g
JOIN power_plants p USING (plantid)
WHERE p.fuel = 'gas'
GROUP BY g.period ORDER BY g.period;`,
      },
    ],
  },
  {
    name: "proposed_peaker_sites",
    category: "Energy",
    description: "Locations of proposed new gas peaker plants (used for parcel-proximity analysis).",
    rls: "Public SELECT.",
    columns: [
      { name: "id", type: "integer", pk: true, description: "Site identifier." },
      { name: "name", type: "text", description: "Site name / label." },
      { name: "latitude", type: "double precision", description: "Latitude." },
      { name: "longitude", type: "double precision", description: "Longitude." },
    ],
    examples: [
      { label: "All proposed sites", sql: `SELECT * FROM proposed_peaker_sites ORDER BY name;` },
    ],
  },
  {
    name: "ev_charging_stations",
    category: "Transportation",
    description: "Public EV charging stations from the NREL Alternative Fuels Data Center feed.",
    rls: "Public SELECT.",
    columns: [
      { name: "id", type: "bigint", pk: true, description: "NREL station ID." },
      { name: "station_name", type: "text", description: "Station name." },
      { name: "latitude", type: "numeric", description: "Latitude." },
      { name: "longitude", type: "numeric", description: "Longitude." },
      { name: "ev_network", type: "text", description: "Network operator (Tesla, ChargePoint, etc.)." },
      { name: "ev_level1_evse_num", type: "integer", description: "Count of Level 1 ports." },
      { name: "ev_level2_evse_num", type: "integer", description: "Count of Level 2 ports." },
      { name: "ev_dc_fast_num", type: "integer", description: "Count of DC fast-charging ports." },
      { name: "ev_connector_types", type: "text", description: "Connector types available." },
      { name: "ev_pricing", type: "text", description: "Pricing info." },
      { name: "access_code", type: "text", description: "Public / private access flag." },
      { name: "access_days_time", type: "text", description: "Access hours." },
      { name: "facility_type", type: "text", description: "Facility type descriptor." },
      { name: "open_date", type: "date", description: "Date opened." },
      { name: "open_year", type: "integer", description: "Year opened (indexed)." },
      { name: "street_address", type: "text", description: "Street address." },
      { name: "city", type: "text", description: "City." },
      { name: "state", type: "text", description: "State." },
      { name: "zip", type: "text", description: "ZIP." },
      { name: "status_code", type: "text", description: "E = available, T = temporarily unavailable, P = planned." },
    ],
    examples: [
      {
        label: "DC fast-charging counts by network (Austin)",
        sql: `SELECT ev_network, SUM(ev_dc_fast_num) AS dc_ports
FROM ev_charging_stations
WHERE city ILIKE 'austin' AND ev_dc_fast_num > 0
GROUP BY ev_network ORDER BY dc_ports DESC;`,
      },
      {
        label: "Stations added per year",
        sql: `SELECT open_year, COUNT(*) FROM ev_charging_stations
WHERE open_year IS NOT NULL GROUP BY 1 ORDER BY 1;`,
      },
    ],
  },
  {
    name: "vehicle_models",
    category: "Transportation",
    description: "EV / hybrid / ICE model catalog used in the EV comparison page.",
    rls: "Public SELECT.",
    columns: [
      { name: "id", type: "integer", pk: true, description: "Auto-increment primary key." },
      { name: "type", type: "text", description: "EV / PHEV / Hybrid / ICE." },
      { name: "make", type: "text", description: "Manufacturer." },
      { name: "model", type: "text", description: "Model name." },
      { name: "year", type: "smallint", description: "Model year." },
      { name: "msrp", type: "integer", description: "MSRP (USD)." },
      { name: "mi_per_kwh", type: "numeric", description: "Efficiency for EV / PHEV (mi/kWh)." },
      { name: "mpg", type: "smallint", description: "Combined MPG for ICE / hybrid." },
      { name: "range_mi", type: "smallint", description: "Range in miles." },
      { name: "used_price", type: "integer", description: "Approximate used-market price." },
      { name: "discontinued", type: "boolean", description: "True if the model is discontinued." },
    ],
    examples: [
      {
        label: "Most efficient current EVs",
        sql: `SELECT make, model, year, mi_per_kwh, range_mi, msrp
FROM vehicle_models
WHERE type = 'EV' AND discontinued = false
ORDER BY mi_per_kwh DESC NULLS LAST LIMIT 20;`,
      },
    ],
  },
  {
    name: "guide_pages",
    category: "Content",
    description: "CMS-style content for the /guides section. Populated by the refresh-guides edge function.",
    rls: "Public SELECT where published = true.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "slug", type: "text", description: "URL slug (used at /guides/:slug)." },
      { name: "title", type: "text", description: "Guide title." },
      { name: "meta_description", type: "text", description: "SEO meta description." },
      { name: "category", type: "text", description: "Guide category." },
      { name: "icon", type: "text", description: "Lucide icon name." },
      { name: "summary", type: "text", description: "Short summary shown on the index." },
      { name: "content", type: "text", description: "Markdown body." },
      { name: "published", type: "boolean", description: "Visibility flag." },
      { name: "sort_order", type: "integer", description: "Manual ordering." },
    ],
    examples: [
      { label: "All published guides", sql: `SELECT slug, title, category FROM guide_pages WHERE published ORDER BY sort_order, title;` },
    ],
  },
  {
    name: "knowledge_files",
    category: "Content",
    description: "Markdown source-of-truth files consumed by the AI recommendation flows.",
    rls: "No public policies. Reads/writes through admin edge functions only.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "name", type: "text", description: "File name / logical key." },
      { name: "content", type: "text", description: "Markdown body." },
      { name: "updated_by", type: "text", description: "Admin identifier for the last change." },
    ],
    examples: [
      { label: "List knowledge files (admin only)", sql: `SELECT name, updated_at, updated_by FROM knowledge_files ORDER BY name;` },
    ],
  },
  {
    name: "cached_stats",
    category: "Content",
    description: "Precomputed homepage stats (capacity, permit counts, etc.).",
    rls: "Public SELECT. Writes via admin/edge functions.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "stat_type", type: "text", description: "Logical key (e.g. 'solar_capacity_mw')." },
      { name: "value", type: "text", description: "Displayed value." },
      { name: "label", type: "text", description: "Displayed label." },
    ],
    examples: [
      { label: "All cached homepage stats", sql: `SELECT stat_type, value, label, updated_at FROM cached_stats ORDER BY stat_type;` },
    ],
  },
  {
    name: "volunteer_signups",
    category: "Ops",
    description: "Community/Slack signup form submissions.",
    rls: "Public INSERT with validation. No public SELECT (admin-only via edge function).",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "name", type: "text", description: "Submitter name." },
      { name: "email", type: "text", description: "Submitter email (validated)." },
      { name: "involvement_area", type: "text", description: "Chosen involvement category." },
      { name: "notes", type: "text", description: "Free-text notes." },
      { name: "user_agent", type: "text", description: "Captured user agent string." },
    ],
    examples: [
      { label: "Recent signups (admin)", sql: `SELECT name, email, involvement_area, created_at FROM volunteer_signups ORDER BY created_at DESC LIMIT 50;` },
    ],
  },
  {
    name: "admin_sessions",
    category: "Ops",
    description: "Server-side sessions issued by the admin login flow.",
    rls: "Deny all — accessed only by service-role edge functions.",
    columns: [
      { name: "id", type: "uuid", pk: true, description: "Primary key." },
      { name: "token", type: "text", description: "Session token (hashed comparison in edge functions)." },
      { name: "expires_at", type: "timestamptz", description: "Session expiration." },
    ],
    examples: [{ label: "Not queryable from the client.", sql: `-- No public access. Managed by admin edge functions.` }],
  },
];

const CATEGORIES: TableDoc["category"][] = ["Solar", "Property", "Energy", "Transportation", "Content", "Ops"];

function copySql(sql: string) {
  navigator.clipboard.writeText(sql).then(
    () => toast.success("SQL copied to clipboard"),
    () => toast.error("Could not copy"),
  );
}

export default function AdminSchemaDocs() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    const expires = sessionStorage.getItem("admin_token_expires");
    if (!token || !expires || new Date(expires) < new Date()) {
      navigate("/admin");
      return;
    }
    setAuthed(true);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TABLES;
    return TABLES.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.description.toLowerCase().includes(q)) return true;
      return t.columns.some((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    });
  }, [query]);

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Database className="h-7 w-7" />
                Schema Documentation
              </h1>
              <p className="text-sm text-muted-foreground">
                In-app reference for every public table: columns, foreign keys, and example queries.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search tables, columns, or descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Table of contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Tables</CardTitle>
            <CardDescription>{filtered.length} of {TABLES.length} tables shown</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const inCat = filtered.filter((t) => t.category === cat);
              if (inCat.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{cat}</div>
                  <ul className="space-y-1">
                    {inCat.map((t) => (
                      <li key={t.name}>
                        <a href={`#${t.name}`} className="text-sm text-primary hover:underline font-mono">
                          {t.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="space-y-8">
          {filtered.map((t) => (
            <Card key={t.name} id={t.name} className="scroll-mt-24">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="font-mono text-xl">{t.name}</CardTitle>
                  <Badge variant="secondary">{t.category}</Badge>
                </div>
                <CardDescription className="mt-2">{t.description}</CardDescription>
                <div className="text-xs text-muted-foreground mt-2">
                  <span className="font-semibold">RLS:</span> {t.rls}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Columns */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Columns</h3>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Name</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">Refs</th>
                          <th className="text-left p-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.columns.map((c) => (
                          <tr key={c.name} className="border-t align-top">
                            <td className="p-2 font-mono whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                {c.pk && <KeyRound className="h-3 w-3 text-amber-600" aria-label="Primary key" />}
                                {c.name}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-muted-foreground whitespace-nowrap">{c.type}</td>
                            <td className="p-2 whitespace-nowrap">
                              {c.fk ? (
                                <a
                                  href={`#${c.fk.table}`}
                                  className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                                >
                                  <Link2 className="h-3 w-3" />
                                  {c.fk.table}.{c.fk.column}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-2 text-muted-foreground">{c.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Examples */}
                {t.examples.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Example queries</h3>
                    <div className="space-y-3">
                      {t.examples.map((ex, i) => (
                        <div key={i} className="rounded-md border bg-muted/30">
                          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                            <span className="text-xs font-medium">{ex.label}</span>
                            <Button variant="ghost" size="sm" onClick={() => copySql(ex.sql)}>
                              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                            </Button>
                          </div>
                          <pre className="p-3 text-xs overflow-x-auto font-mono whitespace-pre">
{ex.sql}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-xs text-muted-foreground">
          <Link to="/data-sources" className="underline">Public data sources & methodology →</Link>
        </div>
      </div>
    </div>
  );
}
