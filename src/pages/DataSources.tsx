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
  Map as MapIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DataSources = () => {
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
                  <strong>Total Solar Capacity:</strong> Extracted from permit descriptions which contain 
                  "installed_kw" values. We parse these values and sum them across all installations. Some older 
                  permits may lack capacity data, which can lead to slight undercounting of total capacity.
                </div>
                <div>
                  <strong>Recent Installations:</strong> Solar permits completed or issued in the last 30 days, 
                  sorted by completion date or issue date.
                </div>
                <div>
                  <strong>Yearly Trends:</strong> Installations grouped by the calendar year the permit was issued, 
                  showing adoption momentum over time.
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
                  <strong>Austin Open Data API:</strong> Real-time queries for energy audits (dataset 77pk-yxf5), 
                  weatherization projects, and green building certifications within the target area
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
                <strong>Initial View:</strong> When you first load the map, it displays approximately 100 
                recent solar installations across Austin to show city-wide distribution.
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Zoom-Based Loading:</strong> When you zoom into a specific neighborhood (zoom level &gt; 11), 
                the map dynamically queries the Austin Open Data API to load installations relevant to that 
                geographic area. This can retrieve up to 200 installations per zoom action to show detailed 
                local adoption patterns.
              </p>
              <p className="text-muted-foreground">
                <strong>Update Frequency:</strong> Map pins reflect live data from our database, which syncs 
                regularly with the City's permit system. Zooming triggers fresh API queries for the most current 
                data in that specific area.
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
                provided throughout this page and in our footer.
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
