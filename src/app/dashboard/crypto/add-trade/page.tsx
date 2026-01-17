"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Platform, Currency } from "@/types";
import { ArrowLeft, Plus } from "lucide-react";

export default function AddTradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [tradeType, setTradeType] = useState<"spot" | "futures">("spot");
  const [platformId, setPlatformId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState("");
  const [fee, setFee] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  
  // Take Profit levels (optional)
  const [tp1, setTp1] = useState("");
  const [tp2, setTp2] = useState("");
  const [tp3, setTp3] = useState("");
  const [tp4, setTp4] = useState("");
  const [tp5, setTp5] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [showTpLevels, setShowTpLevels] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchPlatforms();
    }
  }, [status, router]);

  const fetchPlatforms = async () => {
    try {
      const response = await fetch("/api/platforms");
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms);
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected platform's currency as default
  const handlePlatformChange = (value: string) => {
    setPlatformId(value);
    const platform = platforms.find(p => p._id?.toString() === value);
    if (platform?.currency) {
      setCurrency(platform.currency);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId,
          journalType: "crypto",
          tradeType,
          direction,
          symbol: symbol.toUpperCase(),
          entry: parseFloat(entry),
          size: parseFloat(size),
          leverage: leverage ? parseFloat(leverage) : undefined,
          fee: parseFloat(fee) || 0,
          entryDate: new Date(entryDate),
          notes,
          currency, // Include currency from platform
          // Take Profit levels (optional)
          tp1: tp1 ? parseFloat(tp1) : undefined,
          tp2: tp2 ? parseFloat(tp2) : undefined,
          tp3: tp3 ? parseFloat(tp3) : undefined,
          tp4: tp4 ? parseFloat(tp4) : undefined,
          tp5: tp5 ? parseFloat(tp5) : undefined,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/crypto");
      } else {
        alert("Failed to add trade");
      }
    } catch (error) {
      console.error("Error adding trade:", error);
      alert("Error adding trade");
    } finally {
      setSubmitting(false);
    }
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

  if (platforms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="container mx-auto px-6 py-5 max-w-7xl">
            <Link href="/dashboard/crypto" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Crypto Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Plus className="h-6 w-6 text-blue-600" />
              Add Trade
            </h1>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-4">You need to add a platform before creating trades.</p>
              <Link href="/dashboard/crypto/platforms">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Add Platform
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 max-w-7xl">
          <Link href="/dashboard/crypto" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3 sm:mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Crypto Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Add Trade
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-3xl">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">New Trade</CardTitle>
            <CardDescription className="text-gray-600">
              Record a new trade in your journal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trade Type Tabs */}
              <div className="flex justify-center">
                <Tabs value={tradeType} onValueChange={(v: any) => setTradeType(v)}>
                  <TabsList className="bg-gray-100 border border-gray-200">
                    <TabsTrigger 
                      value="spot" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-8"
                    >
                      Spot
                    </TabsTrigger>
                    <TabsTrigger 
                      value="futures" 
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-8"
                    >
                      Futures
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Platform</Label>
                  <Select value={platformId} onValueChange={handlePlatformChange} required>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      {platforms.map((platform) => (
                        <SelectItem 
                          key={platform._id?.toString()} 
                          value={platform._id!.toString()}
                          className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {platform.name} ({platform.currency || "USD"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Currency</Label>
                  <Select value={currency} onValueChange={(v: Currency) => setCurrency(v)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      <SelectItem value="USD" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">🇺🇸 USD</SelectItem>
                      <SelectItem value="IDR" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">🇮🇩 IDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Symbol */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Symbol</Label>
                  <Input
                    placeholder="BTC/USDT"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Direction */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Direction</Label>
                  <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      <SelectItem value="long" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">Long</SelectItem>
                      <SelectItem value="short" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Entry Price */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Entry Price</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Stop Loss */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Stop Loss (Optional)</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Size</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Leverage (Futures only) */}
                {tradeType === "futures" && (
                  <div className="space-y-2">
                    <Label className="text-gray-700">Leverage</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={leverage}
                      onChange={(e) => setLeverage(e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}

                {/* Fee */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Fee</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Entry Date */}
                <div className="space-y-2">
                  <Label className="text-gray-700">Entry Date</Label>
                  <Input
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Take Profit Levels (Optional) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="text-gray-700 font-medium">Take Profit Levels (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTpLevels(!showTpLevels)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
                  >
                    {showTpLevels ? "Hide" : "Show"} TP Levels
                  </Button>
                </div>
                
                {showTpLevels && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm">TP1</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={tp1}
                        onChange={(e) => setTp1(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm">TP2</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={tp2}
                        onChange={(e) => setTp2(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm">TP3</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={tp3}
                        onChange={(e) => setTp3(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm">TP4</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={tp4}
                        onChange={(e) => setTp4(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-600 text-sm">TP5</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={tp5}
                        onChange={(e) => setTp5(e.target.value)}
                        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-gray-700">Notes</Label>
                <textarea
                  placeholder="Trade notes, strategy, reasons..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? "Adding Trade..." : "Add Trade"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
