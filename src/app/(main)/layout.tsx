import { Header, DataProvider, ThemeProvider, InstallPrompt } from "@/components/layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AppTourDialog } from "@/components/tour";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main id="main-content" className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
        <InstallPrompt />
        <AppTourDialog />
      </ThemeProvider>
    </DataProvider>
  );
}
