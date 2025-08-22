import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { clientDebugger } from "@/utils/debug";
import CompanyLayout from "@/components/layout/company-layout";
import CapTableStats from "@/components/cap-table/cap-table-stats";
import CapTableMain from "@/components/cap-table/cap-table-main";
import OwnershipChart from "@/components/cap-table/ownership-chart";
import RecentActivity from "@/components/cap-table/recent-activity";
import NewTransactionButton from "@/components/new-transaction-button";
import { Button } from "@/components/ui/button";
import IssueSharesDialog from "@/components/dialogs/issue-shares-dialog";
import GrantOptionsDialog from "@/components/dialogs/grant-options-dialog";
import SafeAgreementDialog from "@/components/dialogs/safe-agreement-dialog";
import ConvertibleNoteDialog from "@/components/dialogs/convertible-note-dialog";
import { SecondaryTransactionDialog } from "@/components/dialogs/secondary-transaction-dialog";
import { SAFEConversionDialog } from "@/components/dialogs/safe-conversion-dialog";
import { NoteConversionDialog } from "@/components/dialogs/note-conversion-dialog";
import FundingRoundDialog from "@/components/dialogs/funding-round-dialog";

import type { Company } from "@shared/schema";

export default function Dashboard() {
  // All hooks must be called at the top level, before any conditional returns
  const { companyId } = useParams();
  
  // State hooks
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);
  const [showSafeAgreement, setShowSafeAgreement] = useState(false);
  const [showConvertibleNote, setShowConvertibleNote] = useState(false);
  const [showSecondaryTransaction, setShowSecondaryTransaction] = useState(false);
  const [showSafeConversion, setShowSafeConversion] = useState(false);
  const [showNoteConversion, setShowNoteConversion] = useState(false);
  const [showFundingRound, setShowFundingRound] = useState(false);
  const [selectedConvertible, setSelectedConvertible] = useState<any>(null);
  
  // Query hooks
  const { data: capTableData, isLoading: capTableLoading } = useQuery<{
    stats: { totalShares: number; totalOptions: number; totalConvertibles: number; stakeholderCount: number };
    capTable: Array<{ stakeholder: string; shares: number; options: number; convertibles?: number; percentage: string; value: number }>;
    convertibles: Array<{ id: string; type: string; holderName: string; principal: number; framework?: string; discountRate?: number; valuationCap?: number; issueDate: string }>;
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  // Debug logging to track renders and hook order
  useEffect(() => {
    const hooksUsed = [
      'useParams',
      'useState (x9)', // 9 state hooks
      'useQuery (x1)', // 1 query hooks
      'useEffect (debug)'
    ];
    
    clientDebugger.logRender('Dashboard', { 
      companyId, 
      capTableLoading 
    }, hooksUsed);

    // Log query states
    if (companyId) {
      clientDebugger.logQuery(["/api/companies", companyId, "cap-table"], capTableLoading ? 'loading' : 'success', capTableData);
    }
  });

  return (
    <CompanyLayout>
      <div className="flex justify-end mb-6">
        <div className="flex space-x-3">
          <NewTransactionButton 
            onTransactionSelect={(type) => {
              if (type === "funding-round") setShowFundingRound(true);
              if (type === "shares") setShowIssueShares(true);
              if (type === "options") setShowGrantOptions(true);
              if (type === "safe") setShowSafeAgreement(true);
              if (type === "convertible") setShowConvertibleNote(true);
              if (type === "secondary") setShowSecondaryTransaction(true);
            }}
          />
          <Button variant="outline" className="flex items-center gap-2">
            <i className="fas fa-download"></i>Export
          </Button>
        </div>
      </div>

        {/* Stats */}
        <CapTableStats 
          stats={capTableData?.stats ? {
            totalShares: capTableData.stats.totalShares,
            fullyDilutedShares: capTableData.stats.totalShares + capTableData.stats.totalOptions,
            currentValuation: null,
            fullyDilutedValuation: null,
            optionPoolAvailable: capTableData.stats.totalOptions,
            valuationSource: undefined
          } : undefined} 
          isLoading={capTableLoading} 
        />

        {/* Main Cap Table */}
        <CapTableMain 
          capTable={capTableData?.capTable?.map(row => ({
            stakeholder: { name: row.stakeholder },
            securityClass: { name: "Common Stock" },
            shares: row.shares,
            ownership: parseFloat(row.percentage),
            investment: 0,
            investmentAmount: 0,
            value: row.value || 0,
            convertibles: row.convertibles || 0
          })) || []} 
          convertibles={capTableData?.convertibles || []}
          isLoading={capTableLoading}
          onConvertSafe={(convertible) => {
            setSelectedConvertible(convertible);
            setShowSafeConversion(true);
          }}
          onConvertNote={(convertible) => {
            setSelectedConvertible(convertible);
            setShowNoteConversion(true);
          }}
        />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OwnershipChart capTable={capTableData?.capTable?.map(row => ({
            stakeholder: { name: row.stakeholder },
            securityClass: { name: "Common Stock" },
            shares: row.shares,
            ownership: parseFloat(row.percentage),
            value: row.value
          })) || []} />
          <RecentActivity companyId={companyId!} />
        </div>

      {/* Dialog components */}
      <IssueSharesDialog
        open={showIssueShares}
        onOpenChange={setShowIssueShares}
        companyId={companyId!}
      />

      <GrantOptionsDialog
        open={showGrantOptions}
        onOpenChange={setShowGrantOptions}
        companyId={companyId!}
      />

      <SafeAgreementDialog
        open={showSafeAgreement}
        onOpenChange={setShowSafeAgreement}
        companyId={companyId!}
      />

      <ConvertibleNoteDialog
        open={showConvertibleNote}
        onOpenChange={setShowConvertibleNote}
        companyId={companyId!}
      />

      <SecondaryTransactionDialog
        open={showSecondaryTransaction}
        onOpenChange={setShowSecondaryTransaction}
        companyId={companyId!}
      />

      <FundingRoundDialog
        open={showFundingRound}
        onOpenChange={setShowFundingRound}
        companyId={companyId!}
      />

      {selectedConvertible && (
        <SAFEConversionDialog
          open={showSafeConversion}
          onOpenChange={setShowSafeConversion}
          companyId={companyId!}
          convertible={{
            id: selectedConvertible.id,
            holderName: selectedConvertible.holderName,
            principal: selectedConvertible.principal,
            framework: selectedConvertible.framework,
            discountRate: selectedConvertible.discountRate,
            valuationCap: selectedConvertible.valuationCap,
          }}
        />
      )}

      {selectedConvertible && (
        <NoteConversionDialog
          open={showNoteConversion}
          onOpenChange={setShowNoteConversion}
          companyId={companyId!}
          convertible={{
            id: selectedConvertible.id,
            holderName: selectedConvertible.holderName,
            principal: selectedConvertible.principal,
            framework: selectedConvertible.framework,
            discountRate: selectedConvertible.discountRate,
            valuationCap: selectedConvertible.valuationCap,
            interestRate: selectedConvertible.interestRate,
            issueDate: selectedConvertible.issueDate,
          }}
        />
      )}
    </CompanyLayout>
  );
}
