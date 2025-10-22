import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AreaAnalysis from "./pages/AreaAnalysis";
import EmbedAreaAnalysis from "./pages/EmbedAreaAnalysis";
import PropertyAssessment from "./pages/PropertyAssessment";
import Recommendations from "./pages/Recommendations";
import InstallationDetail from "./pages/InstallationDetail";
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
          <Route path="/area-analysis" element={<AreaAnalysis />} />
          <Route path="/embed/area-analysis" element={<EmbedAreaAnalysis />} />
          <Route path="/property-assessment" element={<PropertyAssessment />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/installation/:id" element={<InstallationDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
