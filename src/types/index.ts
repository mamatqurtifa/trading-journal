import { ObjectId } from "mongodb";

// User types
export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Platform types
export interface Platform {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  type: "exchange" | "broker" | "wallet";
  createdAt: Date;
}

// Trade types
export type TradeType = "spot" | "futures";
export type TradeDirection = "long" | "short";
export type JournalType = "crypto" | "stock";

export interface Trade {
  _id?: ObjectId;
  userId: ObjectId;
  platformId: ObjectId;
  journalType: JournalType;
  tradeType: TradeType;
  direction: TradeDirection;
  
  // Trade details
  symbol: string;
  entry: number;
  exit?: number;
  size: number;
  leverage?: number; // For futures
  
  // Financial data
  pnl?: number;
  pnlPercentage?: number;
  fee: number;
  
  // Dates
  entryDate: Date;
  exitDate?: Date;
  
  // Notes
  notes?: string;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Daily Summary for Calendar
export interface DailySummary {
  _id?: ObjectId;
  userId: ObjectId;
  date: Date;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  journalType: JournalType;
  createdAt: Date;
}

// Analytics types
export interface PnLStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  profitFactor: number;
}
