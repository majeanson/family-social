"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/features/use-pwa-install";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
    setShowIOSInstructions(false);
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) return null;

  // Show iOS instructions
  if (isIOS && !canInstall) {
    if (!showIOSInstructions) {
      return (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
          <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
            <div className="flex-shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Install Famolo</p>
              <p className="text-xs text-muted-foreground">Add to your home screen</p>
            </div>
            <Button size="sm" onClick={() => setShowIOSInstructions(true)}>
              How?
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
        <div className="rounded-lg border bg-background p-4 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">Install Famolo on iOS</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ol className="text-xs text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">1</span>
              <span>Tap the <Share className="inline h-3 w-3" /> share button</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">2</span>
              <span>Scroll and tap &quot;Add to Home Screen&quot;</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">3</span>
              <span>Tap &quot;Add&quot; to install</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // Show standard install prompt for browsers that support it
  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex-shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install Famolo</p>
          <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
