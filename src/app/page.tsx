import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Wallet, TrendingUp, Calendar, Shield, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            Trading Journal
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Track, analyze, and improve your trading performance
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Professional trading journal for crypto and stock traders with advanced analytics, 
            PnL tracking, and performance insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6 w-full sm:w-auto shadow-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-400 text-lg px-8 py-6 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Track your PnL, win rate, profit factor, and other key metrics to understand your performance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Crypto & Stocks</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Separate journals for cryptocurrency and stock trading with specialized features for each.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Spot & Futures</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Track both spot and futures trades with support for leverage, margin, and more.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Trading Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Visualize your daily performance with a color-coded calendar showing profit and loss days.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Secure & Private</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Your trading data is secure with authentication and encrypted storage in MongoDB.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <Layers className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-900">Multi-Platform</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Manage multiple trading platforms and exchanges in one place.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-24">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 max-w-3xl mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-white mb-4">
              Start Tracking Your Trades Today
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Join traders who are improving their performance with data-driven insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 font-semibold">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-gray-50">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>© 2026 Trading Journal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
