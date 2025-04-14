# WealthVision - Your Financial Future, Clearly in Sight

<p align="center">
  <img src="client/src/assets/hero-image.png" alt="WealthVision Hero" width="100%"/>
  <br>
  <em>Envision your financial future with WealthVision - where humans and AI work together for prosperity</em>
</p>

## 📈 Overview

WealthVision is a comprehensive financial tracking application that gives you a clear, real-time view of your entire financial picture. By securely connecting to your financial institutions through Plaid, WealthVision provides an intuitive dashboard to monitor your net worth, track spending patterns, and set financial goals.

## 🌟 The WealthVision Story

WealthVision was developed through an incredible "vibe-coding" session on Replit. What makes this project remarkable is how it was built from scratch in a single, fluid development process:

- **Zero to Hero**: The entire application – from concept to fully functioning wealth tracker – emerged in essentially one continuous development flow
- **Seamless Integration**: Plaid API integration, PostgreSQL database with Drizzle ORM, authentication system, and daily background jobs were all implemented with remarkable cohesion
- **Rapid Development**: The project demonstrates the power of modern development tools and platforms, showing how complex financial applications can be built efficiently

What would have taken weeks or months with traditional development approaches was accomplished in a fraction of the time, without sacrificing quality or features. This project stands as a testament to the capabilities of Replit's collaborative development environment and modern web technologies.

## ✨ Key Features

- **Financial Dashboard**: View your overall financial health at a glance with a comprehensive dashboard showcasing net worth trends, account balances, and recent transactions.
  
- **Secure Account Integration**: Connect securely to thousands of financial institutions using Plaid's trusted API.
  
- **Net Worth Tracking**: Automatically calculate and visualize your net worth over time, helping you track your financial progress.
  
- **Transaction Analysis**: View, categorize, and analyze your recent transactions across all connected accounts.
  
- **Goal Setting**: Define financial goals and track your progress toward achieving them.
  
- **Daily Data Synchronization**: Your financial data updates automatically every day to ensure you always have the most current information.

- **Retirement Forecast**: Plan for your financial future using the built-in retirement calculator and scenario comparison tools.

## 🛠️ Technical Stack

WealthVision is built with a modern, scalable tech stack:

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Secure session-based authentication
- **API Integration**: Plaid API for financial institution connectivity
- **Data Visualization**: Recharts for beautiful, interactive charts
- **Testing**: Jest and React Testing Library for unit and component testing

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

5. Access the application
   - Navigate to `http://localhost:5000`
   - Log in using test credentials:
     - Username: `test`
     - Password: `test`
   - Or create your own account by registering

### Running Tests

Tests have been implemented using Jest and React Testing Library. To run the test suite:

```bash
./run-tests.sh
```

The test suite includes:
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for API endpoints
- Mock implementations of database and external services

## 🧠 Technical Achievements

The development of WealthVision showcases several impressive technical achievements:

1. **Instant PostgreSQL Integration**: Seamlessly implemented a robust database layer with proper schema relations and migrations using Drizzle ORM.

2. **Secure Authentication System**:
   - Password hashing using scrypt with salting
   - Protection against common vulnerabilities like CSRF, XSS, and session hijacking
   - Proper session management with secure cookies

3. **Advanced Financial Calculator**:
   - Implementation of the 4% rule for retirement planning
   - Monte Carlo simulation for probability of retirement success
   - Scenario comparison tools for evaluating different financial paths

4. **Automated Background Jobs**:
   - Daily synchronization of financial data
   - Periodic net worth calculation
   - Efficient task scheduling using node-cron

5. **Responsive Design**:
   - Fully responsive UI that works seamlessly on mobile, tablet, and desktop
   - Dynamic layout adjustments based on viewport size
   - Touch-friendly interfaces for mobile users

6. **Testing Framework**:
   - Comprehensive test suite with high code coverage
   - Mock implementations for testing without external dependencies
   - Component testing with React Testing Library

## 📊 Visualizing Financial Progress

WealthVision provides rich visualization tools for understanding your financial situation:

- **Net Worth Chart**: Track how your wealth grows over time
- **Asset Allocation**: Understand the distribution of your investments
- **Spending Categories**: Visualize where your money goes
- **Retirement Readiness**: See if you're on track for your retirement goals

## 🔒 Security First

Financial data is sensitive, which is why WealthVision prioritizes security:

- **End-to-End Encryption**: All data in transit is encrypted using TLS
- **Database Encryption**: Sensitive fields like access tokens are encrypted at rest
- **OAuth Integration**: No need to store bank credentials
- **Regular Security Updates**: Continuous monitoring and updates for dependencies