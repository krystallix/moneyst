# Moneyst — Project Analysis & Development Roadmap

## 1. Schema vs Implementation Matrix

| # | Schema Table | Supabase CRUD | UI Screen | Status |
|---|---|---|---|---|
| 1 | `users` | ✅ Full CRUD | ✅ Profile edit, Settings | **Done** |
| 2 | `accounts` | ✅ Full CRUD + `getNetWorth` | ⚠️ Selector only (in transaction) | **No CRUD UI** — cannot add/edit/delete accounts |
| 3 | `categories` | ✅ Full CRUD | ✅ List + Create + Edit | **Done** |
| 4 | `transactions` | ✅ Full CRUD + stats queries | ✅ List + Create + Edit + Detail | **Done** |
| 5 | `budgets` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 6 | `budget_categories` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 7 | `merchants` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 8 | `recurring_transactions` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 9 | `tags` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 10 | `transaction_tags` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 11 | `transaction_splits` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 12 | `currencies` | ✅ Generic CRUD | ❌ No UI | **Not Built** |
| 13 | `exchange_rates` | ✅ Generic CRUD | ❌ No UI | **Not Built** |

---

## 2. Existing Features — What's Built

### ✅ Fully Working
- **Auth:** Sign-in (email + Google), forgot password, check-email flow
- **Onboarding:** Profile setup (name, avatar, timezone, currency)
- **Home:** Balance card, monthly income/expense stats, recent activity list
- **Transactions:** Date-based list view (week strip), add new, edit, delete, custom date picker
- **Categories:** List, create new, edit existing (icon + color picker)
- **Settings:** Profile card, edit profile, sign out
- **Navigation:** Bottom tabs (Home, Transactions, +, Reports, Settings)

### ⚠️ Partially Working / Incomplete
| Feature | Issue |
|---|---|
| **Reports tab** | Placeholder only — "Coming soon" text, no actual data |
| **Account management** | Accounts are used as selectors when adding transactions, but there's **no screen to add, edit, or delete accounts** |
| **Transfer transactions** | Schema supports `to_account_id` + `transfer_pair_id`, but the UI always sets `is_transfer: false` — no transfer flow |
| **Camera/Receipt tab** | `app/(tabs)/new.tsx` imports `expo-camera` for receipt scanning — **crashes because `expo-camera` isn't installed** |
| **Balance update on transaction** | `current_balance` in accounts table is never updated when transactions are added |

---

## 3. Current Bugs (from error log)

| # | Bug | File | Fix Required |
|---|---|---|---|
| 1 | `AccountChip` not found | `transaction/new.tsx` | Component defined in old code was lost during merge — needs re-adding |
| 2 | `CategoryBottomSheet` not found | `transaction/new.tsx` | Same merge issue |
| 3 | `DateTimePicker` not found | `transaction/new.tsx` | Old import remains but code now uses `CustomDatePicker` — clean up dead import |
| 4 | "Text strings must be rendered within `<Text>`" | `category/[id].tsx:156` | Likely whitespace/newline between JSX tags |
| 5 | `expo-camera` not installed | `(tabs)/new.tsx` | Need to install or remove the camera feature |
| 6 | Layout warning: no route named "new" | `_layout.tsx` | Route `new` referenced in layout but doesn't exist at root |

---

## 4. Features NOT Built (from Schema)

### 🔴 Critical (Core Finance Features)
1. **Account Management** — Add/Edit/Delete wallets, bank accounts, credit cards
2. **Transfer Between Accounts** — Move money from Account A → Account B
3. **Balance Sync** — Auto-update `current_balance` when transaction is created/edited/deleted

### 🟡 Important (Engagement & Retention)
4. **Budget System** — Create budgets per category, track spending vs limits, alert thresholds
5. **Reports/Analytics** — Monthly breakdown, category spending charts, trends
6. **Recurring Transactions** — Set up auto-repeating bills/income

### 🟢 Nice to Have (Polish & Power Features)
7. **Tags** — Label transactions with custom tags for filtering
8. **Merchants** — Save frequent merchants and auto-categorize
9. **Transaction Splits** — Split a single transaction across multiple categories
10. **Multi-Currency** — Currency selector, exchange rate conversion
11. **Receipt Scanning** — Camera capture + storage (receipt_url field ready in schema)

---

## 5. Prioritized Development Roadmap

### Phase 0 — Fix Broken Things (Day 1)
> *Ship nothing new until the app doesn't crash*

- [ ] Fix `transaction/new.tsx` merge conflicts (restore `AccountChip`, `CategoryBottomSheet`, clean dead imports)
- [ ] Fix `category/[id].tsx` whitespace bug (line 155-156)
- [ ] Fix `_layout.tsx` route warning
- [ ] Either install `expo-camera` or remove the camera tab placeholder

---

### Phase 1 — Account Management (Day 2–3)
> *Users can't track finances without wallets*

- [ ] **Account List Screen** (`app/account.tsx`)
  - Show all accounts with balances, colors, icons
  - Total net worth at top
- [ ] **Add Account Screen** (`app/account/new.tsx`)
  - Name, type (cash/bank/credit/e-wallet), currency, initial balance
  - Icon & color picker (reuse category pattern)
- [ ] **Edit Account Screen** (`app/account/[id].tsx`)
  - Same form, pre-filled
  - Soft delete (set `is_active: false`)
- [ ] **Balance auto-update**
  - When a transaction is added: deduct from account (expense) or add (income)
  - When edited/deleted: reverse the old amount, apply new amount

---

### Phase 2 — Transfer Between Accounts (Day 4)
> *Essential for users with multiple wallets*

- [ ] Add "Transfer" as 3rd type in `transaction/new.tsx` (alongside expense/income)
- [ ] Show "From Account" + "To Account" selectors when transfer is selected
- [ ] On save: create 2 linked transactions (`transfer_pair_id`), update both account balances
- [ ] Display transfer icon (↔) in transaction list

---

### Phase 3 — Reports & Analytics (Day 5–7)
> *The main reason users keep a finance app*

- [ ] **Monthly Summary** — Total income, expense, savings rate
- [ ] **Category Breakdown** — Pie/donut chart of spending per category
- [ ] **Trend Line** — Income vs expenses over last 6 months
- [ ] **Date Range Picker** — Filter reports by custom period
- [ ] Use existing `getMonthlyStats` as foundation, add `getCategoryBreakdown` query

---

### Phase 4 — Budget System (Day 8–10)
> *Help users stay within limits*

- [ ] **Budget List Screen** — Active budgets with progress bars
- [ ] **Create Budget** — Name, period (weekly/monthly), total limit
- [ ] **Assign Categories** — Pick categories + set per-category limits
- [ ] **Budget Tracking** — Auto-calculate `spent_amount` from transactions
- [ ] **Alerts** — Visual warning when spending reaches `alert_threshold` (80% default)
- [ ] **Home Widget** — Show active budget progress on home screen

---

### Phase 5 — Power Features (Day 11+)
> *Differentiation & delight*

- [ ] **Recurring Transactions** — Setup screen, auto-create on `next_due_date`, reminders
- [ ] **Tags** — Tag management + add tags to transactions + filter by tag
- [ ] **Receipt Capture** — Camera integration, upload to Supabase Storage, link `receipt_url`
- [ ] **Multi-Currency** — Currency picker in account creation, exchange rate display
- [ ] **Transaction Splits** — Split one transaction across 2+ categories
- [ ] **Merchants** — Auto-suggest merchants based on category, quick re-entry

---

## 6. Quick Win Suggestions

| Quick Win | Impact | Effort |
|---|---|---|
| Fix all crashes (Phase 0) | 🔴 Critical | ~1 hour |
| Account CRUD screens | 🔴 High | ~4 hours |
| Reports placeholder → real charts | 🟡 Medium | ~6 hours |
| Transfer flow | 🟡 Medium | ~3 hours |
| Pull-to-refresh on transactions | 🟢 Low | ~15 min |

---

> [!IMPORTANT]
> **Phase 0 is mandatory before anything else.** The app currently crashes on launch due to missing components after the git merge. Fix those first, then proceed with Phase 1 (Account Management) as it's the biggest functional gap — users currently have no way to manage their wallets.
