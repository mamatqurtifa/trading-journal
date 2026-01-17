"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PnLStats } from "@/types";
import { TradingCalendar } from "@/components/TradingCalendar";
import { ArrowLeft, Settings, Plus, TrendingUp, DollarSign, Target, Percent } from "lucide-react";

export default function CryptoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PnLStats | null>(null);

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
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Crypto Trading Journal
            </h1>
            <div className="flex gap-2">
              <Link href="/dashboard/crypto/platforms">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Platforms
                </Button>
              </Link>
              <Link href="/dashboard/crypto/add-trade">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trade
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="bg-white border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-6"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="spot" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-6"
              >
                Spot
              </TabsTrigger>
              <TabsTrigger 
                value="futures" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-6"
              >
                Futures
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-6"
              >
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Total PnL
                  </CardDescription>
                  <CardTitle className="text-3xl text-gray-900">$0.00</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Total Trades
                  </CardDescription>
                  <CardTitle className="text-3xl text-gray-900">0</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Win Rate
                  </CardDescription>
                  <CardTitle className="text-3xl text-gray-900">0%</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-600" />
                    Profit Factor
                  </CardDescription>
                  <CardTitle className="text-3xl text-gray-900">0.00</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance Chart</CardTitle>
                <CardDescription className="text-gray-600">
                  Your trading performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  Chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spot Trading Tab */}
          <TabsContent value="spot" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Spot Trading</CardTitle>
                <CardDescription className="text-gray-600">
                  Your spot trading history and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <p className="text-gray-500 mb-4">No spot trades yet</p>
                  <Link href="/dashboard/crypto/add-trade">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Trade
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Futures Trading Tab */}
          <TabsContent value="futures" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Futures Trading</CardTitle>
                <CardDescription className="text-gray-600">
                  Your futures trading history and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <p className="text-gray-500 mb-4">No futures trades yet</p>
                  <Link href="/dashboard/crypto/add-trade">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Trade
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            {session?.user?.id && (
              <TradingCalendar userId={session.user.id} journalType="crypto" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
