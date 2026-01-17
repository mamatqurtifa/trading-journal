"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PnLStats, Trade, Platform } from "@/types";
import { TradingCalendar } from "@/components/TradingCalendar";
import { ExitTradeDialog } from "@/components/ExitTradeDialog";
import { ArrowLeft, Settings, Plus, TrendingUp, DollarSign, Target, Percent, LogOut, Clock, Wallet, BarChart3 } from "lucide-react";

export default function CryptoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PnLStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchTrades();
      fetchPlatforms();
    }
  }, [status, router]);

  const fetchTrades = async () => {
    try {
      const response = await fetch("/api/trades?journalType=crypto");
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await fetch("/api/platforms");
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    }
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find((p) => p._id?.toString() === platformId);
    return platform?.name || "Unknown";
  };

  const getStatusBadge = (trade: Trade) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      running: { label: "Running", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      tp1: { label: "TP1", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      tp2: { label: "TP2", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      tp3: { label: "TP3", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      tp4: { label: "TP4", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      tp5: { label: "TP5", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      profit: { label: "Profit", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      stoploss: { label: "Stop Loss", className: "bg-red-100 text-red-800 hover:bg-red-100" },
    };

    const config = statusConfig[trade.status] || statusConfig.running;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleExitTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setExitDialogOpen(true);
  };

  const spotTrades = trades.filter((t) => t.tradeType === "spot");
  const futuresTrades = trades.filter((t) => t.tradeType === "futures");
  const runningTrades = trades.filter((t) => t.status === "running");
  const closedTrades = trades.filter((t) => t.status !== "running");

  // Calculate stats by currency
  const pnlByCurrency: Record<string, number> = {};
  for (const trade of closedTrades) {
    const currency = trade.currency || "USD";
    pnlByCurrency[currency] = (pnlByCurrency[currency] || 0) + (trade.pnl || 0);
  }

  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  // Format currency helper
  const formatCurrency = (amount: number, currency: string = "USD") => {
    if (currency === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex flex-col gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span className="hidden sm:inline">Crypto Trading Journal</span>
              <span className="sm:hidden">Crypto Journal</span>
            </h1>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/crypto/analytics">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <BarChart3 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
              </Link>
              <Link href="/dashboard/crypto/networth">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Wallet className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Net Worth</span>
                </Button>
              </Link>
              <Link href="/dashboard/crypto/platforms">
                <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Platforms</span>
                </Button>
              </Link>
              <Link href="/dashboard/crypto/add-trade">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Trade</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-white border border-gray-200 shadow-sm inline-flex w-auto min-w-full sm:min-w-0 justify-start sm:justify-center">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-sm flex-1 sm:flex-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="spot" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-sm flex-1 sm:flex-none"
              >
                Spot
              </TabsTrigger>
              <TabsTrigger 
                value="futures" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-sm flex-1 sm:flex-none"
              >
                Futures
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-sm flex-1 sm:flex-none"
              >
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Total PnL
                  </CardDescription>
                  <div className="space-y-1">
                    {Object.entries(pnlByCurrency).map(([currency, pnl]) => (
                      <CardTitle 
                        key={currency} 
                        className={`text-base sm:text-xl ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(pnl, currency)}
                      </CardTitle>
                    ))}
                    {Object.keys(pnlByCurrency).length === 0 && (
                      <CardTitle className="text-xl sm:text-3xl text-gray-900">$0.00</CardTitle>
                    )}
                  </div>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Total Trades
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-3xl text-gray-900">{trades.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
                    Running
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-3xl text-yellow-600">{runningTrades.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3 sm:pb-3">
                  <CardDescription className="text-gray-600 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Win Rate
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-3xl text-gray-900">{winRate.toFixed(1)}%</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Running Positions */}
            {runningTrades.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-gray-900 flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    Running Positions ({runningTrades.length})
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-xs sm:text-sm">
                    Open positions that need to be closed
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {/* Mobile View - Cards */}
                  <div className="sm:hidden space-y-3">
                    {runningTrades.map((trade) => (
                      <div key={trade._id?.toString()} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{trade.symbol}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{trade.tradeType}</Badge>
                              <span className={`text-xs font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(trade)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Entry:</span>
                            <span className="ml-1 font-medium">${trade.entry.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Size:</span>
                            <span className="ml-1 font-medium">{trade.size}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExitTrade(trade)}
                          className="w-full bg-orange-500 text-white hover:bg-orange-600"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Exit Position
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* Desktop View - Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Symbol</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Type</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Direction</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Entry</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Size</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runningTrades.map((trade) => (
                          <tr key={trade._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{trade.symbol}</td>
                            <td className="py-3 px-4 text-gray-600 capitalize">{trade.tradeType}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">${trade.entry.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-600">{trade.size}</td>
                            <td className="py-3 px-4">{getStatusBadge(trade)}</td>
                            <td className="py-3 px-4">
                              <Button
                                size="sm"
                                onClick={() => handleExitTrade(trade)}
                                className="bg-orange-500 text-white hover:bg-orange-600"
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                Exit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-gray-900 text-base sm:text-lg">Recent Closed Trades</CardTitle>
                <CardDescription className="text-gray-600 text-xs sm:text-sm">
                  Your recently closed trading positions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                {closedTrades.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No closed trades yet
                  </div>
                ) : (
                  <>
                  {/* Mobile View - Cards */}
                  <div className="sm:hidden space-y-3">
                    {closedTrades.slice(0, 10).map((trade) => (
                      <div key={trade._id?.toString()} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{trade.symbol}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{trade.tradeType}</Badge>
                              <span className={`text-xs font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(trade)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Entry:</span>
                            <span className="ml-1">${trade.entry.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Exit:</span>
                            <span className="ml-1">${trade.exit?.toLocaleString() || "-"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">PnL:</span>
                            <span className={`ml-1 font-bold ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(trade.pnl || 0, trade.currency || "USD")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop View - Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Symbol</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Type</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Direction</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Entry</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Exit</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">PnL</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.slice(0, 10).map((trade) => (
                          <tr key={trade._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{trade.symbol}</td>
                            <td className="py-3 px-4 text-gray-600 capitalize">{trade.tradeType}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">${trade.entry.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">${trade.exit?.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                ${trade.pnl?.toFixed(2)} ({trade.pnlPercentage?.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(trade)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spot Trading Tab */}
          <TabsContent value="spot" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Spot Trading ({spotTrades.length})</CardTitle>
                <CardDescription className="text-gray-600">
                  Your spot trading history and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {spotTrades.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 mb-4">No spot trades yet</p>
                    <Link href="/dashboard/crypto/add-trade">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Trade
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Symbol</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Direction</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Entry</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Exit</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Size</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">PnL</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spotTrades.map((trade) => (
                          <tr key={trade._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{trade.symbol}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">${trade.entry.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {trade.exit ? `$${trade.exit.toLocaleString()}` : "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{trade.size}</td>
                            <td className="py-3 px-4">
                              {trade.pnl !== undefined ? (
                                <span className={`font-medium ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  ${trade.pnl.toFixed(2)}
                                </span>
                              ) : "-"}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(trade)}</td>
                            <td className="py-3 px-4">
                              {trade.status === "running" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExitTrade(trade)}
                                  className="bg-orange-500 text-white hover:bg-orange-600"
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  Exit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Futures Trading Tab */}
          <TabsContent value="futures" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Futures Trading ({futuresTrades.length})</CardTitle>
                <CardDescription className="text-gray-600">
                  Your futures trading history and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {futuresTrades.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 mb-4">No futures trades yet</p>
                    <Link href="/dashboard/crypto/add-trade">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Trade
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Symbol</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Direction</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Entry</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Exit</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Size</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Leverage</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">PnL</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futuresTrades.map((trade) => (
                          <tr key={trade._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{trade.symbol}</td>
                            <td className="py-3 px-4">
                              <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                                {trade.direction.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">${trade.entry.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-900">
                              {trade.exit ? `$${trade.exit.toLocaleString()}` : "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{trade.size}</td>
                            <td className="py-3 px-4 text-gray-600">{trade.leverage || 1}x</td>
                            <td className="py-3 px-4">
                              {trade.pnl !== undefined ? (
                                <span className={`font-medium ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  ${trade.pnl.toFixed(2)}
                                </span>
                              ) : "-"}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(trade)}</td>
                            <td className="py-3 px-4">
                              {trade.status === "running" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExitTrade(trade)}
                                  className="bg-orange-500 text-white hover:bg-orange-600"
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  Exit
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

        {/* Exit Trade Dialog */}
        <ExitTradeDialog
          trade={selectedTrade}
          open={exitDialogOpen}
          onOpenChange={setExitDialogOpen}
          onSuccess={fetchTrades}
        />
      </main>
    </div>
  );
}
