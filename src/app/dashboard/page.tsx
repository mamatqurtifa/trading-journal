"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogOut, TrendingUp, ArrowRight, Settings, User } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
                <span className="truncate">Trading Journal</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {session.user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/settings" className="flex-1 sm:flex-none">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
              <Button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 flex-1 sm:flex-none"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <Tabs defaultValue="crypto" className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="bg-white border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="crypto" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-4 sm:px-6 text-sm"
              >
                Crypto
              </TabsTrigger>
              <TabsTrigger 
                value="stock" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-4 sm:px-6 text-sm"
              >
                Stock Journal
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="crypto" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Crypto Trading Journal</h2>
                    <p className="text-gray-600 text-sm lg:text-base">
                      Track your cryptocurrency trades, analyze your performance, and improve your trading strategy.
                    </p>
                  </div>
                  <Link href="/dashboard/crypto" className="w-full lg:w-auto">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 w-full lg:w-auto">
                      View Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">Stock Trading Journal</h2>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Stock journal coming soon...
                  </p>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
