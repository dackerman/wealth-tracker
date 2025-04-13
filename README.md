# WealthVision - Your Financial Future, Clearly in Sight

<p align="center">
  <img src="client/src/assets/logo-horizontal.png" alt="WealthVision Logo" width="400"/>
</p>

## 📈 Overview

WealthVision is a comprehensive financial tracking application that gives you a clear, real-time view of your entire financial picture. By securely connecting to your financial institutions through Plaid, WealthVision provides an intuitive dashboard to monitor your net worth, track spending patterns, and set financial goals.

## ✨ Key Features

- **Financial Dashboard**: View your overall financial health at a glance with a comprehensive dashboard showcasing net worth trends, account balances, and recent transactions.
  
- **Secure Account Integration**: Connect securely to thousands of financial institutions using Plaid's trusted API.
  
- **Net Worth Tracking**: Automatically calculate and visualize your net worth over time, helping you track your financial progress.
  
- **Transaction Analysis**: View, categorize, and analyze your recent transactions across all connected accounts.
  
- **Goal Setting**: Define financial goals and track your progress toward achieving them.
  
- **Daily Data Synchronization**: Your financial data updates automatically every day to ensure you always have the most current information.

## 🛠️ Technical Stack

WealthVision is built with a modern, scalable tech stack:

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Secure session-based authentication
- **API Integration**: Plaid API for financial institution connectivity
- **Data Visualization**: Recharts for beautiful, interactive charts

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or later
- PostgreSQL database
- Plaid API credentials (client ID and secret)

### Environment Variables

```
DATABASE_URL=postgresql://username:password@localhost:5432/wealthvision
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
SESSION_SECRET=your_session_secret
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/wealthvision.git
cd wealthvision
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
npm run db:push
```

4. Start the development server
```bash
npm run dev
```

## 📊 Application Structure

WealthVision follows a clean architecture pattern with clear separation of concerns:

- **client/**: React frontend application
  - **src/components/**: Reusable UI components
  - **src/hooks/**: Custom React hooks
  - **src/pages/**: Application pages
  - **src/layouts/**: Page layouts and templates
  - **src/lib/**: Utility functions and API client

- **server/**: Express backend application
  - **auth.ts**: Authentication logic
  - **db.ts**: Database configuration
  - **routes.ts**: API route definitions
  - **storage.ts**: Data access layer
  - **plaid.ts**: Plaid API integration
  - **jobs.ts**: Background sync jobs

- **shared/**: Code shared between client and server
  - **schema.ts**: Database schema definitions

## 🔒 Security

WealthVision takes security seriously:

- All data is transmitted over HTTPS
- Plaid handles sensitive bank credentials - they are never stored in our database
- Session-based authentication with secure cookies
- Password hashing using scrypt with salting
- Protection against common web vulnerabilities (XSS, CSRF, etc.)

## 📱 Responsive Design

WealthVision is designed to work beautifully on all devices:

- Mobile-first approach
- Responsive dashboard layouts
- Touch-friendly UI elements
- Consistent experience across devices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">Built with ❤️ by the WealthVision Team</p>