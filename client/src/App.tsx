import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { consumeLoginReturnPath } from "@/lib/loginReturnPath";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import AdminLogoutButton from "./components/AdminLogoutButton";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import CharacterCatalog from "./pages/CharacterCatalog";
import GuideHistory from "./pages/GuideHistory";
import TranslationFeedback from "./pages/TranslationFeedback";
import AdminHome from "./pages/AdminHome";
import FeedbackAdmin from "./pages/FeedbackAdmin";

function Router() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const returnTo = consumeLoginReturnPath();
    if (returnTo && !window.location.pathname.endsWith(returnTo)) {
      setLocation(returnTo);
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/characters"} component={CharacterCatalog} />
      <Route path={"/updates"} component={GuideHistory} />
      <Route path={"/feedback"} component={TranslationFeedback} />
      <Route path={"/admin"} component={AdminHome} />
      <Route path={"/admin/feedback"} component={FeedbackAdmin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const routerBase = import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <LanguageProvider>
            <Toaster />
            <WouterRouter base={routerBase}>
              <Router />
              <AdminLogoutButton />
            </WouterRouter>
          </LanguageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
