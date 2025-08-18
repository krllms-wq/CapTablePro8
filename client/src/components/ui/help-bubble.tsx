import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpBubbleProps {
  term: string;
  definition: string;
  example?: string;
  size?: "sm" | "md";
  className?: string;
}

export function HelpBubble({ term, definition, example, size = "sm", className = "" }: HelpBubbleProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors ${className}`}
            type="button"
          >
            <HelpCircle className={iconSize} />
            <span className="sr-only">Help for {term}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-sm p-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {term}
            </div>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {definition}
            </div>
            {example && (
              <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-600">
                <span className="font-medium">Example:</span> {example}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}