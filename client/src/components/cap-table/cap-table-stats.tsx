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
      <div className="bg-white rounded-lg border border-neutral-200 mb-8 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card, index) => (
            <div key={index} className="p-6 border-r border-neutral-200 last:border-r-0 hover:bg-neutral-50/30 transition-colors">
              <div className="text-left">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-neutral-300 hover:text-neutral-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <p className={`text-2xl font-bold leading-none ${card.value === 'N/A' ? 'text-neutral-300' : 'text-neutral-900'}`}>
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {stats.valuationSource && (
          <div className="border-t border-neutral-200 bg-neutral-50/50 px-6 py-2.5">
            <p className="text-xs text-neutral-400 text-center">
              {stats.valuationSource}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
