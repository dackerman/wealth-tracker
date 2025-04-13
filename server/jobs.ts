import * as cron from "node-cron";
import { storage } from "./storage";
import { getAccounts, getTransactions } from "./plaid";
import { log } from "./vite";

// Format date as YYYY-MM-DD for Plaid API
function formatDateForPlaid(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Sync financial data for all connected Plaid accounts
 */
export async function syncPlaidData() {
  try {
    log("Starting daily Plaid data sync job", "jobs");

    // Get institutions for user ID 1 (hardcoded for now)
    // In a real app, you would get all active users from the database
    const institutions = await storage.getInstitutionsByUserId(1);

    // Filter for institutions with Plaid connections
    const plaidInstitutions = institutions.filter(
      (institution) =>
        institution.plaidInstitutionId && institution.accessToken,
    );

    if (plaidInstitutions.length === 0) {
      log("No Plaid-connected institutions found, skipping sync", "jobs");
      return;
    }

    log(`Found ${plaidInstitutions.length} Plaid institutions to sync`, "jobs");

    // Date range for transactions: past 30 days to today
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDate = formatDateForPlaid(thirtyDaysAgo);
    const endDate = formatDateForPlaid(today);

    // Process each institution
    for (const institution of plaidInstitutions) {
      if (!institution.accessToken) continue;

      try {
        log(`Syncing data for institution: ${institution.name}`, "jobs");

        // 1. Sync accounts
        const accountsData = await getAccounts(institution.accessToken);

        // Get existing accounts for this institution
        const existingAccounts = await storage.getAccountsByInstitutionId(
          institution.id,
        );

        // Update existing accounts and add new ones
        for (const accountData of accountsData) {
          // Find if account exists
          const existingAccount = existingAccounts.find(
            (a) => a.plaidAccountId === accountData.account_id,
          );

          if (existingAccount) {
            // Update existing account
            await storage.updateAccount(existingAccount.id, {
              name: accountData.name,
              mask: accountData.mask || null,
              type: accountData.type,
              subtype: accountData.subtype || null,
              currentBalance: accountData.balances.current?.toString() || "0",
              availableBalance:
                accountData.balances.available?.toString() || "0",
              isoCurrencyCode: accountData.balances.iso_currency_code || null,
              lastUpdated: new Date(),
            });

            log(`Updated account: ${accountData.name}`, "jobs");
          }
          // No need to create new accounts here as they should be added during initial link
        }

        // 2. Sync transactions
        const transactionsData = await getTransactions(
          institution.accessToken,
          startDate,
          endDate,
        );

        // Get existing transaction IDs
        const allTransactions = await storage.getTransactionsByUserId(
          institution.userId,
        );
        const existingTransactionIds = new Set(
          allTransactions
            .filter((t) => t.plaidTransactionId)
            .map((t) => t.plaidTransactionId),
        );

        // Filter to only new transactions
        const newTransactions = transactionsData.transactions.filter(
          (t) => !existingTransactionIds.has(t.transaction_id),
        );

        // Get all accounts to map transactions to the correct account
        const allAccounts = await storage.getAccountsByUserId(
          institution.userId,
        );
        const accountMap = new Map(
          allAccounts.map((a) => [a.plaidAccountId, a.id]),
        );

        // Insert new transactions
        if (newTransactions.length > 0) {
          // Create array of valid transaction objects
          const transactionsToInsert = [];

          for (const t of newTransactions) {
            const accountId = accountMap.get(t.account_id);
            if (!accountId) continue;

            transactionsToInsert.push({
              plaidTransactionId: t.transaction_id,
              accountId: accountId,
              userId: institution.userId,
              name: t.name,
              merchantName: t.merchant_name || null,
              amount: t.amount.toString(),
              date: new Date(t.date),
              pending: t.pending || false,
              category: t.category ? t.category.join(", ") : null,
              paymentChannel: t.payment_channel,
              isoCurrencyCode: t.iso_currency_code || null,
            });
          }

          if (transactionsToInsert.length > 0) {
            await storage.createTransactions(transactionsToInsert);
            log(
              `Added ${transactionsToInsert.length} new transactions for ${institution.name}`,
              "jobs",
            );
          }
        } else {
          log(`No new transactions for ${institution.name}`, "jobs");
        }

        // 3. Update user's net worth
        await updateNetWorth(institution.userId);
        log(`Updated net worth for user ${institution.userId}`, "jobs");

        log(`Successfully synced data for ${institution.name}`, "jobs");
      } catch (error) {
        log(`Error syncing data for institution: ${institution.name}`, "jobs");
        console.error("Plaid sync error:", error);
      }
    }

    log("Daily Plaid data sync completed", "jobs");
  } catch (error) {
    log("Failed to run Plaid sync job", "jobs");
    console.error("Plaid sync job error:", error);
  }
}

/**
 * Update a user's net worth history with the latest account balances
 */
export async function updateNetWorth(userId: number) {
  try {
    const accounts = await storage.getAccountsByUserId(userId);

    // Calculate assets and liabilities
    let totalAssets = 0;
    let totalLiabilities = 0;

    // Breakdowns
    const assetsBreakdown = {
      cash: 0, // Checking, savings
      investments: 0, // Investment accounts, retirement
      realEstate: 0, // Property
      other: 0, // Other assets
    };

    const liabilitiesBreakdown = {
      mortgage: 0,
      creditCards: 0,
      studentLoans: 0,
      other: 0,
    };

    accounts.forEach((account) => {
      const balance = Number(account.currentBalance);

      if (balance >= 0) {
        totalAssets += balance;

        // Categorize for breakdown
        if (account.type === "depository") {
          assetsBreakdown.cash += balance;
        } else if (
          account.type === "investment" ||
          account.type === "retirement"
        ) {
          assetsBreakdown.investments += balance;
        } else if (
          account.type === "property" ||
          account.subtype === "real estate"
        ) {
          assetsBreakdown.realEstate += balance;
        } else {
          assetsBreakdown.other += balance;
        }
      } else {
        totalLiabilities += Math.abs(balance);

        // Categorize for breakdown
        if (account.type === "loan" && account.subtype === "mortgage") {
          liabilitiesBreakdown.mortgage += Math.abs(balance);
        } else if (account.type === "credit") {
          liabilitiesBreakdown.creditCards += Math.abs(balance);
        } else if (account.type === "loan" && account.subtype === "student") {
          liabilitiesBreakdown.studentLoans += Math.abs(balance);
        } else {
          liabilitiesBreakdown.other += Math.abs(balance);
        }
      }
    });

    const netWorth = totalAssets - totalLiabilities;

    // Convert to strings for storage (per schema requirements)
    const netWorthStr = netWorth.toString();
    const totalAssetsStr = totalAssets.toString();
    const totalLiabilitiesStr = totalLiabilities.toString();

    // Create net worth history entry
    await storage.createNetWorthHistory({
      userId,
      date: new Date(),
      totalAssets: totalAssetsStr,
      totalLiabilities: totalLiabilitiesStr,
      netWorth: netWorthStr,
      assetsBreakdown,
      liabilitiesBreakdown,
    });

    return { totalAssets, totalLiabilities, netWorth };
  } catch (error) {
    console.error("Error updating net worth:", error);
    throw error;
  }
}

/**
 * Schedule and start all background jobs
 */
export function startBackgroundJobs() {
  // Run daily at 1:00 AM
  cron.schedule("0 1 * * *", () => {
    syncPlaidData().catch((error) => {
      log("Failed to run scheduled Plaid sync job", "jobs");
      console.error("Scheduled job error:", error);
    });
  });

  log("Background jobs scheduled", "jobs");
}
