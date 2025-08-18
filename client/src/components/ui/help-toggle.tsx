import { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpContextType {
  isHelpActive: boolean;
  toggleHelp: () => void;
  showTooltip: (content: string, element: HTMLElement) => void;
  hideTooltip: () => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error("useHelp must be used within a HelpProvider");
  }
  return context;
}

interface HelpProviderProps {
  children: React.ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Load help mode preference from localStorage
  useEffect(() => {
    const helpMode = localStorage.getItem("cap-table-help-mode");
    if (helpMode === "true") {
      setIsHelpActive(true);
    }
  }, []);

  const toggleHelp = () => {
    const newState = !isHelpActive;
    setIsHelpActive(newState);
    localStorage.setItem("cap-table-help-mode", newState.toString());
    
    if (!newState) {
      hideTooltip();
    }
  };

  const showTooltip = (content: string, element: HTMLElement) => {
    if (!isHelpActive) return;
    
    const rect = element.getBoundingClientRect();
    setTooltipContent(content);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const hideTooltip = () => {
    setTooltipContent("");
    setTooltipPosition(null);
  };

  // Handle escape key to exit help mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isHelpActive) {
        toggleHelp();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHelpActive]);

  return (
    <HelpContext.Provider value={{
      isHelpActive,
      toggleHelp,
      showTooltip,
      hideTooltip
    }}>
      <div className={cn("relative", isHelpActive && "help-mode-active")}>
        {children}
        
        {/* Help mode overlay tooltip */}
        {tooltipPosition && tooltipContent && (
          <div
            className="fixed z-[9999] bg-black text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none max-w-xs"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: "translate(-50%, -100%)"
            }}
          >
            {tooltipContent}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
          </div>
        )}
      </div>
    </HelpContext.Provider>
  );
}

interface HelpLabelProps {
  children: React.ReactNode;
  helpText: string;
  className?: string;
  [key: string]: any;
}

export function HelpLabel({ children, helpText, className, ...props }: HelpLabelProps) {
  const { isHelpActive, showTooltip, hideTooltip } = useHelp();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isHelpActive) {
      e.preventDefault();
      e.stopPropagation();
      showTooltip(helpText, e.currentTarget);
      // Hide tooltip after 3 seconds
      setTimeout(hideTooltip, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (isHelpActive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      showTooltip(helpText, e.currentTarget);
      setTimeout(hideTooltip, 3000);
    }
  };

  return (
    <span
      className={cn(
        className,
        isHelpActive && "cursor-help relative after:content-['?'] after:absolute after:-top-1 after:-right-1 after:text-xs after:bg-blue-500 after:text-white after:rounded-full after:w-3 after:h-3 after:flex after:items-center after:justify-center after:text-[8px] hover:bg-blue-50"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isHelpActive ? 0 : undefined}
      role={isHelpActive ? "button" : undefined}
      aria-label={isHelpActive ? `Click for help: ${helpText}` : undefined}
      {...props}
    >
      {children}
    </span>
  );
}

export function HelpToggle() {
  const { isHelpActive, toggleHelp } = useHelp();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isHelpActive ? "default" : "outline"}
          size="sm"
          onClick={toggleHelp}
          className="flex items-center gap-2"
          data-tour="help-toggle"
        >
          <HelpCircle className="h-4 w-4" />
          Help Mode
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isHelpActive ? "Exit help mode" : "Enter help mode - click any label for explanations"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Sensitive field masking hook and component
export function useSensitiveFields() {
  const [isMasked, setIsMasked] = useState(() => {
    const saved = localStorage.getItem("cap-table-mask-sensitive");
    return saved !== "false"; // Default to masked
  });

  const toggleMasking = () => {
    const newState = !isMasked;
    setIsMasked(newState);
    localStorage.setItem("cap-table-mask-sensitive", newState.toString());
  };

  return { isMasked, toggleMasking };
}

export function SensitiveToggle() {
  const { isMasked, toggleMasking } = useSensitiveFields();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMasking}
          className="flex items-center gap-2"
        >
          {isMasked ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isMasked ? "Show" : "Hide"} Values
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isMasked ? "Show sensitive financial data" : "Hide sensitive financial data"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SensitiveFieldProps {
  children: React.ReactNode;
  fallback?: string;
  className?: string;
}

export function SensitiveField({ children, fallback = "●●●●●", className }: SensitiveFieldProps) {
  const { isMasked } = useSensitiveFields();

  return (
    <span className={className}>
      {isMasked ? fallback : children}
    </span>
  );
}