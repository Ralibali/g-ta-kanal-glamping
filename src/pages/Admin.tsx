import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { OverviewDashboard } from "@/components/admin/OverviewDashboard";
import { VisitorsDashboard } from "@/components/admin/VisitorsDashboard";
import { ConversionDashboard } from "@/components/admin/ConversionDashboard";
import { SeoDashboard } from "@/components/admin/SeoDashboard";
import { BlogManager } from "@/components/admin/BlogManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { AdminSettings } from "@/components/admin/AdminSettings";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar onSignOut={signOut} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <span className="font-serif font-bold text-lg">Bergs Slussar Admin</span>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Routes>
              <Route index element={<OverviewDashboard />} />
              <Route path="visitors" element={<VisitorsDashboard />} />
              <Route path="conversion" element={<ConversionDashboard />} />
              <Route path="seo" element={<SeoDashboard />} />
              <Route path="blog" element={<BlogManager />} />
              <Route path="gallery" element={<GalleryManager />} />
              <Route path="pricing" element={<PricingManager />} />
              <Route path="settings" element={<AdminSettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
