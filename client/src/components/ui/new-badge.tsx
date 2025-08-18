import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Changelog mapping - define what's new or changed
const CHANGELOG_MAP: Record<string, { version: string; type: "new" | "changed" }> = {
  "help-toggle": { version: "1.1.0", type: "new" },
  "guided-tour": { version: "1.1.0", type: "new" },
  "sensitive-toggle": { version: "1.1.0", type: "new" },
  "empty-states": { version: "1.1.0", type: "new" },
  "system-info": { version: "1.1.0", type: "new" },
  "undo-redo": { version: "1.0.5", type: "changed" },
  "autosave": { version: "1.0.5", type: "changed" },
  "breadcrumbs": { version: "1.0.4", type: "new" },
  "enhanced-toasts": { version: "1.0.4", type: "changed" }
};

interface NewBadgeProps {
  featureId: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function NewBadge({ featureId, children, className, disabled = false }: NewBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const viewedFeatures = getViewedFeatures();
    const changelogEntry = CHANGELOG_MAP[featureId];
    
    if (changelogEntry && !viewedFeatures.includes(featureId)) {
      setIsVisible(true);
    }
  }, [featureId, disabled]);

  const handleView = () => {
    if (!hasBeenViewed) {
      setHasBeenViewed(true);
      markFeatureAsViewed(featureId);
      
      // Fade out after first view
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  };

  const changelogEntry = CHANGELOG_MAP[featureId];
  
  if (!changelogEntry || !isVisible || disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleView}
      onFocus={handleView}
    >
      {children}
      <Badge
        variant={changelogEntry.type === "new" ? "default" : "secondary"}
        className={cn(
          "absolute -top-1 -right-1 text-xs px-1.5 py-0.5 animate-pulse",
          hasBeenViewed && "animate-none opacity-75"
        )}
      >
        {changelogEntry.type === "new" ? "New" : "Updated"}
      </Badge>
    </div>
  );
}

// Utility functions for managing viewed features
function getViewedFeatures(): string[] {
  const stored = localStorage.getItem("cap-table-viewed-features");
  return stored ? JSON.parse(stored) : [];
}

function markFeatureAsViewed(featureId: string) {
  const viewedFeatures = getViewedFeatures();
  if (!viewedFeatures.includes(featureId)) {
    const updated = [...viewedFeatures, featureId];
    localStorage.setItem("cap-table-viewed-features", JSON.stringify(updated));
  }
}

// Hook for managing feature visibility
export function useNewFeatures() {
  const [viewedFeatures, setViewedFeatures] = useState<string[]>([]);

  useEffect(() => {
    setViewedFeatures(getViewedFeatures());
  }, []);

  const markAsViewed = (featureId: string) => {
    markFeatureAsViewed(featureId);
    setViewedFeatures(getViewedFeatures());
  };

  const clearAllViewed = () => {
    localStorage.removeItem("cap-table-viewed-features");
    setViewedFeatures([]);
  };

  const isFeatureNew = (featureId: string) => {
    const changelogEntry = CHANGELOG_MAP[featureId];
    return changelogEntry && !viewedFeatures.includes(featureId);
  };

  return {
    viewedFeatures,
    markAsViewed,
    clearAllViewed,
    isFeatureNew,
    totalNewFeatures: Object.keys(CHANGELOG_MAP).filter(id => !viewedFeatures.includes(id)).length
  };
}

// Component to show new features count
export function NewFeaturesIndicator() {
  const { totalNewFeatures } = useNewFeatures();

  if (totalNewFeatures === 0) return null;

  return (
    <Badge variant="destructive" className="ml-1">
      {totalNewFeatures}
    </Badge>
  );
}