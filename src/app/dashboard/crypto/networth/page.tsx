"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Trash2, RefreshCw, DollarSign, TrendingUp } from "lucide-react";

interface Platform {
  _id: string;
  name: string;
  currency: string;
}

interface PlatformBalance {
  platformId: string;
  platformName: string;
  balance: number;
  currency: string;
}

interface Transaction {
  _id: string;
  platformName?: string;
  toPlatformName?: string;
  type: "deposit" | "withdraw" | "transfer";
  amount: number;
  currency: string;
  description?: string;
  date: string;
}

interface NetWorthData {
  totalUSD: number;
  totalIDR: number;
  balances: PlatformBalance[];
  rates: { USD: number; IDR: number };
}

export default function NetWorthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [transactionType, setTransactionType] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [toPlatform, setToPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "IDR">("USD");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [networthRes, transactionsRes, platformsRes] = await Promise.all([
        fetch("/api/networth"),
        fetch("/api/networth?type=transactions"),
        fetch("/api/platforms?type=crypto"),
      ]);

      if (networthRes.ok) {
        const data = await networthRes.json();
        setNetWorth(data);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/networth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transactionType,
          platformId: selectedPlatform,
          toPlatformId: transactionType === "transfer" ? toPlatform : undefined,
          amount,
          currency,
          description,
          date,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    
    try {
      const response = await fetch(`/api/networth?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const resetForm = () => {
    setTransactionType("deposit");
    setSelectedPlatform("");
    setToPlatform("");
    setAmount("");
    setCurrency("USD");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const formatCurrency = (amount: number, currency: string) => {
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case "withdraw":
        return <ArrowUpCircle className="h-5 w-5 text-red-600" />;
      case "transfer":
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Deposit</Badge>;
      case "withdraw":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Withdraw</Badge>;
      case "transfer":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Transfer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Net Worth
            </h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 flex-1 sm:flex-none"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add Transaction</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                      Record a deposit, withdrawal, or transfer
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <Select
                        value={transactionType}
                        onValueChange={(v) => setTransactionType(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">💰 Deposit</SelectItem>
                          <SelectItem value="withdraw">💸 Withdraw</SelectItem>
                          <SelectItem value="transfer">🔄 Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{transactionType === "transfer" ? "From Platform" : "Platform"}</Label>
                      <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name} ({p.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {transactionType === "transfer" && (
                      <div className="space-y-2">
                        <Label>To Platform</Label>
                        <Select value={toPlatform} onValueChange={setToPlatform}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {platforms
                              .filter((p) => p._id !== selectedPlatform)
                              .map((p) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.name} ({p.currency})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="any"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">🇺🇸 USD</SelectItem>
                            <SelectItem value="IDR">🇮🇩 IDR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Monthly deposit"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      Add Transaction
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Net Worth Cards */}
        <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8 md:grid-cols-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                Total Net Worth (USD)
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-green-600">
                {formatCurrency(netWorth?.totalUSD || 0, "USD")}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                Total Net Worth (IDR)
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-blue-600">
                {formatCurrency(netWorth?.totalIDR || 0, "IDR")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Exchange Rate Info */}
        {netWorth?.rates && (
          <div className="mb-6 sm:mb-8 text-center text-gray-500 text-xs sm:text-sm">
            Exchange Rate: 1 USD = {formatCurrency(netWorth.rates.IDR, "IDR")}
          </div>
        )}

        {/* Platform Balances */}
        <Card className="border-gray-200 shadow-sm mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-gray-900 text-base sm:text-lg">Platform Balances</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Balance per trading platform</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {netWorth?.balances && netWorth.balances.length > 0 ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {netWorth.balances.map((balance) => (
                  <Card key={balance.platformId} className="border-gray-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-500 text-xs sm:text-sm truncate">{balance.platformName}</p>
                          <p className={`text-lg sm:text-xl font-bold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"} break-all`}>
                            {formatCurrency(balance.balance, balance.currency)}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-gray-300 ml-2 text-xs">
                          {balance.currency}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No platform balances yet. Add a deposit to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-gray-900 text-base sm:text-lg">Transaction History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Recent deposits, withdrawals, and transfers</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="shrink-0">{getTransactionIcon(tx.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getTransactionBadge(tx.type)}
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <span className="text-xs sm:text-sm text-gray-600 break-all">
                            {tx.platformName || "Unknown"}
                            {tx.type === "transfer" && tx.toPlatformName && (
                              <> → {tx.toPlatformName}</>
                            )}
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 wrap-break-word">{tx.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-8 sm:pl-0">
                      <span className={`font-bold text-base sm:text-lg ${tx.type === "withdraw" ? "text-red-600" : "text-green-600"} break-all`}>
                        {tx.type === "withdraw" ? "-" : "+"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tx._id)}
                        className="text-gray-400 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No transactions yet. Click &quot;Add Transaction&quot; to record your first deposit.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
