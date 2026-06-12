import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  BarChart3,
  Building2,
  Battery,
  Map as MapIcon,
  Calendar,
  Zap,
  BookOpen,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";

const DataSources = () => {
  useSeo({
    title: "Data Sources",
    description: "Learn about the open data sources powering Austin's clean energy dashboard including solar permits, energy audits, and green building data.",
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Data Sources & Methodology</h1>
          <p className="text-lg text-muted-foreground">
            Understanding how we collect, process, and present clean energy data for Austin. 
            This page provides transparency into our data sources, calculation methods, and limitations.
          </p>
        </div>

        {/* City Wide Progress Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">City-Wide Progress</CardTitle>
            </div>
            <CardDescription>
              How we track Austin's clean energy adoption and progress over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Primary Data Source
              </h3>
              <p className="text-muted-foreground mb-3">
                Solar installation data comes from the <strong>City of Austin Open Data Portal</strong>, 
                specifically the Building & Development Permits dataset. We filter for permits with 
                work_class='Auxiliary Power' which captures solar photovoltaic installations.
              </p>
              <Alert className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dataset ID:</strong> 3syk-w9eu | <strong>API Endpoint:</strong> data.austintexas.gov
                </AlertDescription>
              </Alert>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Data Updates & Caching
              </h3>
              <p className="text-muted-foreground mb-2">
                <strong>Update Frequency:</strong> City data is updated by Austin's building department 
                as permits are issued and projects are completed. Our system syncs this data regularly.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Caching Strategy:</strong> Statistics shown on the City Overview page are cached 
                in our database for performance. When you visit the page, you see cached stats immediately, 
                and the system refreshes them in the background.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Calculations Explained</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <strong>Total Solar Installations:</strong> Count of all solar permits in our database 
                  with status='Issued' or status='Complete'. This represents permitted solar projects across Austin.
                </div>
                <div>
                  <strong>kW This Year:</strong> Sum of installed capacity (kilowatts) for all installations 
                  completed in the current calendar year. Note that not all permits have kW values reported in 
                  the permit data—some older or incomplete records may be missing this information, which can 
                  result in undercounting of actual capacity.
                </div>
                <div>
                  <strong>Installations This Year:</strong> Count of solar permits completed in the current 
                  calendar year, based on the completed_date field.
                </div>
                <div>
                  <strong>Recent Installations:</strong> Solar permits completed or issued in the last 30 days, 
                  sorted by completion date or issue date.
                </div>
                <div>
                  <strong>Solar Installations Over Time:</strong> Installations are grouped by the calendar 
                  quarter the permit was issued. The chart offers two toggles — <em>Cumulative vs. Per-Quarter</em> 
                  and <em>Property Count vs. Capacity (kW)</em> — and defaults to a cumulative property-count view. 
                  Incomplete quarters (the current quarter and any future quarters) are excluded so trend lines 
                  are not skewed by partial data.
                </div>
                <div>
                  <strong>Permit Processing Time:</strong> Average number of days between the Applied Date 
                  (when the permit application was submitted) and the Completed Date (when the installation was 
                  finished). This metric is calculated by grouping permits by the year they were applied for, 
                  then averaging the time difference for all completed permits in that year. Only permits with 
                  both dates recorded are included in this calculation.
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Known Limitations:</strong> Permit data reflects when projects are permitted, not 
                necessarily when they become operational. Some small residential installations may not require 
                permits and won't appear in this dataset. Installation capacity data is extracted from text 
                descriptions and may have gaps for older permits that didn't include this information in a 
                standardized format.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Analyze Your Neighborhood Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <MapIcon className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Analyze Your Neighborhood</CardTitle>
            </div>
            <CardDescription>
              How we generate neighborhood-level insights and adoption patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Sources
              </h3>
              <p className="text-muted-foreground mb-3">
                Neighborhood analysis combines multiple data streams:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Solar Installation Database:</strong> Our local database of solar installations 
                  (sourced from Austin Open Data) filtered by ZIP code or geographic coordinates
                </li>
                <li>
                  <strong>Austin Open Data API:</strong> Real-time queries against the Issued
                  Construction Permits dataset (3syk-w9eu) for solar installations within the
                  target area
                </li>
                <li>
                  <strong>Geographic Boundaries:</strong> ZIP code boundaries and council district assignments 
                  for regional comparisons
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Map Data Loading
              </h3>
              <p className="text-muted-foreground mb-2">
                <strong>Full Dataset Rendering:</strong> The map loads every geocoded solar installation in our 
                database at once and renders them as a clustered point layer. Clusters expand into individual 
                pins as you zoom in, so you can browse city-wide patterns and drill down to a single block 
                without additional loading steps.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Auto-Fit Viewport:</strong> On first load, the map automatically centers on the 
                centroid of all installations and zooms so the full bounding box fits within ~20px of padding. 
                This keeps the initial view tightly framed around real data rather than a hardcoded city center.
              </p>
              <p className="text-muted-foreground">
                <strong>Update Frequency:</strong> Map pins reflect data from our database, which syncs 
                regularly with the City of Austin's permit system. Manually corrected records (see Data 
                Verification below) are shown in place of the raw values.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Analysis Approach</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <strong>Installation Density:</strong> Calculated as the number of solar installations per 
                  1,000 households in the ZIP code or geographic area. This normalizes for neighborhood size 
                  to enable fair comparisons.
                </div>
                <div>
                  <strong>Adoption Trends:</strong> Year-over-year growth in installations within the area, 
                  showing whether the neighborhood is accelerating or plateauing in clean energy adoption.
                </div>
                <div>
                  <strong>AI-Generated Insights:</strong> Our AI considers the quantitative data (installation 
                  counts, capacity, trends) along with contextual information about Austin's clean energy 
                  programs to generate personalized recommendations and highlight opportunities specific to 
                  your neighborhood.
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Gaps & Discrepancies:</strong> Not all installations have precise geographic 
                coordinates, which can lead to some permits being excluded from neighborhood-level analysis. 
                ZIP code boundaries may not perfectly align with how residents think about neighborhoods. 
                Very small neighborhoods or newly developed areas may have insufficient data for meaningful 
                statistical comparisons.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Property Assessment Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Property Assessment</CardTitle>
            </div>
            <CardDescription>
              How we analyze individual properties and generate solar potential estimates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Sources
              </h3>
              <p className="text-muted-foreground mb-3">
                Property assessments combine multiple specialized data sources:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Google Maps Geocoding API:</strong> Converts the street address you enter into 
                  precise latitude/longitude coordinates and standardizes the address format
                </li>
                <li>
                  <strong>Google Solar API:</strong> Analyzes satellite imagery and 3D building models to 
                  calculate roof area, solar panel capacity, sun exposure hours, and shading patterns for 
                  the specific property
                </li>
                <li>
                  <strong>Austin Green Building Database:</strong> City of Austin's database of certified 
                  green buildings, energy audits, and efficiency upgrades. We query this for similar property 
                  types in your area to establish benchmarks
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Assessment Process
              </h3>
              <p className="text-muted-foreground mb-2">
                <strong>Step 1 - Address Validation:</strong> Your address is geocoded and verified against 
                Google's address database to ensure accuracy.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Step 2 - Solar Analysis:</strong> Google Solar API performs a roof-by-roof analysis 
                using recent satellite imagery, measuring available roof area, optimal panel placement, 
                expected sun hours per year, and accounting for nearby tree shading or building shadows.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Step 3 - Local Benchmarking:</strong> We query Austin's Green Building records for 
                similar properties (same type, nearby location) to understand typical energy and water savings 
                achieved by comparable properties that have implemented efficiency upgrades.
              </p>
              <p className="text-muted-foreground">
                <strong>Step 4 - AI-Generated Assessment:</strong> Our AI considers the solar potential data, 
                local benchmarks, and Austin's climate characteristics to generate personalized recommendations 
                including the Energy Efficiency grade and top ROI upgrade opportunities.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Metrics Explained</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <strong>Solar Potential Score:</strong> Based on available roof area, optimal panel placement, 
                  and annual sunshine hours from Google Solar API. Higher scores indicate properties well-suited 
                  for solar installation.
                </div>
                <div>
                  <strong>Energy Efficiency Rating (A-F):</strong> This is an <strong>AI-generated estimate</strong>, 
                  not a formal energy audit rating. The AI considers your roof area, solar potential, sunshine 
                  hours, and benchmarks from similar Austin properties to generate a qualitative grade. This 
                  provides directional guidance but should be verified with a professional energy audit for 
                  precise ratings and rebate eligibility.
                </div>
                <div>
                  <strong>ROI Recommendations:</strong> Top 3 upgrades are identified by the AI based on typical 
                  payback periods for similar properties in Austin, available incentive programs, and the 
                  property's specific characteristics from the Google Solar analysis.
                </div>
                <div>
                  <strong>Green Building Comparison:</strong> Average star rating, energy savings percentage, 
                  and water savings percentage from certified green buildings of similar property types in your 
                  area, sourced from Austin's Green Building Database.
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important Limitations:</strong> Google Solar API coverage is not 100% complete - some 
                properties may not have recent satellite imagery or 3D building models available, which would 
                prevent solar analysis. The Energy Efficiency rating is an AI estimate, not an official HERS 
                rating or professional audit. Actual solar potential can be affected by local factors not 
                captured in satellite imagery (e.g., upcoming construction, HOA restrictions, roof condition). 
                We strongly recommend getting a professional site assessment before making solar installation 
                decisions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Personalized Plan Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Battery className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Personalized Plan</CardTitle>
            </div>
            <CardDescription>
              How we generate customized clean energy recommendations based on your lifestyle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Sources
              </h3>
              <p className="text-muted-foreground mb-3">
                Personalized recommendations draw from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Your Lifestyle Assessment:</strong> Information you provide about housing type, 
                  transportation patterns, energy usage, and household characteristics
                </li>
                <li>
                  <strong>Austin Clean Energy Programs:</strong> Current incentive programs, rebates, and 
                  resources from Austin Energy, City of Austin, and federal programs available to Austin residents
                </li>
                <li>
                  <strong>Priority Framework:</strong> A structured framework that ranks clean energy actions 
                  by impact potential (emissions reduction, cost savings) and applicability to your situation
                </li>
                <li>
                  <strong>Research & Best Practices:</strong> Evidence-based data on typical payback periods, 
                  adoption barriers, and effectiveness of different clean energy strategies in Austin's climate
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Recommendation Generation Process
              </h3>
              <p className="text-muted-foreground mb-2">
                <strong>Step 1 - Assessment Analysis:</strong> Your lifestyle data is analyzed to understand 
                your energy usage patterns, transportation needs, and housing characteristics.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Step 2 - Opportunity Identification:</strong> Based on your profile, the system identifies 
                which clean energy actions are most relevant and impactful for your situation (e.g., someone who 
                rents won't get solar panel recommendations, but will get renter-appropriate efficiency tips).
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Step 3 - Resource Matching:</strong> The system matches relevant Austin-specific programs, 
                incentives, and resources to your identified opportunities.
              </p>
              <p className="text-muted-foreground">
                <strong>Step 4 - AI Synthesis:</strong> Our AI considers your lifestyle data and the matched 
                programs to generate a prioritized action plan with specific next steps, expected outcomes, 
                and links to relevant resources.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">How Recommendations Are Prioritized</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <strong>Impact Potential:</strong> Actions that offer the greatest emissions reductions and 
                  cost savings for your specific situation are ranked higher.
                </div>
                <div>
                  <strong>Feasibility:</strong> Recommendations consider barriers like upfront cost, renter vs. 
                  owner status, and implementation complexity. Highly feasible actions are prioritized.
                </div>
                <div>
                  <strong>Quick Wins vs. Long-term Projects:</strong> The plan includes both immediate low-cost 
                  actions (e.g., behavioral changes, small purchases) and longer-term investments (e.g., solar, 
                  EV) to create a balanced roadmap.
                </div>
                <div>
                  <strong>Local Context:</strong> Recommendations account for Austin-specific factors like climate 
                  (cooling-dominated), available incentives, and local program eligibility requirements.
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Keeping Content Current
              </h3>
              <p className="text-muted-foreground">
                Our knowledge base of Austin programs and resources is maintained to reflect current offerings. 
                However, incentive programs can change, funding can be exhausted, and new opportunities emerge. 
                We recommend verifying program availability and details directly with providers before making 
                major decisions. AI-generated content is based on information available at the time and should 
                be used as directional guidance, not as guaranteed financial projections.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Limitations:</strong> Recommendations are based on general patterns and averages for 
                similar households. Your actual costs, savings, and outcomes will vary based on factors we 
                don't capture in the assessment (e.g., home condition, energy rates, usage patterns, contractor 
                pricing, available rebate funding at time of application). The AI provides personalized guidance, 
                but specific financial decisions should be made after consulting with relevant service providers 
                and reviewing current program terms.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Fiscal Year Statistics Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Fiscal Year Statistics</CardTitle>
            </div>
            <CardDescription>
              How we group and analyze solar installation trends by Austin's fiscal year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Fiscal Year Definition
              </h3>
              <p className="text-muted-foreground mb-3">
                Austin's fiscal year runs from <strong>October 1 through September 30</strong>. For example, 
                FY2024 covers October 1, 2023 through September 30, 2024. This aligns with how the City of Austin 
                budgets and reports, making our trends directly comparable to city planning documents and Austin Energy 
                reporting.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Metrics & Calculations</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <strong>Installation Count:</strong> Total solar permits completed within the fiscal year, 
                  based on the completed_date field. Flagged duplicate records are excluded from counts.
                </div>
                <div>
                  <strong>Battery Storage Count:</strong> Permits identified as battery or energy storage 
                  installations based on permit description keywords. These are tracked separately from solar PV.
                </div>
                <div>
                  <strong>Total Capacity (kW):</strong> Sum of installed kilowatt capacity for all installations 
                  in the fiscal year. As noted elsewhere, not all permits include kW values, so this may 
                  undercount actual installed capacity.
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> The fiscal year view may show different totals than the calendar year 
                view on the City Overview page because they group the same data by different date boundaries. 
                Neither is wrong — they reflect different reporting conventions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Data Verification Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Data Verification & Corrections</CardTitle>
            </div>
            <CardDescription>
              How we improve data quality beyond what the raw permit records provide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Manual Correction Process</h3>
              <p className="text-muted-foreground mb-3">
                Raw permit data from the City of Austin sometimes contains errors — incorrect addresses, 
                missing capacity values, duplicate entries, or inaccurate dates. When we identify these issues, 
                we apply manual corrections that override the raw data for public display while preserving 
                the original record for transparency.
              </p>
              <p className="text-muted-foreground">
                The correction system prioritizes manually verified data over raw API data. If a correction 
                exists for a record, the corrected values are shown on all public-facing pages. If no correction 
                exists, the original City data is displayed as-is.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Duplicate Detection</h3>
              <p className="text-muted-foreground">
                Some solar projects appear multiple times in the permit database — for example, when a permit 
                is reissued or when separate electrical and building permits are filed for the same installation. 
                We flag suspected duplicates so they are excluded from aggregate counts and capacity totals. 
                This prevents inflating the number of actual solar installations in Austin.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Transparency Note:</strong> Individual installation detail pages indicate whether 
                a record has been manually corrected, so you can always see if the data you're viewing 
                has been adjusted from its original source.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Decarb Dashboard Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Path to Net Zero Simulator</CardTitle>
            </div>
            <CardDescription>
              An interactive tool for exploring Austin Energy's 2035 zero-emissions goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                About This Tool
              </h3>
              <p className="text-muted-foreground mb-3">
                The Net Zero Simulator is an <strong>external interactive tool</strong> embedded on our site. 
                It models scenarios for how Austin Energy could reach its goal of 100% carbon-free electricity 
                generation by 2035, allowing users to adjust variables like solar capacity, wind generation, 
                battery storage, and demand response.
              </p>
              <p className="text-muted-foreground">
                This tool is hosted separately and its data sources and methodology are maintained independently 
                from the rest of this site. The simulator uses publicly available Austin Energy generation data 
                and planning documents as its baseline.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Because this is an externally hosted tool, its data may update on a 
                different schedule than the rest of this site. Scenario results are illustrative models, 
                not predictions — actual grid outcomes depend on many factors beyond what any simulator 
                can capture.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Guides Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Educational Guides</CardTitle>
            </div>
            <CardDescription>
              How our guide articles are created and maintained
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Content Generation</h3>
              <p className="text-muted-foreground mb-3">
                Our guide articles are <strong>AI-generated from a curated knowledge base</strong> of Austin-specific 
                clean energy information. This knowledge base includes details about local incentive programs, 
                rebate amounts, eligibility requirements, provider information, and best practices — all 
                reviewed and maintained by our team.
              </p>
              <p className="text-muted-foreground">
                Each guide is written to answer common questions Austin residents have about topics like solar 
                rebates, EV charging, home weatherization, and battery storage. The AI synthesizes the knowledge 
                base into readable articles that include both benefits and honest drawbacks of each option.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Keeping Guides Current
              </h3>
              <p className="text-muted-foreground">
                When Austin Energy programs change, rebate amounts are updated, or new incentives become 
                available, we update our knowledge base and regenerate the affected guides. However, program 
                details can change at any time — we always recommend verifying current terms directly with 
                the program provider before making financial decisions.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Disclaimer:</strong> Guide content is educational and informational. It does not 
                constitute financial, legal, or professional advice. Specific rebate amounts, eligibility 
                criteria, and program availability should be confirmed with Austin Energy or the relevant 
                provider.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* TCAD / WCAD Parcel Data Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Property & Parcel Data (TCAD / WCAD)</CardTitle>
            </div>
            <CardDescription>
              County appraisal district records used to enrich property-level context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Primary Data Sources
              </h3>
              <p className="text-muted-foreground mb-3">
                We maintain a snapshot of parcel records from the two appraisal districts that cover the
                Austin metro:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">
                <li>
                  <strong>Travis Central Appraisal District (TCAD)</strong> — ~390,000 properties.{" "}
                  <a href="https://traviscad.org/property-data" target="_blank" rel="noopener noreferrer"
                     className="text-primary underline hover:text-primary/80">traviscad.org</a>
                </li>
                <li>
                  <strong>Williamson Central Appraisal District (WCAD)</strong> — ~61,000 properties in the
                  portion of Williamson County served by Austin Energy.{" "}
                  <a href="https://www.wcad.org/data-downloads/" target="_blank" rel="noopener noreferrer"
                     className="text-primary underline hover:text-primary/80">wcad.org</a>
                </li>
              </ul>
              <Alert className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Source format:</strong> Public bulk data files published by each appraisal district.
                  We download, normalize, and load them into a single parcel table keyed by the county
                  Property ID (PID).
                </AlertDescription>
              </Alert>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Fields We Retain</h3>
              <p className="text-muted-foreground mb-2">
                For each parcel we keep a deliberately small set of fields relevant to clean-energy analysis:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Situs address &amp; ZIP</strong> — the physical property location</li>
                <li><strong>County</strong> — Travis or Williamson</li>
                <li><strong>Property type &amp; land use description</strong> — e.g. single family, condo, commercial</li>
                <li><strong>Year built</strong></li>
                <li><strong>Estimated roof square footage</strong> — derived from improvement records</li>
                <li><strong>Market value</strong> — current appraised market value</li>
                <li><strong>Owner name (prior year)</strong> — as published by the district</li>
                <li><strong>State property classification code</strong> (<code>stat_cd</code>)</li>
                <li><strong>In Austin Energy service area</strong> — boolean flag computed from ZIP / territory</li>
                <li><strong>Has solar</strong> — boolean derived by matching the parcel address against our solar permit dataset</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                How We Use It
              </h3>
              <p className="text-muted-foreground mb-2">
                Parcel data is used as a denominator and enrichment layer rather than a standalone metric.
                Specifically it powers:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Solar adoption rates by ZIP (solar permits ÷ eligible parcels)</li>
                <li>Rough roof-area and system-size sanity checks on property assessments</li>
                <li>Filtering analyses to the Austin Energy service territory</li>
                <li>Identifying properties that do <em>not</em> yet have solar for opportunity sizing</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Limitations:</strong> Appraisal data is a point-in-time snapshot and can lag real-world
                changes by months. Estimated roof square footage is derived from improvement records and is
                approximate — it does not account for roof pitch, shading, obstructions, or non-usable area.
                Market values reflect the appraisal district's methodology, not sale prices. The{" "}
                <em>has_solar</em> flag depends on successful address matching to permit records and will
                under-count installations where the parcel address and permit address differ.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>



        {/* General Notes Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">General Data Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">AI-Generated Content</h3>
              <p className="text-muted-foreground">
                Throughout this platform, we use AI to synthesize data from multiple sources and generate 
                insights, recommendations, and assessments. When you see AI-generated content, it means the 
                AI has considered the relevant data sources and expert context to provide personalized information 
                tailored to your situation. While AI is powerful for pattern recognition and synthesis, all 
                AI-generated guidance should be considered directional rather than prescriptive. For major 
                financial decisions, we recommend professional consultation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Data Quality & Verification</h3>
              <p className="text-muted-foreground mb-2">
                We prioritize using official, verified data sources from the City of Austin and reputable 
                providers like Google. However, no dataset is perfect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Permit data may lag behind actual project completion</li>
                <li>Address geocoding may not always pinpoint exact property boundaries</li>
                <li>Satellite imagery used for solar analysis may be several months old</li>
                <li>Program information may change between our updates and your viewing</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Transparency Commitment</h3>
              <p className="text-muted-foreground">
                This page exists because we believe users should understand where data comes from and how 
                metrics are calculated. If you notice discrepancies, have questions about our methodology, 
                or want to verify specific data points, we encourage you to consult the original source links 
                provided throughout this page and in our footer. You can also{" "}
                <a href="/contact" className="text-primary underline hover:text-primary/80 transition-colors">
                  contact us directly
                </a>{" "}
                — we'd love to hear from you.
              </p>
            </div>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>This Page Is Maintained:</strong> As we update data sources, modify calculation 
                methods, or add new features to the platform, this page will be updated to reflect those 
                changes.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DataSources;
