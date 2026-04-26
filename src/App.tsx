import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LanguageRedirect from "./components/LanguageRedirect";
import { usePageTracking, useAutoClickTracking } from "./hooks/useTracking";
import Index from "./pages/Index";
import CheckIn from "./pages/CheckIn";
import BookingTerms from "./pages/BookingTerms";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import GlampingLinkoping from "./pages/GlampingLinkoping";
import GlampingGotaKanal from "./pages/GlampingGotaKanal";
import GlampingOstergotland from "./pages/GlampingOstergotland";
import BoendeBergsSlussar from "./pages/BoendeBergsSlussar";
import OvernattningBergsSlussar from "./pages/OvernattningBergsSlussar";
import BoendeGotaKanal from "./pages/BoendeGotaKanal";
import GlampingVretaKloster from "./pages/GlampingVretaKloster";
import RomantiskWeekendOstergotland from "./pages/RomantiskWeekendOstergotland";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function TrackingProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();
  useAutoClickTracking();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TrackingProvider>
        <LanguageRedirect />
        <Routes>
          <Route path="/" element={<Index lang="sv" />} />
          <Route path="/en" element={<Index lang="en" />} />
          <Route path="/glamping-linkoping" element={<GlampingLinkoping />} />
          <Route path="/glamping-gota-kanal" element={<GlampingGotaKanal />} />
          <Route path="/glamping-ostergotland" element={<GlampingOstergotland />} />
          <Route path="/boende-bergs-slussar" element={<BoendeBergsSlussar />} />
          <Route path="/overnattning-bergs-slussar" element={<OvernattningBergsSlussar />} />
          <Route path="/boende-gota-kanal" element={<BoendeGotaKanal />} />
          <Route path="/glamping-vreta-kloster" element={<GlampingVretaKloster />} />
          <Route path="/romantisk-weekend-ostergotland" element={<RomantiskWeekendOstergotland />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/bokningsvillkor" element={<BookingTerms />} />
          <Route path="/blogg" element={<Blog />} />
          <Route path="/blogg/:slug" element={<BlogPost />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </TrackingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
