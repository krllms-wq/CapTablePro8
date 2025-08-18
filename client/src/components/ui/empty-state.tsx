import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Plus, FileText, Users, TrendingUp, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  testId?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  testId
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)} data-testid={testId}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        {icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
        
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-md">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="flex items-center gap-2">
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
          
          {secondaryAction && (
            secondaryAction.href ? (
              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2"
              >
                <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
                  {secondaryAction.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="flex items-center gap-2"
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Predefined empty states for common use cases
export function StakeholdersEmptyState({ onAddStakeholder }: { onAddStakeholder: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-6 w-6 text-muted-foreground" />}
      title="No stakeholders yet"
      description="Start building your cap table by adding your first stakeholder. You can add founders, investors, employees, and other equity holders."
      primaryAction={{
        label: "Add First Stakeholder",
        onClick: onAddStakeholder,
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryAction={{
        label: "View Sample Data",
        href: "https://docs.captable.com/stakeholders"
      }}
      testId="stakeholders-empty-state"
    />
  );
}

export function TransactionsEmptyState({ onAddTransaction }: { onAddTransaction: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-6 w-6 text-muted-foreground" />}
      title="No transactions recorded"
      description="Track your company's equity transactions including share issuances, transfers, option grants, and more to maintain an accurate cap table."
      primaryAction={{
        label: "Record First Transaction",
        onClick: onAddTransaction,
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryAction={{
        label: "Learn About Transactions",
        href: "https://docs.captable.com/transactions"
      }}
      testId="transactions-empty-state"
    />
  );
}

export function ScenariosEmptyState({ onCreateScenario }: { onCreateScenario: () => void }) {
  return (
    <EmptyState
      icon={<TrendingUp className="h-6 w-6 text-muted-foreground" />}
      title="No scenarios saved"
      description="Create funding round scenarios to model how new investments will affect your cap table. Save scenarios to compare different outcomes."
      primaryAction={{
        label: "Model First Scenario",
        onClick: onCreateScenario,
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryAction={{
        label: "Scenario Examples",
        href: "https://docs.captable.com/scenarios"
      }}
      testId="scenarios-empty-state"
    />
  );
}

export function CompaniesEmptyState({ onCreateCompany }: { onCreateCompany: () => void }) {
  return (
    <EmptyState
      icon={<Building className="h-6 w-6 text-muted-foreground" />}
      title="No companies added"
      description="Create your first company to start managing its cap table. You can track multiple companies and switch between them easily."
      primaryAction={{
        label: "Create First Company",
        onClick: onCreateCompany,
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryAction={{
        label: "Company Setup Guide",
        href: "https://docs.captable.com/getting-started"
      }}
      testId="companies-empty-state"
    />
  );
}

export function EquityAwardsEmptyState({ onAddAward }: { onAddAward: () => void }) {
  return (
    <EmptyState
      icon={<TrendingUp className="h-6 w-6 text-muted-foreground" />}
      title="No equity awards granted"
      description="Grant stock options, RSUs, and other equity awards to employees and advisors. Track vesting schedules and exercise activity."
      primaryAction={{
        label: "Grant First Award",
        onClick: onAddAward,
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryAction={{
        label: "Equity Award Types",
        href: "https://docs.captable.com/equity-awards"
      }}
      testId="equity-awards-empty-state"
    />
  );
}