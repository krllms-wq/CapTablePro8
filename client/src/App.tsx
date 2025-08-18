import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
