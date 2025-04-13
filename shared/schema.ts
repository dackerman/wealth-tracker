import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, foreignKey, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  institutions: many(institutions),
  accounts: many(accounts),
  transactions: many(transactions),
  netWorthHistory: many(netWorthHistory),
  plaidLinkTokens: many(plaidLinkTokens),
}));

// Financial Institution model
export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  plaidInstitutionId: text("plaid_institution_id").notNull(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  userId: integer("user_id").notNull(),
  accessToken: text("access_token"),
  itemId: text("item_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertInstitutionSchema = createInsertSchema(institutions).pick({
  plaidInstitutionId: true,
  name: true,
  logoUrl: true,
  primaryColor: true,
  userId: true,
  accessToken: true,
  itemId: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

// Define institution relations
export const institutionsRelations = relations(institutions, ({ one, many }) => ({
  user: one(users, {
    fields: [institutions.userId],
    references: [users.id],
  }),
  accounts: many(accounts),
}));

// Account model
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  plaidAccountId: text("plaid_account_id").notNull(),
  institutionId: integer("institution_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  officialName: text("official_name"),
  type: text("type").notNull(), // banking, credit, investment, loan, etc.
  subtype: text("subtype"),
  mask: text("mask"),
  currentBalance: numeric("current_balance").notNull(),
  availableBalance: numeric("available_balance"),
  limit: numeric("limit"),
  isoCurrencyCode: text("iso_currency_code"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  plaidAccountId: true,
  institutionId: true,
  userId: true,
  name: true,
  officialName: true,
  type: true,
  subtype: true,
  mask: true,
  currentBalance: true,
  availableBalance: true,
  limit: true,
  isoCurrencyCode: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Define account relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [accounts.institutionId],
    references: [institutions.id],
  }),
  transactions: many(transactions),
}));

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  plaidTransactionId: text("plaid_transaction_id").notNull(),
  accountId: integer("account_id").notNull(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  merchantName: text("merchant_name"),
  amount: numeric("amount").notNull(),
  isoCurrencyCode: text("iso_currency_code"),
  date: timestamp("date").notNull(),
  category: json("category"),
  pending: boolean("pending").default(false),
  accountOwner: text("account_owner"),
  paymentChannel: text("payment_channel"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  plaidTransactionId: true,
  accountId: true,
  userId: true,
  name: true,
  merchantName: true,
  amount: true,
  isoCurrencyCode: true,
  date: true,
  category: true,
  pending: true,
  accountOwner: true,
  paymentChannel: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Define transaction relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

// NetWorth history model - for tracking changes over time
export const netWorthHistory = pgTable("net_worth_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  totalAssets: numeric("total_assets").notNull(),
  totalLiabilities: numeric("total_liabilities").notNull(),
  netWorth: numeric("net_worth").notNull(),
  assetsBreakdown: json("assets_breakdown"), // Store the distribution of assets
  liabilitiesBreakdown: json("liabilities_breakdown"), // Store the distribution of liabilities
});

export const insertNetWorthHistorySchema = createInsertSchema(netWorthHistory).pick({
  userId: true,
  date: true,
  totalAssets: true,
  totalLiabilities: true,
  netWorth: true,
  assetsBreakdown: true,
  liabilitiesBreakdown: true,
});

export type InsertNetWorthHistory = z.infer<typeof insertNetWorthHistorySchema>;
export type NetWorthHistory = typeof netWorthHistory.$inferSelect;

// Define netWorthHistory relations
export const netWorthHistoryRelations = relations(netWorthHistory, ({ one }) => ({
  user: one(users, {
    fields: [netWorthHistory.userId],
    references: [users.id],
  }),
}));

// PlaidLinkToken - to store temporarily generated link tokens
export const plaidLinkTokens = pgTable("plaid_link_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  linkToken: text("link_token").notNull(),
  expiration: timestamp("expiration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlaidLinkTokenSchema = createInsertSchema(plaidLinkTokens).pick({
  userId: true,
  linkToken: true,
  expiration: true,
});

export type InsertPlaidLinkToken = z.infer<typeof insertPlaidLinkTokenSchema>;
export type PlaidLinkToken = typeof plaidLinkTokens.$inferSelect;

// Define plaidLinkToken relations
export const plaidLinkTokensRelations = relations(plaidLinkTokens, ({ one }) => ({
  user: one(users, {
    fields: [plaidLinkTokens.userId],
    references: [users.id],
  }),
}));
