import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileEdit, Upload, GitCompare, BookOpen, LogOut, Database, Users, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    const expires = sessionStorage.getItem('admin_token_expires');
    
    if (!token || !expires) {
      navigate('/admin');
      return;
    }
    
    if (new Date(expires) < new Date()) {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token_expires');
      toast.error("Session expired. Please login again.");
      navigate('/admin');
      return;
    }
    
    setIsAuthenticated(true);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token_expires');
    toast.success("Logged out successfully");
    navigate('/admin');
  };

  if (!isAuthenticated) {
    return null;
  }

  const adminTools = [
    {
      title: "Data Corrections",
      description: "Review and correct permit data from City API. Flag duplicates, fix addresses, and manage data quality.",
      icon: FileEdit,
      path: "/admin/corrections",
      color: "text-blue-600"
    },
    {
      title: "PIR Data Import",
      description: "Import Austin Energy Program Interconnection Request (PIR) data from CSV files.",
      icon: Upload,
      path: "/admin/pir-import",
      color: "text-green-600"
    },
    {
      title: "Data Comparison",
      description: "Compare City permit data with Austin Energy PIR records. Run auto-matching and review discrepancies.",
      icon: GitCompare,
      path: "/admin/data-comparison",
      color: "text-purple-600"
    },
    {
      title: "Fiscal Year Stats",
      description: "View City permit analytics grouped by Austin's fiscal year (Oct 1 - Sept 30). Based on City of Austin permit data only.",
      icon: BarChart3,
      path: "/fiscal-year-stats",
      color: "text-orange-600"
    }
  ];

  const documentationLinks = [
    {
      title: "Knowledge Base Guide",
      description: "How to update the recommendation engine's knowledge base",
      icon: BookOpen,
      path: "/ADMIN-KNOWLEDGE-BASE.md",
      external: true
    },
    {
      title: "Data Sources",
      description: "Public documentation on data sources and methodology",
      icon: FileText,
      path: "/data-sources"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage data quality, import records, and maintain the Austin Clean Energy platform.
          </p>
        </div>

        {/* Admin Tools */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {adminTools.map((tool) => (
              <Card 
                key={tool.path} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(tool.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2 ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full">
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Documentation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Documentation & Guides
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {documentationLinks.map((doc) => (
              <Card 
                key={doc.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => doc.external ? window.open(doc.path, '_blank') : navigate(doc.path)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <doc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <CardDescription className="text-sm">{doc.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Data Integration Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Integration Overview
          </h2>
          <Card>
            <CardContent className="pt-6 prose prose-sm max-w-none">
              <h3 className="text-lg font-medium mb-3">How Data Matching Works</h3>
              <p className="text-muted-foreground mb-4">
                The system integrates two primary data sources to create a comprehensive view of solar installations in Austin:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-blue-600">City of Austin Permit Data</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Source: City of Austin Open Data API</li>
                    <li>• Contains: Addresses, permit dates, contractor info</li>
                    <li>• Strength: Location data, permit timeline</li>
                    <li>• Weakness: May have duplicates, data entry errors</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-green-600">Austin Energy PIR Data</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Source: Internal Austin Energy records</li>
                    <li>• Contains: kW capacity, interconnection dates, installers</li>
                    <li>• Strength: Accurate capacity, rebate data</li>
                    <li>• Weakness: No street addresses (privacy)</li>
                  </ul>
                </div>
              </div>

              <h4 className="font-medium mb-2">Matching Algorithm</h4>
              <p className="text-muted-foreground mb-3">
                Since PIR data lacks addresses, the system uses a multi-pass matching approach:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-4">
                <li><strong>Exact kW + Date Match:</strong> High confidence when system size and installation dates align within 30 days</li>
                <li><strong>Installer + Fiscal Year:</strong> Matches contractor names with PIR installer in same fiscal year</li>
                <li><strong>Fuzzy Installer + kW:</strong> Partial name matches with similar capacity within 6 months</li>
                <li><strong>Date + kW Only:</strong> Fallback for records without contractor info</li>
              </ol>

              <h4 className="font-medium mb-2">Confidence Scoring</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>85%+:</strong> Auto-confirmed matches</li>
                <li>• <strong>55-84%:</strong> Pending review (manual verification recommended)</li>
                <li>• <strong>&lt;55%:</strong> Not matched (requires manual linking or may be unmatched)</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
