"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { Platform, Currency } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Building2, Pencil } from "lucide-react";

export default function PlatformsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"exchange" | "broker" | "wallet">("exchange");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [submitting, setSubmitting] = useState(false);

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

  const resetForm = () => {
    setName("");
    setType("exchange");
    setCurrency("USD");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, currency }),
      });

      if (response.ok) {
        setDialogOpen(false);
        resetForm();
        fetchPlatforms();
      }
    } catch (error) {
      console.error("Error creating platform:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setName(platform.name);
    setType(platform.type);
    setCurrency(platform.currency || "USD");
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform?._id) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/platforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingPlatform._id.toString(), 
          name, 
          type, 
          currency 
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setEditingPlatform(null);
        resetForm();
        fetchPlatforms();
      }
    } catch (error) {
      console.error("Error updating platform:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this platform?")) return;

    try {
      const response = await fetch(`/api/platforms?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPlatforms();
      }
    } catch (error) {
      console.error("Error deleting platform:", error);
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
          <Link href="/dashboard/crypto" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Crypto Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Trading Platforms
            </h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-gray-200 text-gray-900 mx-4 sm:mx-auto max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Add New Platform</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Add a trading platform or exchange you use
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Platform Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Binance, Coinbase"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Platform Type</Label>
                    <Select value={type} onValueChange={(value: any) => setType(value)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="exchange">Exchange</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Currency</Label>
                    <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="USD">🇺🇸 USD</SelectItem>
                        <SelectItem value="IDR">🇮🇩 IDR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? "Adding..." : "Add Platform"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <p className="text-gray-600 text-sm sm:text-base mb-6">
          Manage your trading platforms and exchanges
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {platforms.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-sm col-span-full">
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No platforms added yet.</p>
                <p className="text-gray-400 text-sm">Add your first platform to get started.</p>
              </CardContent>
            </Card>
          ) : (
            platforms.map((platform) => (
              <Card key={platform._id?.toString()} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 shrink-0">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-gray-900 text-base sm:text-lg truncate">
                          {platform.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50 text-xs">
                            {platform.type}
                          </Badge>
                          <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50 text-xs">
                            {platform.currency || "USD"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(platform)}
                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(platform._id!.toString())}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingPlatform(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Platform</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update platform details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-700">Platform Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Binance, Coinbase"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Platform Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="exchange">Exchange</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Currency</Label>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="IDR">🇮🇩 IDR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
