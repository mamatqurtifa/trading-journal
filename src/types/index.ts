import { ObjectId } from "mongodb";

// Currency types
export type Currency = "USD" | "IDR";

// User types
export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  username?: string; // Unique slug for profile URL
  bio?: string;
  avatar?: string;
  
  // Settings
  defaultCurrency: Currency;
  isPublic: boolean; // Public or Private account
  
  // Stats
  followersCount: number;
  followingCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Follow relationship
export interface Follow {
  _id?: ObjectId;
  followerId: ObjectId; // User who is following
  followingId: ObjectId; // User being followed
  createdAt: Date;
}

// Platform types
export interface Platform {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  type: "exchange" | "broker" | "wallet";
  currency: Currency; // Currency used on this platform
  createdAt: Date;
}

// Trade types
export type TradeType = "spot" | "futures";
export type TradeDirection = "long" | "short";
export type JournalType = "crypto" | "stock";
export type TradeStatus = "running" | "tp1" | "tp2" | "tp3" | "tp4" | "tp5" | "profit" | "stoploss";

export interface Trade {
  _id?: ObjectId;
  userId: ObjectId;
  platformId: ObjectId;
  journalType: JournalType;
  tradeType: TradeType;
  direction: TradeDirection;
  currency: Currency; // Currency used for this trade
  
  // Trade details
  symbol: string;
  entry: number;
  exit?: number;
  size: number;
  leverage?: number; // For futures
  
  // Take Profit levels (optional)
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  tp5?: number;
  stopLoss?: number;
  
  // Trade status
  status: TradeStatus;
  
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
