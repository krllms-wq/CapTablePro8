import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Stakeholders from "@/pages/stakeholders";
import StakeholderDetail from "@/pages/stakeholder-detail";
import Transactions from "@/pages/transactions";
import CompanySetup from "@/pages/company-setup";
import EquityAwards from "@/pages/equity-awards";
import Scenarios from "@/pages/scenarios";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/setup" component={CompanySetup} />
      <Route path="/stakeholders" component={Stakeholders} />
      <Route path="/stakeholders/:stakeholderId" component={StakeholderDetail} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/equity-awards" component={EquityAwards} />
      <Route path="/scenarios" component={Scenarios} />
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
