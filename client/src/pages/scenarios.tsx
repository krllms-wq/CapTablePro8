import { useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/formatters";

export default function Scenarios() {
  const { companyId } = useParams();
  const [raiseAmount, setRaiseAmount] = useState(5000000);
  const [preMoneyValuation, setPreMoneyValuation] = useState(20000000);
  const [optionPoolIncrease, setOptionPoolIncrease] = useState(0);

  const calculateScenario = () => {
    const postMoneyValuation = preMoneyValuation + raiseAmount;
    const newShares = Math.round(raiseAmount / (preMoneyValuation / 10000000)); // Assuming 10M existing shares
    const dilution = (raiseAmount / postMoneyValuation) * 100;
    const pricePerShare = preMoneyValuation / 10000000;

    return {
      postMoneyValuation,
      newShares,
      dilution,
      pricePerShare,
      existingShares: 10000000,
      totalShares: 10000000 + newShares,
    };
  };

  const scenario = calculateScenario();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Funding Scenarios</h1>
        <Button>
          <i className="fas fa-save mr-2"></i>
          Save Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Round Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="raiseAmount">Raise Amount</Label>
              <Input
                id="raiseAmount"
                type="number"
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
                placeholder="5000000"
              />
            </div>
            
            <div>
              <Label htmlFor="preMoneyValuation">Pre-Money Valuation</Label>
              <Input
                id="preMoneyValuation"
                type="number"
                value={preMoneyValuation}
                onChange={(e) => setPreMoneyValuation(parseInt(e.target.value) || 0)}
                placeholder="20000000"
              />
            </div>
            
            <div>
              <Label htmlFor="optionPoolIncrease">Option Pool Increase (%)</Label>
              <Input
                id="optionPoolIncrease"
                type="number"
                value={optionPoolIncrease}
                onChange={(e) => setOptionPoolIncrease(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Scenario Results</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Post-Money Valuation:</span>
              <span className="font-semibold">{formatCurrency(scenario.postMoneyValuation)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-600">Price Per Share:</span>
              <span className="font-semibold">{formatCurrency(scenario.pricePerShare)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-600">New Shares Issued:</span>
              <span className="font-semibold">{formatNumber(scenario.newShares)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Shares:</span>
              <span className="font-semibold">{formatNumber(scenario.totalShares)}</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Dilution:</span>
                <span className={`font-semibold ${scenario.dilution > 25 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPercentage(scenario.dilution)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dilution Impact Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Dilution Impact</h3>
          <p className="text-sm text-neutral-500">How this round affects existing stakeholders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Stakeholder
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Current Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Current %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Post-Round %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Dilution
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {/* Mock stakeholder data for demonstration */}
              {[
                { name: "Founders", shares: 7000000, currentPercent: 70 },
                { name: "Employees", shares: 1500000, currentPercent: 15 },
                { name: "Angel Investors", shares: 1500000, currentPercent: 15 },
              ].map((stakeholder) => {
                const postRoundPercent = (stakeholder.shares / scenario.totalShares) * 100;
                const dilutionAmount = stakeholder.currentPercent - postRoundPercent;
                
                return (
                  <tr key={stakeholder.name} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {stakeholder.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                      {formatNumber(stakeholder.shares)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                      {formatPercentage(stakeholder.currentPercent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 text-right">
                      {formatPercentage(postRoundPercent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                      -{formatPercentage(dilutionAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}