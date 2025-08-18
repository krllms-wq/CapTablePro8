import { useState, useEffect, createContext, useContext, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [tourCompleted, setTourCompleted] = useState<string[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load completed tours from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("cap-table-tours-completed");
    if (completed) {
      setTourCompleted(JSON.parse(completed));
    }
  }, []);

  // Save completed tours to localStorage
  const saveTourCompletion = (tourId: string) => {
    const updated = [...tourCompleted, tourId];
    setTourCompleted(updated);
    localStorage.setItem("cap-table-tours-completed", JSON.stringify(updated));
  };

  const startTour = (newSteps: TourStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
    document.body.style.overflow = "hidden";
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    setSteps([]);
    document.body.style.overflow = "";
    if (steps.length > 0) {
      saveTourCompletion("main-tour"); // Default tour ID
    }
  };

  const skipTour = () => {
    saveTourCompletion("main-tour");
    endTour();
  };

  // Position the tooltip card relative to the target element
  useEffect(() => {
    if (!isActive || !steps[currentStep] || !cardRef.current) return;

    const targetElement = document.querySelector(steps[currentStep].target);
    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();
    const position = steps[currentStep].position || "bottom";

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = targetRect.top - cardRect.height - 10;
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        break;
      case "bottom":
        top = targetRect.bottom + 10;
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        break;
      case "left":
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        left = targetRect.left - cardRect.width - 10;
        break;
      case "right":
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        left = targetRect.right + 10;
        break;
    }

    // Keep card in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 10) left = 10;
    if (left + cardRect.width > viewportWidth - 10) left = viewportWidth - cardRect.width - 10;
    if (top < 10) top = 10;
    if (top + cardRect.height > viewportHeight - 10) top = viewportHeight - cardRect.height - 10;

    cardRef.current.style.top = `${top}px`;
    cardRef.current.style.left = `${left}px`;

    // Scroll target into view if needed
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isActive, currentStep, steps]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          endTour();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          nextStep();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevStep();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStep]);

  const currentStepData = steps[currentStep];

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      steps,
      startTour,
      nextStep,
      prevStep,
      endTour,
      skipTour
    }}>
      {children}
      
      {isActive && (
        <>
          {/* Overlay */}
          <div
            ref={overlayRef}
            className="fixed inset-0 z-[9999] bg-black/50"
            style={{ pointerEvents: "none" }}
          />
          
          {/* Highlight */}
          {currentStepData && (
            <TourHighlight target={currentStepData.target} />
          )}
          
          {/* Tour Card */}
          {currentStepData && (
            <Card
              ref={cardRef}
              className="fixed z-[10000] w-80 max-w-sm shadow-lg"
              style={{ pointerEvents: "auto" }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">
                      {currentStepData.title}
                    </h3>
                    <div className="text-xs text-muted-foreground mb-3">
                      Step {currentStep + 1} of {steps.length}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={endTour}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {currentStepData.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-1 w-6 rounded-full",
                          index === currentStep ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevStep}
                        className="h-8 px-3"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                      </Button>
                    )}
                    
                    {currentStep < steps.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={nextStep}
                        className="h-8 px-3"
                      >
                        Next
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={endTour}
                        className="h-8 px-3"
                      >
                        Finish
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="w-full h-6 text-xs text-muted-foreground"
                  >
                    Don't show this tour again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </TourContext.Provider>
  );
}

function TourHighlight({ target }: { target: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(target);
    if (element) {
      const elementRect = element.getBoundingClientRect();
      setRect(elementRect);
    }
  }, [target]);

  if (!rect) return null;

  return (
    <div
      className="fixed z-[9999] border-2 border-primary rounded-lg pointer-events-none"
      style={{
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: "0 0 0 2px rgba(255,255,255,0.8), 0 0 20px rgba(0,0,0,0.3)"
      }}
    />
  );
}

// Hook for starting predefined tours
export function useMainTour() {
  const { startTour } = useTour();
  
  const startMainTour = () => {
    const steps: TourStep[] = [
      {
        id: "navigation",
        target: "[data-tour='navigation']",
        title: "Navigation Menu",
        content: "Use this navigation bar to access different sections of your cap table. Switch between companies, view stakeholders, transactions, and more.",
        position: "bottom"
      },
      {
        id: "cap-table",
        target: "[data-tour='cap-table']",
        title: "Cap Table Overview",
        content: "This is your main cap table showing ownership distribution. Toggle between Current and Historical views to see how ownership has changed over time.",
        position: "top"
      },
      {
        id: "stakeholders",
        target: "[data-tour='stakeholders-section']",
        title: "Stakeholder Management",
        content: "Manage all your company's stakeholders here. Add new investors, employees, and view their equity holdings.",
        position: "left"
      },
      {
        id: "actions",
        target: "[data-tour='action-buttons']",
        title: "Quick Actions",
        content: "Use these buttons to add new transactions, model funding rounds, and perform other cap table operations.",
        position: "top"
      },
      {
        id: "help",
        target: "[data-tour='help-toggle']",
        title: "Help Mode",
        content: "Toggle help mode to get contextual explanations by clicking on any label or element in the interface.",
        position: "left"
      }
    ];
    
    startTour(steps);
  };

  return { startMainTour };
}

// Tour trigger button component
export function TourButton() {
  const { startMainTour } = useMainTour();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startMainTour}
      className="flex items-center gap-2"
    >
      <Play className="h-3 w-3" />
      Take Tour
    </Button>
  );
}