import { Header, DataProvider, ThemeProvider } from "@/components/layout";

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
          <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </ThemeProvider>
    </DataProvider>
  );
}
