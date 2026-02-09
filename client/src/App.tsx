import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Catalog from "./pages/Catalog";
import Home from "./pages/Home";
import TPOEstimator from "./pages/TPOEstimator";
import GAFTPOEstimator from "./pages/GAFTPOEstimator";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Catalog} />
      <Route path={"/estimator/karnak-metal-kynar"} component={Home} />
      <Route path={"/estimator/carlisle-tpo"} component={TPOEstimator} />
      <Route path={"/estimator/gaf-tpo"} component={GAFTPOEstimator} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
