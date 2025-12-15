import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Family Social
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A private space to connect, share moments, and stay close with your
          family - no matter the distance.
        </p>

        <div className="flex gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Share Moments</CardTitle>
              <CardDescription>
                Post photos, updates, and memories with your family circle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep everyone in the loop with easy sharing and real-time
                updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stay Connected</CardTitle>
              <CardDescription>
                Chat, comment, and react to stay engaged with loved ones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bridge the distance with meaningful interactions and
                conversations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Private & Secure</CardTitle>
              <CardDescription>
                Your family data stays within your circle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No ads, no data selling - just a safe space for your family.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
