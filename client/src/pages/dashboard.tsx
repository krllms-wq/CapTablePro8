import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
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
  const { companyId } = useParams();
  const [showIssueShares, setShowIssueShares] = useState(false);
  const [showGrantOptions, setShowGrantOptions] = useState(false);
  const [showSafeAgreement, setShowSafeAgreement] = useState(false);
  const [showConvertibleNote, setShowConvertibleNote] = useState(false);
  const [showSecondaryTransaction, setShowSecondaryTransaction] = useState(false);
  const [showSafeConversion, setShowSafeConversion] = useState(false);
  const [showNoteConversion, setShowNoteConversion] = useState(false);
  const [showFundingRound, setShowFundingRound] = useState(false);
  const [selectedConvertible, setSelectedConvertible] = useState<any>(null);
  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  const { data: capTableData, isLoading: capTableLoading } = useQuery<{
    stats: { totalShares: number; totalOptions: number; totalConvertibles: number; stakeholderCount: number };
    capTable: Array<{ stakeholder: string; shares: number; options: number; convertibles?: number; percentage: string; value: number }>;
    convertibles: Array<{ id: string; type: string; holderName: string; principal: number; framework?: string; discountRate?: number; valuationCap?: number; issueDate: string }>;
  }>({
    queryKey: ["/api/companies", companyId, "cap-table"],
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">No company selected</p>
        </div>
      </div>
    );
  }

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center bg-red-100 p-8 rounded border">
          <h2 className="text-2xl font-bold text-red-800">ERROR LOADING COMPANY</h2>
          <p className="text-red-700 mt-2">Company ID: {companyId}</p>
          <p className="text-red-600 text-sm mt-2">{String(companyError)}</p>
          <p className="text-red-500 text-xs mt-2">If you see this, there's an API error.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center bg-blue-100 p-8 rounded border">
          <h2 className="text-2xl font-bold text-blue-800">COMPANY NOT FOUND</h2>
          <p className="text-blue-700 mt-2">Company ID: {companyId}</p>
          <p className="text-blue-600 text-sm mt-2">API call finished but no company data returned.</p>
        </div>
      </div>
    );
  }



  const [location] = useLocation();
  
  const navigation = [
    { name: 'Companies', href: '/companies', icon: '🏢', current: false },
    { name: 'Dashboard', href: `/companies/${companyId}`, icon: '📊', current: location === `/companies/${companyId}` },
    { name: 'Stakeholders', href: `/companies/${companyId}/stakeholders`, icon: '👥', current: location.includes('/stakeholders') },
    { name: 'Equity Awards', href: `/companies/${companyId}/equity-awards`, icon: '🎁', current: location.includes('/equity-awards') },
    { name: 'Transactions', href: `/companies/${companyId}/transactions`, icon: '📈', current: location.includes('/transactions') },
    { name: 'Scenarios', href: `/companies/${companyId}/scenarios`, icon: '🔄', current: location.includes('/scenarios') },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Cap Table</h2>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6 bg-neutral-50">

        
        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{company.name}</h2>
              <p className="text-neutral-600 mt-1">{company.description}</p>
            </div>
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
              <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors">
                <i className="fas fa-download mr-2"></i>Export
              </button>
            </div>
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
        </div>
      </div>
  );
}
