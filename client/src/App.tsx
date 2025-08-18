import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { EnhancedToaster } from "@/components/ui/enhanced-toast";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { SkipLink } from "@/components/ui/skip-link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Stakeholders from "@/pages/stakeholders";
import StakeholderDetail from "@/pages/stakeholder-detail";
import Transactions from "@/pages/transactions";
import TransactionDetail from "@/pages/transaction-detail";
import TransactionEdit from "@/pages/transaction-edit";
import CompanySetup from "@/pages/company-setup";
import CompaniesPage from "@/pages/companies";
import EquityAwards from "@/pages/equity-awards";
import Scenarios from "@/pages/scenarios";
import Profile from "@/pages/profile";
import CapTableShare from "@/pages/cap-table-share";
import NotFound from "@/pages/not-found";
import Error404 from "@/pages/error-404";
import Error500 from "@/pages/error-500";
import UXShowcase from "@/pages/ux-showcase";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-xl mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/shared/:token" component={CapTableShare} />
      
      {/* Auth-gated routes */}
      {!isAuthenticated ? (
        <Route path="*" component={Landing} />
      ) : (
        <>
          <Route path="/" component={CompaniesPage} />
          <Route path="/companies" component={CompaniesPage} />
          <Route path="/companies/:companyId" component={Dashboard} />
          <Route path="/companies/:companyId/stakeholders" component={Stakeholders} />
          <Route path="/companies/:companyId/stakeholders/:stakeholderId" component={StakeholderDetail} />
          <Route path="/companies/:companyId/transactions" component={Transactions} />
          <Route path="/companies/:companyId/transactions/:transactionId/edit" component={TransactionEdit} />
          <Route path="/companies/:companyId/transactions/:transactionId" component={TransactionDetail} />
          <Route path="/companies/:companyId/equity-awards" component={EquityAwards} />
          <Route path="/companies/:companyId/scenarios" component={Scenarios} />
          <Route path="/setup" component={CompanySetup} />
          <Route path="/profile" component={Profile} />
          <Route path="/ux-showcase" component={UXShowcase} />
          <Route path="/error-500" component={Error500} />
          <Route component={Error404} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalErrorBoundary>
        <TooltipProvider>
          <SkipLink href="#main-content">Skip to main content</SkipLink>
          <EnhancedToaster />
          <Router />
        </TooltipProvider>
      </GlobalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
