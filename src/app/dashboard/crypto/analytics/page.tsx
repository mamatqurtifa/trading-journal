"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trade, Platform } from "@/types";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Percent, 
  BarChart3, 
  PieChart, 
  Calendar,
  Award,
  AlertTriangle,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy
} from "lucide-react";

interface AnalyticsData {
  // Basic stats
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  
  // PnL stats by currency
  pnlByCurrency: Record<string, {
    totalPnl: number;
    totalProfit: number;
    totalLoss: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    profitFactor: number;
    expectancy: number;
  }>;
  
  // By trade type
  spotStats: { trades: number; wins: number; winRate: number; pnl: number };
  futuresStats: { trades: number; wins: number; winRate: number; pnl: number };
  
  // By direction
  longStats: { trades: number; wins: number; winRate: number; pnl: number };
  shortStats: { trades: number; wins: number; winRate: number; pnl: number };
  
  // By status
  statusBreakdown: Record<string, number>;
  
  // Streaks
  currentStreak: { type: "win" | "loss" | "none"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  
  // Time-based
  tradingDays: number;
  avgTradesPerDay: number;
  bestDay: { date: string; pnl: number; currency: string } | null;
  worstDay: { date: string; pnl: number; currency: string } | null;
  
  // By symbol
  topSymbols: { symbol: string; trades: number; winRate: number; pnl: number; currency: string }[];
  
  // By platform
  platformStats: { platform: string; trades: number; winRate: number; pnl: number; currency: string }[];
  
  // Risk metrics
  avgRiskRewardRatio: number;
  avgHoldingTime: number; // in hours
  
  // Monthly breakdown
  monthlyStats: { month: string; trades: number; pnl: number; winRate: number; currency: string }[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [tradesRes, platformsRes] = await Promise.all([
        fetch("/api/trades?journalType=crypto"),
        fetch("/api/platforms"),
      ]);

      if (tradesRes.ok) {
        const data = await tradesRes.json();
        setTrades(data.trades || []);
      }

      if (platformsRes.ok) {
        const data = await platformsRes.json();
        setPlatforms(data.platforms || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformName = (platformId: string) => {
    const platform = platforms.find((p) => p._id?.toString() === platformId);
    return platform?.name || "Unknown";
  };

  const analytics = useMemo<AnalyticsData>(() => {
    const closedTrades = trades.filter((t) => t.status !== "running");
    const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0);
    const breakEvenTrades = closedTrades.filter((t) => (t.pnl || 0) === 0);

    // PnL by currency
    const pnlByCurrency: AnalyticsData["pnlByCurrency"] = {};
    for (const trade of closedTrades) {
      const currency = trade.currency || "USD";
      if (!pnlByCurrency[currency]) {
        pnlByCurrency[currency] = {
          totalPnl: 0,
          totalProfit: 0,
          totalLoss: 0,
          avgWin: 0,
          avgLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          profitFactor: 0,
          expectancy: 0,
        };
      }
      
      const pnl = trade.pnl || 0;
      pnlByCurrency[currency].totalPnl += pnl;
      
      if (pnl > 0) {
        pnlByCurrency[currency].totalProfit += pnl;
        if (pnl > pnlByCurrency[currency].largestWin) {
          pnlByCurrency[currency].largestWin = pnl;
        }
      } else if (pnl < 0) {
        pnlByCurrency[currency].totalLoss += Math.abs(pnl);
        if (Math.abs(pnl) > pnlByCurrency[currency].largestLoss) {
          pnlByCurrency[currency].largestLoss = Math.abs(pnl);
        }
      }
    }

    // Calculate averages and profit factor per currency
    for (const currency of Object.keys(pnlByCurrency)) {
      const currencyTrades = closedTrades.filter((t) => (t.currency || "USD") === currency);
      const currencyWins = currencyTrades.filter((t) => (t.pnl || 0) > 0);
      const currencyLosses = currencyTrades.filter((t) => (t.pnl || 0) < 0);
      
      pnlByCurrency[currency].avgWin = currencyWins.length > 0
        ? pnlByCurrency[currency].totalProfit / currencyWins.length
        : 0;
      pnlByCurrency[currency].avgLoss = currencyLosses.length > 0
        ? pnlByCurrency[currency].totalLoss / currencyLosses.length
        : 0;
      pnlByCurrency[currency].profitFactor = pnlByCurrency[currency].totalLoss > 0
        ? pnlByCurrency[currency].totalProfit / pnlByCurrency[currency].totalLoss
        : pnlByCurrency[currency].totalProfit > 0 ? Infinity : 0;
      
      // Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
      const winRate = currencyTrades.length > 0 ? currencyWins.length / currencyTrades.length : 0;
      const lossRate = 1 - winRate;
      pnlByCurrency[currency].expectancy = 
        (winRate * pnlByCurrency[currency].avgWin) - (lossRate * pnlByCurrency[currency].avgLoss);
    }

    // By trade type
    const spotTrades = closedTrades.filter((t) => t.tradeType === "spot");
    const futuresTrades = closedTrades.filter((t) => t.tradeType === "futures");
    
    const spotWins = spotTrades.filter((t) => (t.pnl || 0) > 0).length;
    const futuresWins = futuresTrades.filter((t) => (t.pnl || 0) > 0).length;

    // By direction
    const longTrades = closedTrades.filter((t) => t.direction === "long");
    const shortTrades = closedTrades.filter((t) => t.direction === "short");
    
    const longWins = longTrades.filter((t) => (t.pnl || 0) > 0).length;
    const shortWins = shortTrades.filter((t) => (t.pnl || 0) > 0).length;

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const trade of closedTrades) {
      statusBreakdown[trade.status] = (statusBreakdown[trade.status] || 0) + 1;
    }

    // Streaks
    let currentStreak: { type: "win" | "loss" | "none"; count: number } = { type: "none", count: 0 };
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(b.exitDate || b.entryDate).getTime() - new Date(a.exitDate || a.entryDate).getTime()
    );

    for (let i = 0; i < sortedTrades.length; i++) {
      const pnl = sortedTrades[i].pnl || 0;
      
      if (pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        if (i === 0) currentStreak = { type: "win", count: 1 };
        else if (currentStreak.type === "win") currentStreak.count++;
      } else if (pnl < 0) {
        tempLossStreak++;
        tempWinStreak = 0;
        if (i === 0) currentStreak = { type: "loss", count: 1 };
        else if (currentStreak.type === "loss") currentStreak.count++;
      }
      
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
    }

    // Trading days
    const tradingDaysSet = new Set(
      closedTrades.map((t) => new Date(t.exitDate || t.entryDate).toDateString())
    );
    const tradingDays = tradingDaysSet.size;

    // Best and worst day
    const pnlByDay: Record<string, { pnl: number; currency: string }> = {};
    for (const trade of closedTrades) {
      const dateStr = new Date(trade.exitDate || trade.entryDate).toDateString();
      if (!pnlByDay[dateStr]) {
        pnlByDay[dateStr] = { pnl: 0, currency: trade.currency || "USD" };
      }
      pnlByDay[dateStr].pnl += trade.pnl || 0;
    }

    let bestDay: AnalyticsData["bestDay"] = null;
    let worstDay: AnalyticsData["worstDay"] = null;

    for (const [date, data] of Object.entries(pnlByDay)) {
      if (!bestDay || data.pnl > bestDay.pnl) {
        bestDay = { date, pnl: data.pnl, currency: data.currency };
      }
      if (!worstDay || data.pnl < worstDay.pnl) {
        worstDay = { date, pnl: data.pnl, currency: data.currency };
      }
    }

    // Top symbols
    const symbolStats: Record<string, { trades: number; wins: number; pnl: number; currency: string }> = {};
    for (const trade of closedTrades) {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { trades: 0, wins: 0, pnl: 0, currency: trade.currency || "USD" };
      }
      symbolStats[trade.symbol].trades++;
      symbolStats[trade.symbol].pnl += trade.pnl || 0;
      if ((trade.pnl || 0) > 0) symbolStats[trade.symbol].wins++;
    }

    const topSymbols = Object.entries(symbolStats)
      .map(([symbol, stats]) => ({
        symbol,
        trades: stats.trades,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        pnl: stats.pnl,
        currency: stats.currency,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    // Platform stats
    const platformStatsMap: Record<string, { trades: number; wins: number; pnl: number; currency: string }> = {};
    for (const trade of closedTrades) {
      const platformName = getPlatformName(trade.platformId?.toString() || "");
      if (!platformStatsMap[platformName]) {
        platformStatsMap[platformName] = { trades: 0, wins: 0, pnl: 0, currency: trade.currency || "USD" };
      }
      platformStatsMap[platformName].trades++;
      platformStatsMap[platformName].pnl += trade.pnl || 0;
      if ((trade.pnl || 0) > 0) platformStatsMap[platformName].wins++;
    }

    const platformStats = Object.entries(platformStatsMap)
      .map(([platform, stats]) => ({
        platform,
        trades: stats.trades,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        pnl: stats.pnl,
        currency: stats.currency,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Average holding time (in hours)
    let totalHoldingTime = 0;
    let tradesWithExitDate = 0;
    for (const trade of closedTrades) {
      if (trade.exitDate && trade.entryDate) {
        const holdingTime = new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
        totalHoldingTime += holdingTime;
        tradesWithExitDate++;
      }
    }
    const avgHoldingTime = tradesWithExitDate > 0 
      ? (totalHoldingTime / tradesWithExitDate) / (1000 * 60 * 60) 
      : 0;

    // Risk/Reward ratio (approximation based on entry, exit, and stop loss)
    let totalRR = 0;
    let rrCount = 0;
    for (const trade of closedTrades) {
      if (trade.exit && trade.stopLoss && trade.entry) {
        const risk = Math.abs(trade.entry - trade.stopLoss);
        const reward = Math.abs(trade.exit - trade.entry);
        if (risk > 0) {
          totalRR += reward / risk;
          rrCount++;
        }
      }
    }
    const avgRiskRewardRatio = rrCount > 0 ? totalRR / rrCount : 0;

    // Monthly breakdown
    const monthlyStatsMap: Record<string, { trades: number; wins: number; pnl: number; currency: string }> = {};
    for (const trade of closedTrades) {
      const date = new Date(trade.exitDate || trade.entryDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyStatsMap[monthKey]) {
        monthlyStatsMap[monthKey] = { trades: 0, wins: 0, pnl: 0, currency: trade.currency || "USD" };
      }
      monthlyStatsMap[monthKey].trades++;
      monthlyStatsMap[monthKey].pnl += trade.pnl || 0;
      if ((trade.pnl || 0) > 0) monthlyStatsMap[monthKey].wins++;
    }

    const monthlyStats = Object.entries(monthlyStatsMap)
      .map(([month, stats]) => ({
        month,
        trades: stats.trades,
        pnl: stats.pnl,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        currency: stats.currency,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      pnlByCurrency,
      spotStats: {
        trades: spotTrades.length,
        wins: spotWins,
        winRate: spotTrades.length > 0 ? (spotWins / spotTrades.length) * 100 : 0,
        pnl: spotTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
      futuresStats: {
        trades: futuresTrades.length,
        wins: futuresWins,
        winRate: futuresTrades.length > 0 ? (futuresWins / futuresTrades.length) * 100 : 0,
        pnl: futuresTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
      longStats: {
        trades: longTrades.length,
        wins: longWins,
        winRate: longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0,
        pnl: longTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
      shortStats: {
        trades: shortTrades.length,
        wins: shortWins,
        winRate: shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0,
        pnl: shortTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      },
      statusBreakdown,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      tradingDays,
      avgTradesPerDay: tradingDays > 0 ? closedTrades.length / tradingDays : 0,
      bestDay,
      worstDay,
      topSymbols,
      platformStats,
      avgRiskRewardRatio,
      avgHoldingTime,
      monthlyStats,
    };
  }, [trades, platforms]);

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
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  if (status === "loading" || loading) {
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
          <Link href="/dashboard/crypto" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3 sm:mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Crypto Journal</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <span className="hidden sm:inline">Trading Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm w-full grid grid-cols-4 sm:w-auto sm:flex">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              Performance
            </TabsTrigger>
            <TabsTrigger value="symbols" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              Symbols
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-4">
              Monthly
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    Win Rate
                  </CardDescription>
                  <CardTitle className="text-2xl sm:text-3xl text-blue-600">
                    {analytics.winRate.toFixed(1)}%
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    Total Trades
                  </CardDescription>
                  <CardTitle className="text-2xl sm:text-3xl">
                    {analytics.totalTrades}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    Current Streak
                  </CardDescription>
                  <CardTitle className={`text-2xl sm:text-3xl ${analytics.currentStreak.type === "win" ? "text-green-600" : analytics.currentStreak.type === "loss" ? "text-red-600" : "text-gray-600"}`}>
                    {analytics.currentStreak.count} {analytics.currentStreak.type === "win" ? "W" : analytics.currentStreak.type === "loss" ? "L" : "-"}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    Avg Hold Time
                  </CardDescription>
                  <CardTitle className="text-xl sm:text-2xl">
                    {formatHours(analytics.avgHoldingTime)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* PnL by Currency */}
            <div className="grid gap-4 lg:grid-cols-2">
              {Object.entries(analytics.pnlByCurrency).map(([currency, stats]) => (
                <Card key={currency} className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      {currency} Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total PnL</p>
                        <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(stats.totalPnl, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Profit Factor</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Win</p>
                        <p className="text-lg font-medium text-green-600">
                          {formatCurrency(stats.avgWin, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Loss</p>
                        <p className="text-lg font-medium text-red-600">
                          {formatCurrency(stats.avgLoss, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Largest Win</p>
                        <p className="text-lg font-medium text-green-600">
                          {formatCurrency(stats.largestWin, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Largest Loss</p>
                        <p className="text-lg font-medium text-red-600">
                          {formatCurrency(stats.largestLoss, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-500">Expectancy per Trade</p>
                      <p className={`text-xl font-bold ${stats.expectancy >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(stats.expectancy, currency)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Win/Loss Breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Trade Results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-green-600">
                        <ArrowUpRight className="h-4 w-4" />
                        Winning
                      </span>
                      <span className="font-bold">{analytics.winningTrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-red-600">
                        <ArrowDownRight className="h-4 w-4" />
                        Losing
                      </span>
                      <span className="font-bold">{analytics.losingTrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-500">
                        Break Even
                      </span>
                      <span className="font-bold">{analytics.breakEvenTrades}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Streaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-green-600">
                        <Trophy className="h-4 w-4" />
                        Longest Win Streak
                      </span>
                      <span className="font-bold">{analytics.longestWinStreak}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Longest Loss Streak
                      </span>
                      <span className="font-bold">{analytics.longestLossStreak}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Trading Activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Trading Days
                      </span>
                      <span className="font-bold">{analytics.tradingDays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        Avg Trades/Day
                      </span>
                      <span className="font-bold">{analytics.avgTradesPerDay.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best/Worst Day */}
            <div className="grid md:grid-cols-2 gap-4">
              {analytics.bestDay && (
                <Card className="border-gray-200 shadow-sm border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-green-600" />
                      Best Trading Day
                    </CardDescription>
                    <CardTitle className="text-green-600">
                      {formatCurrency(analytics.bestDay.pnl, analytics.bestDay.currency)}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{analytics.bestDay.date}</p>
                  </CardHeader>
                </Card>
              )}
              {analytics.worstDay && (
                <Card className="border-gray-200 shadow-sm border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Worst Trading Day
                    </CardDescription>
                    <CardTitle className="text-red-600">
                      {formatCurrency(analytics.worstDay.pnl, analytics.worstDay.currency)}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{analytics.worstDay.date}</p>
                  </CardHeader>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* By Trade Type */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>By Trade Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Spot Trading</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trades</span>
                        <span className="font-medium">{analytics.spotStats.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-medium">{analytics.spotStats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total PnL</span>
                        <span className={`font-medium ${analytics.spotStats.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${analytics.spotStats.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Futures Trading</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trades</span>
                        <span className="font-medium">{analytics.futuresStats.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-medium">{analytics.futuresStats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total PnL</span>
                        <span className={`font-medium ${analytics.futuresStats.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${analytics.futuresStats.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* By Direction */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>By Direction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Long Positions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trades</span>
                        <span className="font-medium">{analytics.longStats.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-medium">{analytics.longStats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total PnL</span>
                        <span className={`font-medium ${analytics.longStats.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${analytics.longStats.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Short Positions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trades</span>
                        <span className="font-medium">{analytics.shortStats.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-medium">{analytics.shortStats.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total PnL</span>
                        <span className={`font-medium ${analytics.shortStats.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${analytics.shortStats.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exit Status Breakdown */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Exit Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      tp1: { label: "TP1", color: "bg-blue-100 text-blue-700" },
                      tp2: { label: "TP2", color: "bg-blue-100 text-blue-700" },
                      tp3: { label: "TP3", color: "bg-blue-100 text-blue-700" },
                      tp4: { label: "TP4", color: "bg-blue-100 text-blue-700" },
                      tp5: { label: "TP5", color: "bg-blue-100 text-blue-700" },
                      profit: { label: "Profit", color: "bg-green-100 text-green-700" },
                      stoploss: { label: "Stop Loss", color: "bg-red-100 text-red-700" },
                    };
                    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
                    return (
                      <div key={status} className={`p-4 rounded-lg ${config.color}`}>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-2xl font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Platform Performance */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 font-medium">Platform</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Trades</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Win Rate</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.platformStats.map((stat) => (
                        <tr key={stat.platform} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{stat.platform}</td>
                          <td className="py-3 px-4 text-right">{stat.trades}</td>
                          <td className="py-3 px-4 text-right">{stat.winRate.toFixed(1)}%</td>
                          <td className={`py-3 px-4 text-right font-medium ${stat.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(stat.pnl, stat.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Symbols Tab */}
          <TabsContent value="symbols" className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Top Performing Symbols</CardTitle>
                <CardDescription>Symbols ranked by total PnL</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 font-medium">#</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium">Symbol</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Trades</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Win Rate</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Total PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topSymbols.map((symbol, index) => (
                        <tr key={symbol.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                          <td className="py-3 px-4 font-medium">{symbol.symbol}</td>
                          <td className="py-3 px-4 text-right">{symbol.trades}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={symbol.winRate >= 50 ? "text-green-600" : "text-red-600"}>
                              {symbol.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${symbol.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(symbol.pnl, symbol.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>Performance breakdown by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 font-medium">Month</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Trades</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">Win Rate</th>
                        <th className="text-right py-3 px-4 text-gray-600 font-medium">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.monthlyStats.map((stat) => (
                        <tr key={stat.month} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{stat.month}</td>
                          <td className="py-3 px-4 text-right">{stat.trades}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={stat.winRate >= 50 ? "text-green-600" : "text-red-600"}>
                              {stat.winRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${stat.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(stat.pnl, stat.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
