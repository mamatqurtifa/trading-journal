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
import { Platform } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Building2 } from "lucide-react";

export default function PlatformsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"exchange" | "broker" | "wallet">("exchange");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setName("");
        setType("exchange");
        fetchPlatforms();
      }
    } catch (error) {
      console.error("Error creating platform:", error);
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
        <div className="container mx-auto px-6 py-5 max-w-7xl">
          <Link href="/dashboard/crypto" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Crypto Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Trading Platforms
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <p className="text-gray-600">
            Manage your trading platforms and exchanges
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Platform
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 text-gray-900">
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
                    placeholder="e.g., Binance, Coinbase, etc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-gray-700">Platform Type</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      <SelectItem value="exchange" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">Exchange</SelectItem>
                      <SelectItem value="broker" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">Broker</SelectItem>
                      <SelectItem value="wallet" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">Wallet</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-sm col-span-full">
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No platforms added yet. Add your first platform to get started.</p>
              </CardContent>
            </Card>
          ) : (
            platforms.map((platform) => (
              <Card key={platform._id?.toString()} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-900">{platform.name}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50">
                            {platform.type}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(platform._id!.toString())}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
