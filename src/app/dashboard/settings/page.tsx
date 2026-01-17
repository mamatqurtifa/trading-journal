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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Currency } from "@/types";
import { ArrowLeft, Settings, User as UserIcon, Globe, Lock, DollarSign, Save, Check, X } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setName(data.user.name || "");
        setUsername(data.user.username || "");
        setBio(data.user.bio || "");
        setDefaultCurrency(data.user.defaultCurrency || "USD");
        setIsPublic(data.user.isPublic || false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          bio,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setUser(data.user);
        // Update session
        await updateSession({ name });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error updating profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCurrency,
          isPublic,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Settings updated successfully!" });
        setUser(data.user);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error updating settings" });
    } finally {
      setSaving(false);
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
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5 max-w-4xl">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-1 mb-3 sm:mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Settings
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-xs sm:text-sm"
            >
              <UserIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-xs sm:text-sm"
            >
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 hover:text-gray-900 px-3 sm:px-6 text-xs sm:text-sm"
            >
              <Lock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Edit Profile</CardTitle>
                <CardDescription className="text-gray-600">
                  Update your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Display Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Username</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      placeholder="username"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Your profile URL: {username ? `yoursite.com/@${username}` : "Not set"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Bio</Label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    maxLength={160}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500">{bio.length}/160 characters</p>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Profile Preview */}
            {username && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Profile Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-2xl font-bold text-blue-600">
                        {name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 wrap-break-word">{name || "Your Name"}</h3>
                      <p className="text-gray-600 break-all">@{username}</p>
                      {bio && <p className="text-gray-700 mt-2 text-sm sm:text-base wrap-break-word">{bio}</p>}
                      <div className="flex gap-4 mt-3 text-sm sm:text-base">
                        <span className="text-gray-600">
                          <strong className="text-gray-900">{user?.followersCount || 0}</strong> followers
                        </span>
                        <span className="text-gray-600">
                          <strong className="text-gray-900">{user?.followingCount || 0}</strong> following
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Currency Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Set your default currency for trading calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Default Currency</Label>
                  <Select value={defaultCurrency} onValueChange={(v: Currency) => setDefaultCurrency(v)}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-gray-900">
                      <SelectItem value="USD" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">
                        🇺🇸 USD - US Dollar
                      </SelectItem>
                      <SelectItem value="IDR" className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">
                        🇮🇩 IDR - Indonesian Rupiah
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    This will be the default currency when adding new trades. You can also set currency per platform.
                  </p>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-900">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-yellow-600" />
                  )}
                  Account Visibility
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Control who can see your profile and trading journal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div 
                    onClick={() => setIsPublic(true)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isPublic 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className={`h-6 w-6 ${isPublic ? "text-blue-600" : "text-gray-400"}`} />
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          Public Account
                          {isPublic && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Anyone can view your profile and trading journal. Other users can follow you.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIsPublic(false)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      !isPublic 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className={`h-6 w-6 ${!isPublic ? "text-blue-600" : "text-gray-400"}`} />
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          Private Account
                          {!isPublic && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Only you can see your profile and trading journal. Your profile won&apos;t appear in search.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Privacy Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
