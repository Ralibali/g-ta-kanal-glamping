import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LanguageRedirect from "./components/LanguageRedirect";
import { usePageTracking, useAutoClickTracking } from "./hooks/useTracking";
import Index from "./pages/Index";
import CheckIn from "./pages/CheckIn";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import GlampingLinkoping from "./pages/GlampingLinkoping";
import GlampingGotaKanal from "./pages/GlampingGotaKanal";
import GlampingOstergotland from "./pages/GlampingOstergotland";
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
          <Route path="/checkin" element={<CheckIn />} />
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
