import { SiteHeader } from "@/components/header/site-header";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="ingest-site-theme">
        <div className="border-grid flex flex-1 flex-col">
          <SiteHeader />
          <main className="flex flex-1 flex-col">
            <Outlet />
          </main>
        </div>
        <Toaster richColors duration={3000} closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  ),
});
