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
      title: "Shares Outstanding",
      shortTitle: "Shares",
      value: formatNumber(stats.totalShares),
      tooltip: "Total issued and outstanding shares"
    },
    {
      title: "Fully Diluted Shares", 
      shortTitle: "Fully Diluted",
      value: formatNumber(stats.fullyDilutedShares),
      tooltip: `Total shares assuming all options are exercised (${getRsuModeDescription(stats.rsuInclusionMode)})`
    },
    {
      title: "Current Valuation",
      shortTitle: "Current Val.",
      value: formatValuation(stats.currentValuation),
      tooltip: stats.valuationSource || "Current company valuation based on latest pricing data"
    },
    {
      title: "Fully Diluted Valuation",
      shortTitle: "FD Valuation", 
      value: formatValuation(stats.fullyDilutedValuation),
      tooltip: `Valuation assuming all options are exercised (${getRsuModeDescription(stats.rsuInclusionMode)})`
    },
    {
      title: "Option Pool Available",
      shortTitle: "Option Pool",
      value: formatNumber(stats.optionPoolAvailable),
      tooltip: "Unallocated shares available for future equity grants"
    },
  ];

  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg border border-neutral-200 mb-8 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card, index) => (
            <div key={index} className="p-6 border-r border-neutral-200 last:border-r-0 hover:bg-neutral-50/30 transition-colors">
              <div className="text-left h-full flex flex-col">
                <div className="flex items-start justify-between mb-4 min-h-[2.5rem]">
                  <div className="flex-1 pr-2">
                    {/* Show short title on mobile, full title on larger screens */}
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide leading-tight block md:hidden">
                      {card.shortTitle}
                    </p>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide leading-tight hidden md:block">
                      {card.title}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-neutral-300 hover:text-neutral-500 cursor-help flex-shrink-0 mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="mt-auto">
                  <p className={`text-2xl font-bold leading-none ${card.value === 'N/A' ? 'text-neutral-300' : 'text-neutral-900'}`}>
                    {card.value}
                  </p>
                </div>
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
