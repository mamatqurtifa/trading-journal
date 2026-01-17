"use client";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DailySummary } from "@/types";

interface TradingCalendarProps {
  userId: string;
  journalType: "crypto" | "stock";
}

export function TradingCalendar({ userId, journalType }: TradingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailySummaries();
  }, [userId, journalType]);

  const fetchDailySummaries = async () => {
    try {
      const response = await fetch(`/api/daily-summary?journalType=${journalType}`);
      if (response.ok) {
        const data = await response.json();
        setDailySummaries(data.summaries);
      }
    } catch (error) {
      console.error("Error fetching daily summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayColor = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const summary = dailySummaries.find(
      (s) => new Date(s.date).toISOString().split("T")[0] === dateStr
    );

    if (!summary || summary.totalTrades === 0) {
      return "bg-zinc-900"; // No activity
    }

    return summary.totalPnl > 0 ? "bg-green-500/20 border-green-500" : "bg-red-500/20 border-red-500";
  };

  const selectedDateSummary = dailySummaries.find(
    (s) =>
      selectedDate &&
      new Date(s.date).toISOString().split("T")[0] ===
        selectedDate.toISOString().split("T")[0]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-white border-gray-200 lg:col-span-2 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-gray-900 text-xl">Trading Calendar</CardTitle>
          <CardDescription className="text-gray-600">
            Track your daily trading performance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            className="w-full [--cell-size:3.5rem] [&_.rdp-week]:gap-2 [&_.rdp-weekdays]:gap-2"
            modifiers={{
                profit: (date) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const summary = dailySummaries.find(
                    (s) => new Date(s.date).toISOString().split("T")[0] === dateStr
                  );
                  return summary ? summary.totalPnl > 0 : false;
                },
                loss: (date) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const summary = dailySummaries.find(
                    (s) => new Date(s.date).toISOString().split("T")[0] === dateStr
                  );
                  return summary ? summary.totalPnl < 0 : false;
                },
              }}
              modifiersClassNames={{
                profit: "!bg-green-50 !text-green-700 font-bold !border !border-green-300 hover:!bg-green-100 hover:!border-green-400",
                loss: "!bg-red-50 !text-red-700 font-bold !border !border-red-300 hover:!bg-red-100 hover:!border-red-400",
              }}
            />
          <div className="mt-8 flex items-center justify-center gap-8 text-sm border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-50 border-2 border-green-300 rounded"></div>
              <span className="text-gray-700 font-medium">Profit Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-50 border-2 border-red-300 rounded"></div>
              <span className="text-gray-700 font-medium">Loss Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span className="text-gray-700 font-medium">No Activity</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-gray-900 text-lg">
            {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
          </CardTitle>
          <CardDescription className="text-gray-600">Daily Summary</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {selectedDateSummary ? (
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total PnL</p>
                <p
                  className={`text-3xl font-bold ${
                    selectedDateSummary.totalPnl > 0
                      ? "text-green-600"
                      : selectedDateSummary.totalPnl < 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  ${selectedDateSummary.totalPnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Trades</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {selectedDateSummary.totalTrades}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 text-xs font-semibold mb-1 uppercase tracking-wide">Winning</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedDateSummary.winningTrades}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-xs font-semibold mb-1 uppercase tracking-wide">Losing</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedDateSummary.losingTrades}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No trading activity on this date</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
