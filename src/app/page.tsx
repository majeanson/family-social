import { Header, DataProvider } from "@/components/layout";
import { PeopleView } from "@/components/people/people-view";

export default function Home() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <PeopleView />
        </main>
      </div>
    </DataProvider>
  );
}
