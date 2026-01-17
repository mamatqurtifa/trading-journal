# Trading Journal

A professional trading journal web application for tracking cryptocurrency and stock trades with advanced analytics and performance insights.

## Features

- 🔐 **Authentication System** - Secure user registration and login with NextAuth
- 📊 **Crypto & Stock Journals** - Separate journals for different asset types
- 💹 **Spot & Futures Trading** - Support for both spot and futures/margin trading
- 📈 **PnL Analytics** - Track profit/loss, win rate, profit factor, and more
- 📅 **Trading Calendar** - Visual calendar showing daily profit/loss performance
- 🏢 **Platform Management** - Manage multiple trading platforms and exchanges
- 🎨 **Clean UI** - Minimalist black and white theme using shadcn/ui

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **UI**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

Generate a NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── platforms/    # Platform management
│   │   ├── trades/       # Trade CRUD operations
│   │   └── daily-summary/# Daily performance summaries
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # Main dashboard
│   │   └── crypto/       # Crypto journal pages
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── providers/        # Context providers
│   └── TradingCalendar.tsx
├── lib/
│   ├── mongodb.ts        # MongoDB connection
│   └── utils.ts
└── types/
    ├── index.ts          # Type definitions
    └── next-auth.d.ts    # NextAuth types
```

## Usage

### 1. Create an Account
- Visit the homepage and click "Get Started"
- Register with your name, email, and password

### 2. Add Trading Platforms
- Go to "Manage Platforms" in the crypto dashboard
- Add exchanges/brokers you trade on (e.g., Binance, Coinbase)

### 3. Record Trades
- Click "Add Trade" to record a new trade
- Choose between Spot or Futures
- Fill in trade details (symbol, entry, exit, size, etc.)
- The system automatically calculates PnL

### 4. Analyze Performance
- View your PnL analytics in the Overview tab
- Check Spot and Futures sections separately
- Use the Calendar to see daily performance

## Database Collections

- **users** - User accounts
- **platforms** - Trading platforms/exchanges
- **trades** - Individual trade records
- **daily_summaries** - Aggregated daily performance data

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
MONGODB_URI=your_production_mongodb_uri
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_production_secret
```

## Future Enhancements

- [ ] Stock journal implementation
- [ ] Advanced charts and visualizations
- [ ] Trade statistics and insights
- [ ] Export trades to CSV/Excel
- [ ] Trade screenshots upload
- [ ] Mobile app
- [ ] API integrations with exchanges

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [shadcn/ui Documentation](https://ui.shadcn.com/) - learn about the UI components.
- [MongoDB Documentation](https://www.mongodb.com/docs/) - learn about MongoDB.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
