-- ============================================================
-- SEED DATA – April 2026
-- user_id : e616a086-cc3d-4f26-9d9f-e3e85e6f54ec
--
-- Run order:
--   1. accounts   (wallets)
--   2. categories
--   3. transactions
--
-- NOTE: The moneyst.users row for this user must already exist
--       (created during auth / onboarding). This seed only
--       inserts accounts, categories, and transactions.
-- ============================================================

-- ── 1. Accounts (Wallets) ──────────────────────────────────────────────────────

INSERT INTO moneyst.accounts
  (id, user_id, name, type, currency, color, initial_balance, current_balance, is_active, include_in_net_worth, created_at, updated_at)
VALUES
  ('3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Cash', 'cash', 'IDR', '#34D399', 0, 0, true, true,
   now(), now()),

  ('71da63f4-1dd8-46e0-b71b-1ca2bd4fd701',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'BNI', 'bank', 'IDR', '#F59E0B', 0, 0, true, true,
   now(), now()),

  ('31d72504-a7a3-4d81-a76c-f20d820e8d48',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'BCA', 'bank', 'IDR', '#60A5FA', 0, 0, true, true,
   now(), now())
ON CONFLICT (id) DO NOTHING;


-- ── 2. Categories ──────────────────────────────────────────────────────────────

INSERT INTO moneyst.categories
  (id, user_id, name, icon, color, type, is_system, is_active, sort_order)
VALUES
  ('6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Food & Drinks', 'Utensils',    '#F97316', 'expense', false, true, 1),

  ('50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Nona''s',        'Gift',        '#F87171', 'expense', false, true, 2),

  ('170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Transportation', 'Car',        '#3B82F6', 'expense', false, true, 3),

  ('bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Lifestyle',      'Coffee',     '#786BEE', 'expense', false, true, 4),

  ('c2899529-056f-4df5-a767-d3ff4b0f20c3',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Shopping',       'ShoppingBag','#A855F7', 'expense', false, true, 5),

  ('fcd3eb4e-62e6-496a-9084-b05b8eaf9e43',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Investment',     'TrendingUp', '#22C55E', 'expense', false, true, 6),

  ('3e3cfc88-cc61-44c7-aea1-e02fb5767a17',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   'Parking',        'Car',        '#60A5FA', 'expense', false, true, 7)
ON CONFLICT (id) DO NOTHING;


-- ── 3. Transactions – April 2026 ───────────────────────────────────────────────
--
-- Column mapping from source data → moneyst.transactions:
--   wallet_id  → account_id
--   note       → description
--   type       → type  ('expense' | 'income' | 'transfer')
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO moneyst.transactions
  (id, user_id, account_id, category_id,
   type, amount, currency,
   description, date,
   is_recurring, is_transfer, is_reviewed, is_deleted,
   created_at, updated_at)
VALUES

  -- 2026-04-17
  ('774f9f7b-5b13-4c1f-af1f-73d61a949909',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 22000, 'IDR', 'Batagor SSA', '2026-04-17',
   false, false, false, false,
   '2026-04-17T20:54:59.082009+00:00','2026-04-17T20:54:59.082009+00:00'),

  ('6626d22d-c811-497c-aa3a-e383e968dc1f',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 29000, 'IDR', 'Sparepart', '2026-04-17',
   false, false, false, false,
   '2026-04-17T20:54:35.148424+00:00','2026-04-17T20:54:35.148424+00:00'),

  -- 2026-04-16
  ('97f3c4eb-aded-4f45-86de-23c24aa235c0',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'expense', 50000, 'IDR', 'Bensin', '2026-04-16',
   false, false, false, false,
   '2026-04-17T20:53:35.624667+00:00','2026-04-17T20:54:03.261000+00:00'),

  ('799a5046-a707-4201-b7d1-e4d1072c0ea1',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 41000, 'IDR', 'Terbis', '2026-04-16',
   false, false, false, false,
   '2026-04-17T20:53:19.131998+00:00','2026-04-17T20:53:51.126000+00:00'),

  -- 2026-04-15
  ('98410f82-9269-4447-ab54-f4da0f4c0ac0',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '71da63f4-1dd8-46e0-b71b-1ca2bd4fd701',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 65000, 'IDR', 'Kites', '2026-04-15',
   false, false, false, false,
   '2026-04-17T20:52:43.092011+00:00','2026-04-17T20:52:55.566000+00:00'),

  -- 2026-04-14
  ('b5fce47f-eab3-4775-bd01-324ab2fb5111',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '71da63f4-1dd8-46e0-b71b-1ca2bd4fd701',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 124000, 'IDR', 'PO FSTVLST III', '2026-04-14',
   false, false, false, false,
   '2026-04-17T20:52:14.337770+00:00','2026-04-17T20:52:14.337770+00:00'),

  ('6de8a388-05db-4962-8636-0700354b8b12',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '71da63f4-1dd8-46e0-b71b-1ca2bd4fd701',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 77400, 'IDR', 'Tabebuya', '2026-04-14',
   false, false, false, false,
   '2026-04-17T20:51:46.391225+00:00','2026-04-17T20:51:46.391225+00:00'),

  -- 2026-04-13
  ('577cb5a6-1e91-4f8e-a6c5-a5677ebeb060',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 9000, 'IDR', 'Indomaret', '2026-04-13',
   false, false, false, false,
   '2026-04-13T14:16:44.467509+00:00','2026-04-13T14:16:44.467509+00:00'),

  ('955c1bb4-6b18-40d2-82ed-f5e95cb1c657',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 145000, 'IDR', 'Kopiwet pule', '2026-04-13',
   false, false, false, false,
   '2026-04-13T14:16:17.466348+00:00','2026-04-13T14:16:17.466348+00:00'),

  ('a1386993-cc9e-4e68-a8ba-5a06dba8a001',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'expense', 55000, 'IDR', 'Bensin', '2026-04-13',
   false, false, false, false,
   '2026-04-13T14:12:20.286104+00:00','2026-04-13T14:12:20.286104+00:00'),

  -- 2026-04-12
  ('9ea68933-b086-4b53-a365-7250d467f135',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 36000, 'IDR', 'Es coklat', '2026-04-12',
   false, false, false, false,
   '2026-04-13T14:14:43.241508+00:00','2026-04-13T14:14:57.543000+00:00'),

  ('3c0dac75-c71f-4470-bc96-0ccb8ec86107',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 100000, 'IDR', 'Mantra bumi', '2026-04-12',
   false, false, false, false,
   '2026-04-13T14:14:25.903451+00:00','2026-04-13T14:14:49.370000+00:00'),

  -- 2026-04-11
  ('9c4fbbfa-c9cd-4eb1-8956-6f0ef33f70c1',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 17000, 'IDR', 'Kebab', '2026-04-11',
   false, false, false, false,
   '2026-04-13T14:12:59.990559+00:00','2026-04-13T14:14:05.876000+00:00'),

  ('0c5ba2e9-da9a-4637-9f49-bc2b1d67624c',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 13000, 'IDR', 'Alfamart', '2026-04-11',
   false, false, false, false,
   '2026-04-13T14:12:40.502572+00:00','2026-04-13T14:13:44.955000+00:00'),

  ('d927c159-d7c2-4a92-a25c-66ad5704a32e',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 50000, 'IDR', 'Bakso Bay', '2026-04-11',
   false, false, false, false,
   '2026-04-13T14:11:51.742971+00:00','2026-04-13T14:13:55.924000+00:00'),

  -- 2026-04-10
  ('5f8b1db1-3219-458d-96ce-b2703f3bf3b7',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'expense', 12000, 'IDR', 'Bensin', '2026-04-10',
   false, false, false, false,
   '2026-04-10T10:23:40.601557+00:00','2026-04-10T10:23:40.601557+00:00'),

  ('b9d7f31d-b6bd-4dae-a9f6-6117e543eaa8',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 20000, 'IDR', 'Nona''s', '2026-04-10',
   false, false, false, false,
   '2026-04-10T10:23:32.111935+00:00','2026-04-10T10:23:32.111935+00:00'),

  ('d0f6d7e1-7e28-4d59-9954-6de8ddb38995',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 18000, 'IDR', 'Roti', '2026-04-10',
   false, false, false, false,
   '2026-04-10T10:23:21.311197+00:00','2026-04-10T10:23:21.311197+00:00'),

  ('d2128923-69c4-436d-882f-cd5283ea9d6e',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 20000, 'IDR', 'Batagor', '2026-04-10',
   false, false, false, false,
   '2026-04-10T06:14:25.759674+00:00','2026-04-10T06:14:25.759674+00:00'),

  ('d5410bba-4885-4dca-807d-5aca20a52249',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 26000, 'IDR', 'Mie Ayam Bang W', '2026-04-10',
   false, false, false, false,
   '2026-04-10T06:14:00.964881+00:00','2026-04-10T06:14:00.964881+00:00'),

  ('fcda48cc-5522-44a3-a18d-82edd7eb695a',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 23000, 'IDR', 'Eskrim', '2026-04-10',
   false, false, false, false,
   '2026-04-10T06:13:45.849755+00:00','2026-04-10T06:13:45.849755+00:00'),

  -- 2026-04-08
  ('65416a4b-b0dc-4467-a099-84da3cb12a0e',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 13000, 'IDR', 'Pisang Ijo', '2026-04-08',
   false, false, false, false,
   '2026-04-08T16:04:19.488619+00:00','2026-04-08T16:04:37.769000+00:00'),

  ('254668df-12ff-454d-b539-8b7e0615e12e',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 20000, 'IDR', 'Pempek', '2026-04-08',
   false, false, false, false,
   '2026-04-08T16:04:07.971574+00:00','2026-04-08T16:04:07.971574+00:00'),

  ('452b3cfd-554d-4e09-8d36-757007fd76f6',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 60000, 'IDR', 'Kado Sepatu', '2026-04-08',
   false, false, false, false,
   '2026-04-08T16:03:27.602406+00:00','2026-04-08T16:03:27.602406+00:00'),

  ('758c7553-c7e6-4452-8cb6-90f8869a4b49',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 145000, 'IDR', 'Kado Ultah Tas', '2026-04-08',
   false, false, false, false,
   '2026-04-08T16:03:14.527332+00:00','2026-04-08T16:03:14.527332+00:00'),

  ('395078e8-476b-4278-81a3-9dbe88390ffa',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   'c2899529-056f-4df5-a767-d3ff4b0f20c3',
   'expense', 222000, 'IDR', 'Work Jacket', '2026-04-08',
   false, false, false, false,
   '2026-04-08T04:24:09.240281+00:00','2026-04-08T04:24:09.240281+00:00'),

  ('ccdc53f6-e127-4050-9259-c1284735151d',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 50000, 'IDR', 'Kado Ultah', '2026-04-08',
   false, false, false, false,
   '2026-04-08T04:20:45.452347+00:00','2026-04-08T04:20:45.452347+00:00'),

  ('101c970c-3294-46ec-87a0-1c4a970590a8',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '50027a29-18c1-4ce1-89bc-9ca6a975fe98',
   'expense', 50000, 'IDR', 'Kado Ultah', '2026-04-08',
   false, false, false, false,
   '2026-04-08T04:19:54.670009+00:00','2026-04-08T04:19:54.670009+00:00'),

  -- 2026-04-07
  ('396da84a-e44e-4d58-8247-6e9ba7af4361',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 66400, 'IDR', 'Cerita Makna', '2026-04-07',
   false, false, false, false,
   '2026-04-08T04:19:13.450367+00:00','2026-04-08T04:19:59.469000+00:00'),

  -- 2026-04-06
  ('84f2c4fb-6d12-4d3d-bac2-570774873e25',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 28000, 'IDR', 'Mie Ayam', '2026-04-06',
   false, false, false, false,
   '2026-04-06T09:11:43.637712+00:00','2026-04-06T09:11:43.637712+00:00'),

  ('6b54334e-5d16-4e58-ac75-adf0ddb0005c',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'expense', 30000, 'IDR', 'Tambal Ban', '2026-04-06',
   false, false, false, false,
   '2026-04-06T09:11:29.676099+00:00','2026-04-06T09:11:29.676099+00:00'),

  ('b3e7f3ce-7a08-4926-919e-130cd075bff9',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 21000, 'IDR', 'Ubi Cilembu', '2026-04-06',
   false, false, false, false,
   '2026-04-06T09:11:13.425347+00:00','2026-04-06T09:11:13.425347+00:00'),

  -- 2026-04-05
  ('708835f4-0def-4a73-8e12-bed74fb86284',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 83000, 'IDR', 'Kopi', '2026-04-05',
   false, false, false, false,
   '2026-04-05T12:39:53.657401+00:00','2026-04-05T12:39:53.657401+00:00'),

  -- 2026-04-04
  ('c9e5957d-34c6-4571-8229-7c1b5c7a24c6',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   'fcd3eb4e-62e6-496a-9084-b05b8eaf9e43',
   'expense', 110000, 'IDR', 'Aki', '2026-04-04',
   false, false, false, false,
   '2026-04-05T12:40:29.072113+00:00','2026-04-05T12:40:29.072113+00:00'),

  ('a8e17261-b2b9-4664-bc22-315659b1552a',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 21000, 'IDR', 'Siomay', '2026-04-04',
   false, false, false, false,
   '2026-04-05T12:39:13.680499+00:00','2026-04-05T12:39:13.680499+00:00'),

  ('c0c3ecb4-c0bc-4d06-977f-aab90ab4b2a8',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 370000, 'IDR', NULL, '2026-04-04',
   false, false, false, false,
   '2026-04-05T12:38:44.244797+00:00','2026-04-05T12:38:44.244797+00:00'),

  -- 2026-04-03
  ('de25b270-df62-4cfd-a213-f2e311a94ab6',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   'c2899529-056f-4df5-a767-d3ff4b0f20c3',
   'expense', 162000, 'IDR', 'Superindo', '2026-04-03',
   false, false, false, false,
   '2026-04-03T14:51:02.915550+00:00','2026-04-03T14:51:02.915550+00:00'),

  ('78cf0cfb-1a17-4fda-8bd0-37df5515d98d',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 67000, 'IDR', 'Kites', '2026-04-03',
   false, false, false, false,
   '2026-04-03T12:18:08.712648+00:00','2026-04-03T14:51:32.928000+00:00'),

  -- 2026-04-02
  ('86c2f896-c544-45dc-b862-dc5aceadc748',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '170fbb5f-2ac0-4f33-8b7f-57a25da9de54',
   'expense', 55000, 'IDR', 'Pertalite', '2026-04-02',
   false, false, false, false,
   '2026-04-02T13:58:37.688534+00:00','2026-04-02T13:58:37.688534+00:00'),

  ('35a578eb-5d19-4fb4-b6e4-875f304424fa',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 35000, 'IDR', 'Catridge', '2026-04-02',
   false, false, false, false,
   '2026-04-02T13:57:53.509128+00:00','2026-04-02T13:57:53.509128+00:00'),

  ('ad7b9eb6-d7f9-4a61-9dd1-e7238ca2c2ab',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 75000, 'IDR', 'Cerita Makna', '2026-04-02',
   false, false, false, false,
   '2026-04-02T13:57:02.991389+00:00','2026-04-02T13:57:02.991389+00:00'),

  -- 2026-04-01
  ('c0d5d8e2-087d-4298-be4e-616543fb676c',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   'bbb4a4b8-9427-4229-8348-4d215c82cae6',
   'expense', 35000, 'IDR', 'Catridge', '2026-04-01',
   false, false, false, false,
   '2026-04-02T13:57:33.209742+00:00','2026-04-02T13:57:33.209742+00:00'),

  ('e0db5fb1-fe74-4ddc-8f52-1e50f2c33c0b',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '3e3cfc88-cc61-44c7-aea1-e02fb5767a17',
   'expense', 2000, 'IDR', 'Parkir', '2026-04-01',
   false, false, false, false,
   '2026-04-01T13:47:20.476251+00:00','2026-04-01T13:47:20.476251+00:00'),

  ('77be35a7-83dc-424f-b133-25e37425ede8',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '3f7182e8-bcfe-4a20-90b3-f7be685b748c',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 18000, 'IDR', 'Superindo', '2026-04-01',
   false, false, false, false,
   '2026-04-01T13:43:52.228178+00:00','2026-04-01T13:43:52.228178+00:00'),

  ('b49eecb0-9d3a-488b-a365-a93e506efb61',
   'e616a086-cc3d-4f26-9d9f-e3e85e6f54ec',
   '31d72504-a7a3-4d81-a76c-f20d820e8d48',
   '6f43196a-10d2-443b-b4fc-aaf2bc9d2b27',
   'expense', 66900, 'IDR', 'Cerita Makna', '2026-04-01',
   false, false, false, false,
   '2026-04-01T09:51:30.436472+00:00','2026-04-01T09:51:30.436472+00:00')

ON CONFLICT (id) DO NOTHING;


-- ── Summary ────────────────────────────────────────────────────────────────────
-- Accounts  : 3  (Cash, BNI, BCA)
-- Categories: 7  (Food & Drinks, Nona's, Transportation, Lifestyle,
--                 Shopping, Investment, Parking)
-- Transactions: 45  (all type='expense', April 1–17 2026)
-- Total spend : 2,866,200 IDR
-- ─────────────────────────────────────────────────────────────────────────────
