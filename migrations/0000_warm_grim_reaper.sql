CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_account_id" text NOT NULL,
	"institution_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"official_name" text,
	"type" text NOT NULL,
	"subtype" text,
	"mask" text,
	"current_balance" numeric NOT NULL,
	"available_balance" numeric,
	"limit" numeric,
	"iso_currency_code" text,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_institution_id" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"primary_color" text,
	"user_id" integer NOT NULL,
	"access_token" text,
	"item_id" text,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "net_worth_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_assets" numeric NOT NULL,
	"total_liabilities" numeric NOT NULL,
	"net_worth" numeric NOT NULL,
	"assets_breakdown" json,
	"liabilities_breakdown" json
);
--> statement-breakpoint
CREATE TABLE "plaid_link_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"link_token" text NOT NULL,
	"expiration" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_transaction_id" text NOT NULL,
	"account_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"merchant_name" text,
	"amount" numeric NOT NULL,
	"iso_currency_code" text,
	"date" timestamp NOT NULL,
	"category" json,
	"pending" boolean DEFAULT false,
	"account_owner" text,
	"payment_channel" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
