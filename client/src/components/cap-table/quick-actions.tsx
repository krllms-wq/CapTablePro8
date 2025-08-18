import { useState } from "react";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import ModelRoundDialog from "@/components/dialogs/model-round-dialog";

interface QuickActionsProps {
  companyId: string;
}

export default function QuickActions({ companyId }: QuickActionsProps) {
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);
  const [showModelRound, setShowModelRound] = useState(false);

  const actionButtons = [
    {
      title: "Issue Shares",
      icon: "fas fa-plus",
      hoverColor: "hover:border-primary hover:bg-primary/5",
      hoverIconColor: "group-hover:text-primary",
      onClick: () => setShowIssueShares(true),
    },
    {
      title: "Grant Options",
      icon: "fas fa-gift",
      hoverColor: "hover:border-secondary hover:bg-secondary/5",
      hoverIconColor: "group-hover:text-secondary",
      onClick: () => setShowGrantOptions(true),
    },
    {
      title: "Model Round",
      icon: "fas fa-chart-line",
      hoverColor: "hover:border-accent hover:bg-accent/5",
      hoverIconColor: "group-hover:text-accent",
      onClick: () => setShowModelRound(true),
    },
    {
      title: "Import Data",
      icon: "fas fa-file-import",
      hoverColor: "hover:border-purple-500 hover:bg-purple-50",
      hoverIconColor: "group-hover:text-purple-500",
      onClick: () => {
        // TODO: Implement data import
        console.log("Import data clicked");
      },
    },
  ];

  return (
    <>
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionButtons.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center justify-center p-4 border-2 border-dashed border-neutral-300 rounded-lg ${action.hoverColor} transition-colors group`}
            >
              <div className="text-center">
                <i className={`${action.icon} text-2xl text-neutral-400 ${action.hoverIconColor} mb-2`}></i>
                <p className={`text-sm font-medium text-neutral-600 ${action.hoverIconColor}`}>
                  {action.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <IssueSharesDialog
        open={showIssueShares}
        onOpenChange={setShowIssueShares}
        companyId={companyId}
      />

      <GrantOptionsDialog
        open={showGrantOptions}
        onOpenChange={setShowGrantOptions}
        companyId={companyId}
      />

      <ModelRoundDialog
        open={showModelRound}
        onOpenChange={setShowModelRound}
        companyId={companyId}
      />
    </>
  );
}
