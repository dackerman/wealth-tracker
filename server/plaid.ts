import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use 'sandbox' for testing, 'development' or 'production' for real data
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

/**
 * Create a link token for a user to initialize Plaid Link
 * @param userId - The ID of the user
 * @returns Object containing the link token and its expiration
 */
export async function createLinkToken(userId: string) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Wealth Tracker',
      products: [Products.Transactions, Products.Assets, Products.Liabilities],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return {
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

/**
 * Exchange a public token for an access token and item ID
 * @param publicToken - The public token received from Plaid Link
 * @returns Object containing the access token and item ID
 */
export async function exchangePublicToken(publicToken: string) {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

/**
 * Get information about an item (financial institution)
 * @param accessToken - The access token for the item
 * @returns Information about the item
 */
export async function getItemInfo(accessToken: string) {
  try {
    const response = await plaidClient.itemGet({
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting item info:', error);
    throw error;
  }
}

/**
 * Get information about an institution
 * @param institutionId - The ID of the institution from Plaid
 * @returns Information about the institution
 */
export async function getInstitutionInfo(institutionId: string) {
  try {
    const response = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    });

    return response.data.institution;
  } catch (error) {
    console.error('Error getting institution info:', error);
    throw error;
  }
}

/**
 * Get accounts for an item
 * @param accessToken - The access token for the item
 * @returns List of accounts
 */
export async function getAccounts(accessToken: string) {
  try {
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    return response.data.accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
}

/**
 * Get transactions for an item within a date range
 * @param accessToken - The access token for the item
 * @param startDate - The start date for transactions (YYYY-MM-DD)
 * @param endDate - The end date for transactions (YYYY-MM-DD)
 * @returns List of transactions
 */
export async function getTransactions(accessToken: string, startDate: string, endDate: string) {
  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    return {
      transactions: response.data.transactions,
      accounts: response.data.accounts
    };
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

/**
 * Get liabilities for an item
 * @param accessToken - The access token for the item
 * @returns Liabilities data
 */
export async function getLiabilities(accessToken: string) {
  try {
    const response = await plaidClient.liabilitiesGet({
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting liabilities:', error);
    throw error;
  }
}

/**
 * Get investment holdings for an item
 * @param accessToken - The access token for the item
 * @returns Investment holdings data
 */
export async function getInvestmentHoldings(accessToken: string) {
  try {
    const response = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting investment holdings:', error);
    throw error;
  }
}
