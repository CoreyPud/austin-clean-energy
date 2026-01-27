import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CityOverview from "./pages/CityOverview";
import AreaAnalysis from "./pages/AreaAnalysis";
import EmbedAreaAnalysis from "./pages/EmbedAreaAnalysis";
import PropertyAssessment from "./pages/PropertyAssessment";
import Recommendations from "./pages/Recommendations";
import InstallationDetail from "./pages/InstallationDetail";
import ImportSolarData from "./pages/ImportSolarData";
import DataSources from "./pages/DataSources";
import FiscalYearStats from "./pages/FiscalYearStats";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCorrections from "./pages/AdminCorrections";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import PIRImport from "./pages/PIRImport";
import DataComparison from "./pages/DataComparison";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/city-overview" element={<CityOverview />} />
          <Route path="/area-analysis" element={<AreaAnalysis />} />
          <Route path="/embed/area-analysis" element={<EmbedAreaAnalysis />} />
          <Route path="/property-assessment" element={<PropertyAssessment />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/installation/:id" element={<InstallationDetail />} />
          <Route path="/import-solar-data" element={<ImportSolarData />} />
          <Route path="/data-sources" element={<DataSources />} />
          <Route path="/fiscal-year-stats" element={<FiscalYearStats />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/corrections" element={<AdminCorrections />} />
          <Route path="/admin/knowledge-base" element={<AdminKnowledgeBase />} />
          <Route path="/admin/pir-import" element={<PIRImport />} />
          <Route path="/admin/data-comparison" element={<DataComparison />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
