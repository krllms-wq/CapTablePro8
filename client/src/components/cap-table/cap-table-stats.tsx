import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CapTableStatsProps {
  stats?: {
    totalShares: number;
    fullyDilutedShares: number;
    currentValuation: number | null;
    fullyDilutedValuation: number | null;
    optionPoolAvailable: number;
    valuationSource?: string;
    rsuInclusionMode?: 'none' | 'granted' | 'vested';
  };
  isLoading: boolean;
}

export default function CapTableStats({ stats, isLoading }: CapTableStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-neutral-200 rounded mb-2"></div>
              <div className="h-8 bg-neutral-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Helper to format valuation with N/A handling
  const formatValuation = (value: number | null, fallback: string = "N/A") => {
    if (value === null || value === undefined || value <= 0) return fallback;
    return formatCurrency(value);
  };

  // Helper to get RSU inclusion description
  const getRsuModeDescription = (mode: string = 'granted') => {
    switch (mode) {
      case 'none': return 'excluding RSUs';
      case 'granted': return 'including granted RSUs';
      case 'vested': return 'including vested RSUs only';
      default: return 'including granted RSUs';
    }
  };

  const statCards = [
    {
      title: "Total Shares Outstanding",
      value: formatNumber(stats.totalShares),
      icon: "fas fa-certificate",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      tooltip: "Total issued and outstanding shares"
    },
    {
      title: "Fully Diluted Shares",
      value: formatNumber(stats.fullyDilutedShares),
      icon: "fas fa-expand-arrows-alt",
      iconColor: "text-secondary", 
      bgColor: "bg-secondary/10",
      tooltip: `Total shares assuming all options are exercised (${getRsuModeDescription(stats.rsuInclusionMode)})`
    },
    {
      title: "Current Valuation",
      value: formatValuation(stats.currentValuation),
      icon: "fas fa-dollar-sign",
      iconColor: "text-accent",
      bgColor: "bg-accent/10",
      tooltip: stats.valuationSource || "Current company valuation based on latest pricing data"
    },
    {
      title: "Fully Diluted Valuation",
      value: formatValuation(stats.fullyDilutedValuation),
      icon: "fas fa-expand-arrows-alt", 
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      tooltip: `Valuation assuming all options are exercised (${getRsuModeDescription(stats.rsuInclusionMode)})`
    },
    {
      title: "Option Pool Available",
      value: formatNumber(stats.optionPoolAvailable),
      icon: "fas fa-gift",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      tooltip: "Unallocated shares available for future equity grants"
    },
  ];

  return (
    <TooltipProvider>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm mb-8 overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">Cap Table Overview</h3>
          <p className="text-sm text-neutral-600 mt-1">Key metrics and valuation information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-x divide-neutral-100">
          {statCards.map((card, index) => (
            <div key={index} className="p-6 hover:bg-neutral-50/50 transition-colors">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <i className={`${card.icon} ${card.iconColor} text-sm`}></i>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-2">
                    {card.title}
                  </p>
                  <p className={`text-xl font-bold ${card.value === 'N/A' ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {stats.valuationSource && (
          <div className="border-t border-neutral-100 bg-neutral-50/30 px-6 py-3">
            <p className="text-xs text-neutral-500 text-center">
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-info-circle"></i>
                Valuation: {stats.valuationSource}
              </span>
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
