import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { DynamicDataProvider } from "./contexts/DynamicDataContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/newsPages";
import PoliticsNews from "./components/PoliticsNews"; // ✅ Import PoliticsNews component
import About from "./components/About";
import Contact from "./components/Contact";
import ApiTestPage from "./pages/ApiTest";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <DynamicDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/politics" element={<PoliticsNews />} /> {/* ✅ New Route */}
              <Route path="/news/:newsId" element={<NewsPage />} />
              <Route path="/api-test" element={<ApiTestPage />} /> {/* ✅ API Test Route */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicDataProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;