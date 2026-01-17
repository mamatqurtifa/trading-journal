"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ArrowLeft, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Lock,
  Globe,
  DollarSign,
  Target
} from "lucide-react";

interface ProfileData {
  user: {
    _id: string;
    name: string;
    username: string;
    bio?: string;
    avatar?: string;
    followersCount: number;
    followingCount: number;
    createdAt: string;
  };
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    pnlByCurrency: Record<string, number>;
  };
  recentTrades: Array<{
    _id: string;
    symbol: string;
    direction: string;
    tradeType: string;
    status: string;
    pnl?: number;
    pnlPercentage?: number;
    currency?: string;
    entryDate: string;
    exitDate?: string;
  }>;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function PublicProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const username = params.username as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/${username}`);
      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setFollowing(data.isFollowing);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (error) {
      setError("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session || !profile) return;

    setFollowLoading(true);
    try {
      if (following) {
        // Unfollow
        await fetch(`/api/follow?userId=${profile.user._id}`, {
          method: "DELETE",
        });
        setFollowing(false);
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            followersCount: profile.user.followersCount - 1,
          },
        });
      } else {
        // Follow
        await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.user._id }),
        });
        setFollowing(true);
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            followersCount: profile.user.followersCount + 1,
          },
        });
      }
    } catch (error) {
      console.error("Error following/unfollowing:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      running: { label: "Running", className: "bg-yellow-100 text-yellow-800" },
      tp1: { label: "TP1", className: "bg-blue-100 text-blue-800" },
      tp2: { label: "TP2", className: "bg-blue-100 text-blue-800" },
      tp3: { label: "TP3", className: "bg-blue-100 text-blue-800" },
      tp4: { label: "TP4", className: "bg-blue-100 text-blue-800" },
      tp5: { label: "TP5", className: "bg-blue-100 text-blue-800" },
      profit: { label: "Profit", className: "bg-green-100 text-green-800" },
      stoploss: { label: "Stop Loss", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.running;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {error === "This profile is private" ? "Private Profile" : "Profile Not Found"}
              </h2>
              <p className="text-gray-600">
                {error === "This profile is private" 
                  ? "This user has set their profile to private." 
                  : "The user you're looking for doesn't exist."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 max-w-4xl">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3 sm:mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl space-y-4 sm:space-y-6">
        {/* Profile Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4 sm:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {profile.user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{profile.user.name}</h1>
                  <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
                </div>
                <p className="text-gray-600 mb-2 text-sm sm:text-base break-all">@{profile.user.username}</p>
                {profile.user.bio && (
                  <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base wrap-break-word">{profile.user.bio}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{profile.user.followersCount}</strong> followers
                  </span>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{profile.user.followingCount}</strong> following
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Joined {new Date(profile.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                    <span className="sm:hidden">Joined {new Date(profile.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </span>
                </div>
              </div>

              {/* Follow Button */}
              {session && !profile.isOwnProfile && (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  variant={following ? "outline" : "default"}
                  className={following 
                    ? "border-gray-300 text-gray-700 hover:bg-gray-100" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                >
                  {followLoading ? (
                    "Loading..."
                  ) : following ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}

              {profile.isOwnProfile && (
                <Link href="/dashboard/settings">
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2 p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-gray-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="hidden sm:inline">Total Trades</span>
                <span className="sm:hidden">Trades</span>
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-gray-900">{profile.stats.totalTrades}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-2 p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-gray-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                Win Rate
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl text-gray-900">{profile.stats.winRate.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm col-span-2 md:col-span-1">
            <CardHeader className="pb-2 p-3 sm:pb-3 sm:p-6">
              <CardDescription className="text-gray-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                Total PnL
              </CardDescription>
              <div className="space-y-1">
                {Object.entries(profile.stats.pnlByCurrency).map(([currency, pnl]) => (
                  <CardTitle 
                    key={currency} 
                    className={`text-lg sm:text-xl ${pnl >= 0 ? "text-green-600" : "text-red-600"} break-all`}
                  >
                    {formatCurrency(pnl, currency)}
                  </CardTitle>
                ))}
                {Object.keys(profile.stats.pnlByCurrency).length === 0 && (
                  <CardTitle className="text-2xl sm:text-3xl text-gray-900">$0.00</CardTitle>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Trades */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-gray-900 text-base sm:text-lg">Recent Trades</CardTitle>
            <CardDescription className="text-gray-600 text-xs sm:text-sm">
              Latest trading activity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {profile.recentTrades.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No trades yet
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="md:hidden space-y-3">
                  {profile.recentTrades.map((trade) => (
                    <div key={trade._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                        {getStatusBadge(trade.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">PnL:</span>
                          {trade.pnl !== undefined ? (
                            <span className={`ml-1 font-bold ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(trade.pnl, trade.currency || "USD")}
                            </span>
                          ) : <span className="ml-1">-</span>}
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-1">{new Date(trade.entryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Symbol</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Direction</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">PnL</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Status</th>
                        <th className="text-left py-3 px-4 text-gray-600 font-medium text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.recentTrades.map((trade) => (
                        <tr key={trade._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{trade.symbol}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{trade.tradeType}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                              {trade.direction.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {trade.pnl !== undefined ? (
                              <span className={`font-medium ${trade.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(trade.pnl, trade.currency || "USD")}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(trade.status)}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(trade.entryDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
