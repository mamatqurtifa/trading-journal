import { NextRequest, NextResponse } from "next/server";

// Cache exchange rates for 1 hour
let cachedRates: { [key: string]: number } | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fallback rates in case API fails (approximate rates)
const FALLBACK_RATES: { [key: string]: number } = {
  USD: 1,
  IDR: 15800, // 1 USD = ~15,800 IDR (update this periodically)
};

async function fetchExchangeRates(): Promise<{ [key: string]: number }> {
  // Check cache first
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Using freecurrencyapi.com
    const apiKey = process.env.FREECURRENCY_API_KEY;
    
    if (!apiKey) {
      console.warn("FREECURRENCY_API_KEY not set, using fallback rates");
      return FALLBACK_RATES;
    }

    const response = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&base_currency=USD&currencies=IDR`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error("Failed to fetch exchange rates:", response.status);
      return FALLBACK_RATES;
    }

    const data = await response.json();
    
    cachedRates = {
      USD: 1,
      IDR: data.data?.IDR || FALLBACK_RATES.IDR,
    };
    cacheTimestamp = Date.now();

    return cachedRates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return FALLBACK_RATES;
  }
}

// Convert amount from one currency to another
function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [key: string]: number }
): number {
  if (fromCurrency === toCurrency) return amount;

  // Convert to USD first, then to target currency
  const amountInUSD = amount / (rates[fromCurrency] || 1);
  const convertedAmount = amountInUSD * (rates[toCurrency] || 1);

  return convertedAmount;
}

// GET - Get exchange rates or convert amount
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get("amount");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const rates = await fetchExchangeRates();

    // If conversion parameters provided, convert the amount
    if (amount && from && to) {
      const convertedAmount = convertCurrency(
        parseFloat(amount),
        from.toUpperCase(),
        to.toUpperCase(),
        rates
      );

      return NextResponse.json({
        original: {
          amount: parseFloat(amount),
          currency: from.toUpperCase(),
        },
        converted: {
          amount: convertedAmount,
          currency: to.toUpperCase(),
        },
        rate: rates[to.toUpperCase()] / rates[from.toUpperCase()],
      });
    }

    // Otherwise return all rates
    return NextResponse.json({
      base: "USD",
      rates,
      timestamp: cacheTimestamp || Date.now(),
    });
  } catch (error) {
    console.error("Error in currency API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Convert multiple amounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amounts, targetCurrency } = body;

    // amounts: Array of { amount: number, currency: string }
    // targetCurrency: string (e.g., "USD")

    if (!amounts || !targetCurrency) {
      return NextResponse.json(
        { error: "Missing required fields: amounts, targetCurrency" },
        { status: 400 }
      );
    }

    const rates = await fetchExchangeRates();

    const convertedAmounts = amounts.map((item: { amount: number; currency: string }) => ({
      original: item,
      converted: {
        amount: convertCurrency(item.amount, item.currency, targetCurrency, rates),
        currency: targetCurrency,
      },
    }));

    const totalConverted = convertedAmounts.reduce(
      (sum: number, item: any) => sum + item.converted.amount,
      0
    );

    return NextResponse.json({
      items: convertedAmounts,
      total: {
        amount: totalConverted,
        currency: targetCurrency,
      },
      rates,
    });
  } catch (error) {
    console.error("Error in currency conversion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
