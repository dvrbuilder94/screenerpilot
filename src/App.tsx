import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Macro from "./pages/Macro";
import Markets from "./pages/Markets";
import Ratios from "./pages/Ratios";
import Commodities from "./pages/Commodities";
import NotFound from "./pages/NotFound";
import StockIntelligence from "./pages/StockIntelligence";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import RefundPolicy from "./pages/RefundPolicy";
import Unsubscribe from "./pages/Unsubscribe";
import Committee from "./pages/Committee";
import Settings from "./pages/Settings";
import SqueezeRadarPublic from "./pages/SqueezeRadarPublic";
import StockArticle from "./pages/StockArticle";
import Watchlist from "./pages/Watchlist";
import Home from "./pages/Home";
import TopPicks from "./pages/TopPicks";
import GemDetail from "./pages/GemDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/committee" element={<Committee />} />
              <Route path="/squeeze-radar" element={<SqueezeRadarPublic />} />
              <Route path="/squeeze-radar/:symbol" element={<StockArticle />} />
              <Route
                path="*"
                element={
                  <AppLayout>
                    <Routes>
                      <Route path="/home" element={<Home />} />
                      <Route path="/top-picks" element={<TopPicks />} />
                      <Route path="/gem/:symbol" element={<GemDetail />} />
                      <Route path="/markets" element={<Markets />} />
                      <Route path="/macro" element={<Macro />} />
                      <Route path="/ratios" element={<Ratios />} />
                      <Route path="/commodities" element={<Commodities />} />
                      <Route path="/stock-intelligence" element={<StockIntelligence />} />
                      <Route path="/watchlist" element={<Watchlist />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
