import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { CoinProvider } from "@/contexts/CoinContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MissionsProvider } from "@/contexts/MissionsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { XPToast } from "@/components/gamification/XPToast";
import { CoinToast } from "@/components/gamification/CoinToast";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import PostDetail from "./pages/PostDetail";
import Create from "./pages/Create";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Earnings from "./pages/Earnings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Blocks rendering only while Supabase is restoring session (prevents auth flash)
function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-primary">Jara</span>
            <span className="text-2xl font-black text-foreground">Daily</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <AuthGate>
                <GamificationProvider>
                  <CoinProvider>
                    <MissionsProvider>
                      <Toaster />
                      <Sonner />
                      <XPToast />
                      <CoinToast />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/discover" element={<Discover />} />
                        <Route path="/post/:slug" element={<PostDetail />} />
                        <Route path="/create" element={<Create />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/earnings" element={<Earnings />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MissionsProvider>
                  </CoinProvider>
                </GamificationProvider>
              </AuthGate>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
