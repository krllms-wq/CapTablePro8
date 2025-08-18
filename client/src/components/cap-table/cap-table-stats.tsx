import { formatCurrency, formatNumber } from "@/lib/formatters";

interface CapTableStatsProps {
  stats?: {
    totalShares: number;
    fullyDilutedShares: number;
    currentValuation: number;
    optionPoolAvailable: number;
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

  const statCards = [
    {
      title: "Total Shares Outstanding",
      value: formatNumber(stats.totalShares),
      icon: "fas fa-certificate",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Fully Diluted Shares",
      value: formatNumber(stats.fullyDilutedShares),
      icon: "fas fa-expand-arrows-alt",
      iconColor: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Current Valuation",
      value: formatCurrency(stats.currentValuation),
      icon: "fas fa-dollar-sign",
      iconColor: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Option Pool Available",
      value: formatNumber(stats.optionPoolAvailable),
      icon: "fas fa-gift",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-600 text-sm font-medium">{card.title}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
