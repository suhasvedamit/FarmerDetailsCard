# Supabase Database Schemas

This directory contains standalone SQL schema files for each database table used in the AgriStack Farmer ID Card web application.

Each file is completely self-contained and idempotent (can be safely run independently in the Supabase SQL Editor).

---

## Files

| File | Table | Purpose |
| :--- | :--- | :--- |
| [`extracted_records.sql`](./extracted_records.sql) | `extracted_records` | Stores raw farmer information parsed immediately from AgriStack PDFs. |
| [`generated_records.sql`](./generated_records.sql) | `generated_records` | Stores farmer information when the ID card is reviewed/generated, including field edits diffs and corrections count. |
| [`card_payments.sql`](./card_payments.sql) | `card_payments` | Stores Razorpay/gateway payment transactions and confirmation signatures for card downloads. |

---

## Setup Instructions

1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project and navigate to **SQL Editor** from the left navigation bar.
3. Open or copy the contents of each file:
   - Run `extracted_records.sql`
   - Run `generated_records.sql`
   - Run `card_payments.sql`
4. Click **Run** for each script.

Each script automatically configures:
- Table definitions with proper data types.
- Optimized performance indexes on key fields (`farmer_id`, `enrollment_no`, `session_id`, `created_at`, etc.).
- Schema and sequence permissions for `anon`, `authenticated`, and `service_role`.
- Row Level Security (RLS) policies allowing secure client-side insertion and retrieval.
