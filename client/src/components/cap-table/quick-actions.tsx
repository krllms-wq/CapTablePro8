import { useState } from "react";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import { SafeAgreementDialog } from "@/components/dialogs/safe-agreement-dialog";
import { ConvertibleNoteDialog } from "@/components/dialogs/convertible-note-dialog";
import { SecondaryTransactionDialog } from "@/components/dialogs/secondary-transaction-dialog";

interface QuickActionsProps {
  companyId: string;
}

export default function QuickActions({ companyId }: QuickActionsProps) {
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);
  const [showSafe, setShowSafe] = useState(false);
  const [showConvertible, setShowConvertible] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);

  const actionButtons = [
    {
      title: "Issue Shares",
      icon: "fas fa-dollar-sign",
      hoverColor: "hover:border-green-500 hover:bg-green-50",
      hoverIconColor: "group-hover:text-green-600",
      onClick: () => setShowIssueShares(true),
    },
    {
      title: "Grant Options",
      icon: "fas fa-trending-up",
      hoverColor: "hover:border-blue-500 hover:bg-blue-50",
      hoverIconColor: "group-hover:text-blue-600",
      onClick: () => setShowGrantOptions(true),
    },
    {
      title: "SAFE Agreement",
      icon: "fas fa-shield-alt",
      hoverColor: "hover:border-purple-500 hover:bg-purple-50",
      hoverIconColor: "group-hover:text-purple-600",
      onClick: () => setShowSafe(true),
    },
    {
      title: "Convertible Note",
      icon: "fas fa-file-contract",
      hoverColor: "hover:border-orange-500 hover:bg-orange-50",
      hoverIconColor: "group-hover:text-orange-600",
      onClick: () => setShowConvertible(true),
    },
    {
      title: "Secondary Transfer",
      icon: "fas fa-exchange-alt",
      hoverColor: "hover:border-cyan-500 hover:bg-cyan-50",
      hoverIconColor: "group-hover:text-cyan-600",
      onClick: () => setShowSecondary(true),
    },
    {
      title: "Model Round",
      icon: "fas fa-chart-line",
      hoverColor: "hover:border-primary hover:bg-primary/5",
      hoverIconColor: "group-hover:text-primary",
      onClick: () => window.location.href = `/companies/${companyId}/scenarios`,
    },
  ];

  return (
    <>
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <SafeAgreementDialog
        open={showSafe}
        onOpenChange={setShowSafe}
      />

      <ConvertibleNoteDialog
        open={showConvertible}
        onOpenChange={setShowConvertible}
      />

      <SecondaryTransactionDialog
        open={showSecondary}
        onOpenChange={setShowSecondary}
      />
    </>
  );
}
