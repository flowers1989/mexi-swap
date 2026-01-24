import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Web3Provider } from "./contexts/Web3Context";
import Home from "./pages/Home";
import Swap from "./pages/Swap";
import Pool from "./pages/Pool";
import Migrate from "./pages/Migrate";
import Tokenomics from "./pages/Tokenomics";
import Farm from "./pages/Farm";
import Perpetuals from "./pages/Perpetuals";
import Launchpad from "./pages/Launchpad";
import Governance from "./pages/Governance";
import Analytics from "./pages/Analytics";
import Referrals from "./pages/Referrals";
import TraderProfile from "./pages/TraderProfile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/swap" component={Swap} />
      <Route path="/pool" component={Pool} />
      <Route path="/migrate" component={Migrate} />
      <Route path="/tokenomics" component={Tokenomics} />
      <Route path="/farm" component={Farm} />
      <Route path="/perpetuals" component={Perpetuals} />
      <Route path="/launchpad" component={Launchpad} />
      <Route path="/governance" component={Governance} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/profile" component={TraderProfile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <Web3Provider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
