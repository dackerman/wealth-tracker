import cron from 'node-cron';
import { db } from './db';
import { storage } from './storage';
import { plaidClient, getAccounts, getTransactions } from './plaid';
import { institutions, accounts, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from './vite';

// Format date as YYYY-MM-DD for Plaid API
function formatDateForPlaid(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Sync financial data for all connected Plaid accounts
 */
async function syncPlaidData() {
  try {
    log('Starting daily Plaid data sync job', 'jobs');
    
    // Get all institutions that have a Plaid connection
    const plaidInstitutions = await db
      .select()
      .from(institutions)
      .where(
        // Only institutions with a Plaid ID and access token
        db.and(
          db.isNotNull(institutions.plaidInstitutionId),
          db.isNotNull(institutions.plaidAccessToken)
        )
      );
    
    if (plaidInstitutions.length === 0) {
      log('No Plaid-connected institutions found, skipping sync', 'jobs');
      return;
    }
    
    log(`Found ${plaidInstitutions.length} Plaid institutions to sync`, 'jobs');
    
    // Date range for transactions: past 30 days to today
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = formatDateForPlaid(thirtyDaysAgo);
    const endDate = formatDateForPlaid(today);
    
    // Process each institution
    for (const institution of plaidInstitutions) {
      if (!institution.plaidAccessToken) continue;
      
      try {
        log(`Syncing data for institution: ${institution.name}`, 'jobs');
        
        // 1. Sync accounts
        const accountsData = await getAccounts(institution.plaidAccessToken);
        
        // Update existing accounts and add new ones
        for (const accountData of accountsData.accounts) {
          // Check if account exists
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(eq(accounts.plaidAccountId, accountData.account_id))
            .limit(1);
          
          if (existingAccount.length > 0) {
            // Update existing account
            await db
              .update(accounts)
              .set({
                name: accountData.name,
                mask: accountData.mask ?? null,
                type: accountData.type,
                subtype: accountData.subtype ?? null,
                currentBalance: accountData.balances.current ?? 0,
                availableBalance: accountData.balances.available ?? 0,
                isoCurrencyCode: accountData.balances.iso_currency_code ?? null,
                lastUpdated: new Date()
              })
              .where(eq(accounts.plaidAccountId, accountData.account_id));
              
            log(`Updated account: ${accountData.name}`, 'jobs');
          }
          // No need to create new accounts here as they should be added during link
        }
        
        // 2. Sync transactions
        const transactionsData = await getTransactions(
          institution.plaidAccessToken,
          startDate,
          endDate
        );
        
        // Efficiently insert new transactions
        const existingTransactionIds = await db
          .select({ id: transactions.plaidTransactionId })
          .from(transactions)
          .where(
            db.and(
              db.isNotNull(transactions.plaidTransactionId),
              db.inArray(
                transactions.plaidTransactionId,
                transactionsData.transactions.map(t => t.transaction_id)
              )
            )
          );
        
        const existingIds = new Set(existingTransactionIds.map(t => t.id).filter(Boolean));
        
        // Filter to only new transactions
        const newTransactions = transactionsData.transactions.filter(
          t => !existingIds.has(t.transaction_id)
        );
        
        // Get all accounts to map transactions to the correct account
        const allAccounts = await db.select().from(accounts);
        const accountMap = new Map(allAccounts.map(a => [a.plaidAccountId, a.id]));
        
        // Insert new transactions
        if (newTransactions.length > 0) {
          const transactionsToInsert = newTransactions.map(t => {
            const accountId = accountMap.get(t.account_id);
            if (!accountId) return null;
            
            return {
              plaidTransactionId: t.transaction_id,
              accountId: accountId,
              userId: institution.userId,
              name: t.name,
              merchantName: t.merchant_name ?? null,
              amount: t.amount,
              date: new Date(t.date),
              pending: t.pending,
              category: t.category ? t.category.join(', ') : null,
              categoryId: t.category_id ?? null,
              paymentChannel: t.payment_channel,
              isoCurrencyCode: t.iso_currency_code ?? null
            };
          }).filter(Boolean);
          
          if (transactionsToInsert.length > 0) {
            await storage.createTransactions(transactionsToInsert);
            log(`Added ${transactionsToInsert.length} new transactions for ${institution.name}`, 'jobs');
          }
        } else {
          log(`No new transactions for ${institution.name}`, 'jobs');
        }
        
        // 3. Update user's net worth
        await updateNetWorth(institution.userId);
        log(`Updated net worth for user ${institution.userId}`, 'jobs');
        
        log(`Successfully synced data for ${institution.name}`, 'jobs');
      } catch (error) {
        log(`Error syncing data for institution: ${institution.name}`, 'jobs');
        console.error('Plaid sync error:', error);
      }
    }
    
    log('Daily Plaid data sync completed', 'jobs');
  } catch (error) {
    log('Failed to run Plaid sync job', 'jobs');
    console.error('Plaid sync job error:', error);
  }
}

/**
 * Update a user's net worth history with the latest account balances
 */
async function updateNetWorth(userId: number) {
  try {
    // Get all accounts for the user
    const userAccounts = await storage.getAccountsByUserId(userId);
    
    // Calculate total assets and liabilities
    let totalAssets = 0;
    let totalLiabilities = 0;
    
    for (const account of userAccounts) {
      const balance = account.currentBalance;
      
      if (account.isLiability) {
        totalLiabilities += balance;
      } else {
        totalAssets += balance;
      }
    }
    
    const netWorth = totalAssets - totalLiabilities;
    
    // Create a new net worth history entry
    await storage.createNetWorthHistory({
      userId: userId,
      date: new Date(),
      netWorth: netWorth,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities
    });
    
    return { netWorth, totalAssets, totalLiabilities };
  } catch (error) {
    console.error('Error updating net worth:', error);
    throw error;
  }
}

/**
 * Schedule and start all background jobs
 */
export function startBackgroundJobs() {
  // Run daily at 1:00 AM
  cron.schedule('0 1 * * *', () => {
    syncPlaidData().catch(error => {
      log('Failed to run scheduled Plaid sync job', 'jobs');
      console.error('Scheduled job error:', error);
    });
  });
  
  log('Background jobs scheduled', 'jobs');
  
  // Also export the function to be called manually if needed
  return {
    syncPlaidData,
    updateNetWorth
  };
}

// Export the update net worth function for use in routes.ts
export { updateNetWorth };