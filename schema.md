-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
```
CREATE TABLE moneyst.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  currency character NOT NULL DEFAULT 'IDR'::bpchar,
  initial_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  color text,
  icon text,
  institution text,
  account_number text,
  credit_limit numeric,
  interest_rate numeric,
  is_active boolean NOT NULL DEFAULT true,
  include_in_net_worth boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id)
);
CREATE TABLE moneyst.budget_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  budget_id uuid NOT NULL,
  category_id uuid NOT NULL,
  limit_amount numeric NOT NULL CHECK (limit_amount > 0::numeric),
  spent_amount numeric NOT NULL DEFAULT 0,
  CONSTRAINT budget_categories_pkey PRIMARY KEY (id),
  CONSTRAINT budget_categories_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES moneyst.budgets(id),
  CONSTRAINT budget_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES moneyst.categories(id)
);
CREATE TABLE moneyst.budgets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  period USER-DEFINED NOT NULL,
  start_date date NOT NULL,
  end_date date,
  total_limit numeric NOT NULL CHECK (total_limit > 0::numeric),
  currency character NOT NULL DEFAULT 'IDR'::bpchar,
  rollover boolean NOT NULL DEFAULT false,
  alert_threshold numeric NOT NULL DEFAULT 80.00,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id)
);
CREATE TABLE moneyst.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  name text NOT NULL,
  icon text,
  color text,
  type USER-DEFINED NOT NULL,
  parent_id uuid,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES moneyst.categories(id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id)
);
CREATE TABLE moneyst.currencies (
  code character NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT currencies_pkey PRIMARY KEY (code)
);
CREATE TABLE moneyst.exchange_rates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_currency character NOT NULL,
  to_currency character NOT NULL,
  rate numeric NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (id),
  CONSTRAINT exchange_rates_from_currency_fkey FOREIGN KEY (from_currency) REFERENCES moneyst.currencies(code),
  CONSTRAINT exchange_rates_to_currency_fkey FOREIGN KEY (to_currency) REFERENCES moneyst.currencies(code)
);
CREATE TABLE moneyst.merchants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category_id uuid,
  logo_url text,
  website text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT merchants_pkey PRIMARY KEY (id),
  CONSTRAINT merchants_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id),
  CONSTRAINT merchants_category_id_fkey FOREIGN KEY (category_id) REFERENCES moneyst.categories(id)
);
CREATE TABLE moneyst.recurring_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  category_id uuid,
  merchant_id uuid,
  type USER-DEFINED NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency character NOT NULL DEFAULT 'IDR'::bpchar,
  description text NOT NULL,
  interval USER-DEFINED NOT NULL,
  interval_count integer NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  end_date date,
  next_due_date date NOT NULL,
  last_executed date,
  is_active boolean NOT NULL DEFAULT true,
  auto_create boolean NOT NULL DEFAULT false,
  remind_days integer NOT NULL DEFAULT 3,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id),
  CONSTRAINT recurring_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES moneyst.accounts(id),
  CONSTRAINT recurring_transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES moneyst.categories(id),
  CONSTRAINT recurring_transactions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES moneyst.merchants(id)
);
CREATE TABLE moneyst.tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text,
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id)
);
CREATE TABLE moneyst.transaction_splits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL,
  category_id uuid,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  description text,
  CONSTRAINT transaction_splits_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_splits_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES moneyst.transactions(id),
  CONSTRAINT transaction_splits_category_id_fkey FOREIGN KEY (category_id) REFERENCES moneyst.categories(id)
);
CREATE TABLE moneyst.transaction_tags (
  transaction_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT transaction_tags_pkey PRIMARY KEY (transaction_id, tag_id),
  CONSTRAINT transaction_tags_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES moneyst.transactions(id),
  CONSTRAINT transaction_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES moneyst.tags(id)
);
CREATE TABLE moneyst.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  to_account_id uuid,
  category_id uuid,
  merchant_id uuid,
  type USER-DEFINED NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency character NOT NULL DEFAULT 'IDR'::bpchar,
  amount_in_base numeric,
  exchange_rate numeric,
  description text,
  notes text,
  date date NOT NULL,
  time time with time zone,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_id uuid,
  is_transfer boolean NOT NULL DEFAULT false,
  transfer_pair_id uuid,
  is_reviewed boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  receipt_url text,
  location text,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES moneyst.users(id),
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES moneyst.accounts(id),
  CONSTRAINT transactions_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES moneyst.accounts(id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES moneyst.categories(id),
  CONSTRAINT transactions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES moneyst.merchants(id)
);
CREATE TABLE moneyst.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  preferred_currency character NOT NULL DEFAULT 'IDR'::bpchar,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta'::text,
  locale text NOT NULL DEFAULT 'id-ID'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```