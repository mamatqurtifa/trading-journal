"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trade } from "@/types";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ExitTradeDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExitTradeDialog({
  trade,
  open,
  onOpenChange,
  onSuccess,
}: ExitTradeDialogProps) {
  const [exitPrice, setExitPrice] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade || !exitPrice) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeId: trade._id?.toString(),
          exitPrice: parseFloat(exitPrice),
          exitDate: exitDate || undefined,
        }),
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        setExitPrice("");
        setExitDate("");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to close trade");
      }
    } catch (error) {
      console.error("Error closing trade:", error);
      alert("Error closing trade");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate preview PnL
  const calculatePreviewPnL = () => {
    if (!trade || !exitPrice) return null;

    const exit = parseFloat(exitPrice);
    const { entry, direction, size, fee } = trade;

    let pnl = 0;
    if (direction === "long") {
      pnl = (exit - entry) * size - (fee || 0);
    } else {
      pnl = (entry - exit) * size - (fee || 0);
    }
    const pnlPercentage = ((exit - entry) / entry) * 100;

    return { pnl, pnlPercentage };
  };

  const previewPnL = calculatePreviewPnL();

  // Determine which TP would be hit
  const getTPPreview = () => {
    if (!trade || !exitPrice) return null;

    const exit = parseFloat(exitPrice);
    const { entry, direction, tp1, tp2, tp3, tp4, tp5 } = trade;
    const isLong = direction === "long";
    const isLoss = isLong ? exit < entry : exit > entry;

    if (isLoss) return "Stop Loss";

    const tpLevels = [
      { level: "TP5", price: tp5 },
      { level: "TP4", price: tp4 },
      { level: "TP3", price: tp3 },
      { level: "TP2", price: tp2 },
      { level: "TP1", price: tp1 },
    ];

    for (const tp of tpLevels) {
      if (tp.price !== undefined && tp.price !== null) {
        if (isLong && exit >= tp.price) return tp.level;
        if (!isLong && exit <= tp.price) return tp.level;
      }
    }

    return "Profit";
  };

  const tpPreview = getTPPreview();

  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Close Position</DialogTitle>
          <DialogDescription className="text-gray-600">
            Close your {trade.symbol} {trade.direction.toUpperCase()} position
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trade Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Symbol:</span>
              <span className="font-medium text-gray-900">{trade.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Direction:</span>
              <span className={`font-medium ${trade.direction === "long" ? "text-green-600" : "text-red-600"}`}>
                {trade.direction.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entry Price:</span>
              <span className="font-medium text-gray-900">${trade.entry.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium text-gray-900">{trade.size}</span>
            </div>
            {(trade.tp1 || trade.tp2 || trade.tp3 || trade.tp4 || trade.tp5) && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-600 text-sm">Take Profit Levels:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {trade.tp1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">TP1: ${trade.tp1}</span>}
                  {trade.tp2 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">TP2: ${trade.tp2}</span>}
                  {trade.tp3 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">TP3: ${trade.tp3}</span>}
                  {trade.tp4 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">TP4: ${trade.tp4}</span>}
                  {trade.tp5 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">TP5: ${trade.tp5}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Exit Price Input */}
          <div className="space-y-2">
            <Label className="text-gray-700">Exit Price</Label>
            <Input
              type="number"
              step="any"
              placeholder="Enter exit price"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              required
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Exit Date Input */}
          <div className="space-y-2">
            <Label className="text-gray-700">Exit Date (Optional)</Label>
            <Input
              type="datetime-local"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* PnL Preview */}
          {previewPnL && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">PnL Preview</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {previewPnL.pnl > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : previewPnL.pnl < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  ) : null}
                  <span
                    className={`text-lg font-bold ${
                      previewPnL.pnl > 0
                        ? "text-green-600"
                        : previewPnL.pnl < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    ${previewPnL.pnl.toFixed(2)} ({previewPnL.pnlPercentage.toFixed(2)}%)
                  </span>
                </div>
                {tpPreview && (
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      tpPreview === "Stop Loss"
                        ? "bg-red-100 text-red-700"
                        : tpPreview === "Profit"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {tpPreview}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !exitPrice}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting ? "Closing..." : "Close Position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
