import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-full"
              />
            </div>
          </div>
          <Link href="/clients">
            <Button>+ Add Client</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your grooming business
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link href="/clients">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Manage your client database</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add and organize all your clients in one place.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Clients
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/pets">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle>Pets</CardTitle>
                  <CardDescription>Track pet information</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Keep detailed records for each pet in your care.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Pets
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/schedule">
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Book and manage appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    View your schedule and book appointments quickly.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Schedule
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
