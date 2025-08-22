import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TabItem {
  id: string;
  label: string;
  current?: boolean;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  tabs?: TabItem[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    disabled?: boolean;
  }>;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  tabs,
  primaryAction,
  secondaryActions = [],
}: PageHeaderProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-xl mb-xl">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-sm mb-md text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-muted mx-sm" />}
              {crumb.href ? (
                <a 
                  href={crumb.href} 
                  className="text-muted hover:text-fg transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-muted">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex items-start justify-between mb-lg">
        <div>
          <h1 className="text-h1 font-semibold text-fg">{title}</h1>
          {subtitle && (
            <p className="text-body text-muted mt-sm">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex items-center gap-md">
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
            
            {primaryAction && (
              <Button
                variant={primaryAction.variant || "default"}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-border">
          <nav className="flex space-x-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`pb-md border-b-2 transition-colors font-medium text-sm ${
                  tab.current
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-fg hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}