"use client";

import { useAppTour } from "@/features/use-app-tour";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Users,
  Heart,
  Network,
  LayoutDashboard,
  Calendar,
  Crown,
  Shield,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Users,
  Heart,
  Network,
  LayoutDashboard,
  Calendar,
  Crown,
  Shield,
  Rocket,
};

const STEP_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-blue-600",
  "from-yellow-500 to-amber-600",
  "from-green-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
];

export function AppTourDialog() {
  const {
    isOpen,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipTour,
    goToStep,
  } = useAppTour();

  if (!currentStepData) return null;

  const Icon = ICON_MAP[currentStepData.icon] || Sparkles;
  const gradientColor = STEP_COLORS[currentStep % STEP_COLORS.length];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && skipTour()}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        {/* Header with gradient and icon */}
        <div className={cn("bg-gradient-to-br text-white p-6 pb-8", gradientColor)}>
          <div className="flex items-start justify-between">
            <div className={cn(
              "p-3 rounded-xl bg-white/20 backdrop-blur-sm",
            )}>
              <Icon className="h-8 w-8" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 -mr-2 -mt-2"
              onClick={skipTour}
              aria-label="Close tour"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-white/80 mb-1">
              Step {currentStep + 1} of {totalSteps}
            </p>
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-bold text-white">
                {currentStepData.title}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <DialogDescription className="text-base text-foreground leading-relaxed">
            {currentStepData.description}
          </DialogDescription>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep
                    ? "w-6 bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer with navigation */}
        <DialogFooter className="p-4 pt-0 gap-2 sm:gap-2">
          <div className="flex w-full gap-2">
            {isFirstStep ? (
              <Button
                variant="outline"
                onClick={skipTour}
                className="flex-1"
              >
                Skip Tour
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={nextStep}
              className={cn("flex-1", isLastStep && "bg-gradient-to-r", isLastStep && gradientColor)}
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Rocket className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
